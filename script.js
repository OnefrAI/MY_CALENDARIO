document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('app-loader').style.display = 'none';
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('mainCalendarArea').classList.remove('hidden');
    initCalendar();
});

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DEFAULT_SHIFT_TYPES = {'M':{label:'Mañana',color:'#00ff88',hours:8},'T':{label:'Tarde',color:'#ff9500',hours:8},'N':{label:'Noche',color:'#5e5ce6',hours:8},'L':{label:'Libre',color:'#64d2ff',hours:0}};
let SHIFT_TYPES = {...DEFAULT_SHIFT_TYPES};
const state = {currentDate:new Date(),selectedShiftType:null,shiftData:{},notes:{},cycles:[],calendars:{default:{name:'Mi Calendario',shifts:{},notes:{}}},activeCalendar:'default',isEditMode:false,isBuildingCycle:false,cycleBuilder:[],touchStartX:0,touchStartY:0,customShifts:{}};

function initCalendar() {
    loadActiveCalendar();
    loadCustomShifts();
    renderCalendar();
    setupEvents();
    loadData();
}

function loadActiveCalendar() {
    if(state.calendars[state.activeCalendar]) {
        state.shiftData = state.calendars[state.activeCalendar].shifts || {};
        state.notes = state.calendars[state.activeCalendar].notes || {};
    }
}

function loadCustomShifts() {
    try {
        const saved = localStorage.getItem('guardia_custom_shifts');
        if(saved) {
            state.customShifts = JSON.parse(saved);
            SHIFT_TYPES = {...DEFAULT_SHIFT_TYPES, ...state.customShifts};
        }
    } catch(e) {}
}

function saveCustomShifts() {
    localStorage.setItem('guardia_custom_shifts', JSON.stringify(state.customShifts));
    SHIFT_TYPES = {...DEFAULT_SHIFT_TYPES, ...state.customShifts};
}

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    document.getElementById('calendarTitle').textContent = MONTH_NAMES[month] + ' ' + year;
    
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    const prevMonthDays = firstDayOfWeek - 1;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let dayCounter = 1 - prevMonthDays;
    
    for(let w=0; w<6; w++) {
        for(let d=0; d<7; d++) {
            let cellDate, dayNum, isCurrent = true;
            
            if(dayCounter < 1) {
                dayNum = prevMonthLastDay + dayCounter;
                cellDate = new Date(prevMonthYear, prevMonth, dayNum);
                isCurrent = false;
            } else if(dayCounter > daysInMonth) {
                dayNum = dayCounter - daysInMonth;
                const nm = month === 11 ? 0 : month + 1;
                const ny = month === 11 ? year + 1 : year;
                cellDate = new Date(ny, nm, dayNum);
                isCurrent = false;
            } else {
                dayNum = dayCounter;
                cellDate = new Date(year, month, dayNum);
            }
            
            const cell = createCell(cellDate, dayNum, isCurrent, today);
            grid.appendChild(cell);
            dayCounter++;
        }
    }
    renderNotesHistory();
}

function renderNotesHistory() {
    const container = document.getElementById('notesHistory');
    if(!container) return;
    
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const monthNotes = [];
    
    Object.entries(state.notes).forEach(function(entry) {
        const dateStr = entry[0];
        const note = entry[1];
        const d = new Date(dateStr);
        if(d.getFullYear() === year && d.getMonth() === month) {
            monthNotes.push({date: d, dateStr: dateStr, note: note});
        }
    });
    
    if(monthNotes.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    
    monthNotes.sort(function(a, b) { return a.date - b.date; });
    
    container.style.display = 'block';
    let html = '<div class="notes-header"><i class="fas fa-sticky-note"></i> Notas del mes (' + monthNotes.length + ')</div>';
    
    monthNotes.forEach(function(item) {
        const dayNum = item.date.getDate();
        const dayName = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][item.date.getDay()];
        const shift = state.shiftData[item.dateStr];
        
        html += '<div class="note-item" onclick="showNoteFromHistory(\'' + item.dateStr + '\')">';
        html += '<div class="note-date">';
        html += '<div class="note-day-badge">' + dayNum + '</div>';
        html += '<div class="note-day-name">' + dayName + '</div>';
        if(shift && SHIFT_TYPES[shift]) {
            html += '<span class="note-shift-badge" style="background:' + SHIFT_TYPES[shift].color + ';color:#000">' + shift + '</span>';
        }
        html += '</div>';
        html += '<div class="note-text">' + item.note + '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

function showNoteFromHistory(dateStr) {
    const d = new Date(dateStr);
    showNote(dateStr, d);
}

function createCell(date, num, isCurr, today) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if(!isCurr) cell.classList.add('other-month');
    if(date.getTime() === today.getTime()) cell.classList.add('current-day');
    
    const isPast = date < today;
    if(isPast && isCurr) cell.classList.add('past-day');
    
    const dateStr = formatDate(date);
    const shift = state.shiftData[dateStr];
    
    // Si hay turno, colorear toda la casilla
    if(shift && SHIFT_TYPES[shift]) {
        cell.style.backgroundColor = SHIFT_TYPES[shift].color;
        cell.classList.add('has-shift');
        
        // Badge del tipo de turno en la esquina superior izquierda
        const shiftBadge = document.createElement('div');
        shiftBadge.className = 'shift-type-badge';
        shiftBadge.textContent = shift;
        cell.appendChild(shiftBadge);
    }
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-number';
    dayDiv.textContent = num;
    cell.appendChild(dayDiv);
    
    // Mostrar nota si existe
    if(state.notes[dateStr]) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-content';
        noteDiv.textContent = state.notes[dateStr];
        cell.appendChild(noteDiv);
    }
    
    if(isCurr) {
        cell.ondblclick = function() { showNote(dateStr, date); };
        
        if(state.isEditMode) {
            cell.style.cursor = 'pointer';
            cell.onclick = function() {
                if(state.selectedShiftType) {
                    setShift(dateStr, state.selectedShiftType);
                } else {
                    showToast('Selecciona un turno primero');
                }
            };
        }
    }
    
    return cell;
}

function formatDate(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function setShift(dateStr, type) {
    if(type==='erase') delete state.shiftData[dateStr]; else state.shiftData[dateStr]=type;
    saveData();
    renderCalendar();
}

function showNote(dateStr, date) {
    const ex = state.notes[dateStr] || '';
    const m = document.createElement('div');
    m.className = 'modal-overlay visible';
    m.innerHTML = '<div class="modal-content"><h3 class="text-lg font-bold mb-3">Nota ' + date.getDate() + '/' + (date.getMonth()+1) + '</h3><textarea id="noteText" class="form-input w-full mb-3" rows="4">'+ex+'</textarea><div class="flex gap-2"><button id="saveNote" class="btn btn-primary flex-1">Guardar</button><button id="delNote" class="btn btn-danger flex-1">Borrar</button><button id="cancelNote" class="btn btn-secondary flex-1">Cancelar</button></div></div>';
    document.body.appendChild(m);
    
    document.getElementById('saveNote').onclick = function() {
        const txt = document.getElementById('noteText').value.trim();
        if(txt) state.notes[dateStr]=txt; else delete state.notes[dateStr];
        saveData();
        renderCalendar();
        document.body.removeChild(m);
    };
    document.getElementById('delNote').onclick = function() {
        delete state.notes[dateStr];
        saveData();
        renderCalendar();
        document.body.removeChild(m);
    };
    document.getElementById('cancelNote').onclick = function() {
        document.body.removeChild(m);
    };
    m.onclick = function(e) { if(e.target===m) document.body.removeChild(m); };
}

function saveData() {
    state.calendars[state.activeCalendar].shifts = state.shiftData;
    state.calendars[state.activeCalendar].notes = state.notes;
    localStorage.setItem('guardia_calendars', JSON.stringify(state.calendars));
    localStorage.setItem('guardia_active', state.activeCalendar);
    localStorage.setItem('guardia_cycles', JSON.stringify(state.cycles));
}

function loadData() {
    try {
        const cals = localStorage.getItem('guardia_calendars');
        if(cals) state.calendars = JSON.parse(cals);
        const active = localStorage.getItem('guardia_active');
        if(active) state.activeCalendar = active;
        const c = localStorage.getItem('guardia_cycles');
        if(c) state.cycles = JSON.parse(c);
        loadActiveCalendar();
        updateCalendarSelector();
        renderCalendar();
    } catch(e) {}
}

function setupEvents() {
    document.getElementById('prevMonth').onclick = function() {
        state.currentDate.setMonth(state.currentDate.getMonth()-1);
        renderCalendar();
    };
    document.getElementById('nextMonth').onclick = function() {
        state.currentDate.setMonth(state.currentDate.getMonth()+1);
        renderCalendar();
    };
    document.getElementById('todayBtn').onclick = function() {
        state.currentDate = new Date();
        renderCalendar();
    };
    
    const fab = document.getElementById('fabEditBtn');
    const panel = document.getElementById('floatingEditPanel');
    fab.classList.remove('hidden');
    
    fab.onclick = function() {
        state.isEditMode = !state.isEditMode;
        if(state.isEditMode) {
            fab.classList.add('edit-active');
            panel.classList.add('active');
        } else {
            fab.classList.remove('edit-active');
            panel.classList.remove('active');
            state.selectedShiftType = null;
            updateBtns();
        }
        renderCalendar();
    };
    
    document.getElementById('closeEditPanelBtn').onclick = function() {
        state.isEditMode = false;
        fab.classList.remove('edit-active');
        panel.classList.remove('active');
        state.selectedShiftType = null;
        updateBtns();
        renderCalendar();
    };
    
    setupShiftBtns();
    setupSidebar();
    setupSwipeGestures();
}

function setupShiftBtns() {
    const sel = document.getElementById('shiftSelector');
    sel.innerHTML = '';
    Object.entries(SHIFT_TYPES).forEach(function(e) {
        const btn = document.createElement('button');
        btn.className = 'shift-button';
        btn.textContent = e[0] + ' - ' + e[1].label;
        btn.style.backgroundColor = e[1].color;
        btn.style.color = '#000';
        btn.dataset.shiftType = e[0];
        btn.onclick = function() { state.selectedShiftType=e[0]; updateBtns(); };
        sel.appendChild(btn);
    });
    
    const eBtn = document.querySelector('[data-shift-type="erase"]');
    if(eBtn) eBtn.onclick = function() { state.selectedShiftType='erase'; updateBtns(); };
}

function updateBtns() {
    document.querySelectorAll('.shift-button, .turno-btn').forEach(function(b) {
        if(b.dataset.shiftType === state.selectedShiftType) b.classList.add('selected');
        else b.classList.remove('selected');
    });
}

function setupSidebar() {
    const ham = document.getElementById('hamburgerBtn');
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebarOverlay');
    const close = document.getElementById('closeSidebarBtn');
    
    function open() { sb.classList.add('active'); ov.classList.add('active'); }
    function closeSb() { sb.classList.remove('active'); ov.classList.remove('active'); }
    
    ham.onclick = open;
    close.onclick = closeSb;
    ov.onclick = closeSb;
    
    const theme = document.getElementById('themeToggleBtn');
    updateTheme();
    theme.onclick = function() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight?'light':'dark');
        updateTheme();
    };
    
    document.getElementById('manageCyclesBtn').onclick = function() {
        closeSb();
        showCyclesManager();
    };
    
    document.getElementById('manageCustomShiftsBtn').onclick = function() {
        closeSb();
        showCustomShiftsManager();
    };
    
    document.getElementById('calendarSelector').onchange = function() {
        state.activeCalendar = this.value;
        loadActiveCalendar();
        renderCalendar();
    };
    
    document.getElementById('addCalendarBtn').onclick = function() {
        const name = document.getElementById('newCalendarName').value.trim();
        if(!name) { alert('Escribe un nombre'); return; }
        const id = 'cal_' + Date.now();
        state.calendars[id] = {name: name, shifts: {}, notes: {}};
        state.activeCalendar = id;
        loadActiveCalendar();
        updateCalendarSelector();
        saveData();
        renderCalendar();
        document.getElementById('newCalendarName').value = '';
        showToast('Calendario creado');
    };
    
    document.getElementById('deleteCalendarBtn').onclick = function() {
        if(state.activeCalendar === 'default') {
            alert('No puedes borrar el calendario principal');
            return;
        }
        if(confirm('¿Borrar este calendario?')) {
            delete state.calendars[state.activeCalendar];
            state.activeCalendar = 'default';
            loadActiveCalendar();
            updateCalendarSelector();
            saveData();
            renderCalendar();
            showToast('Calendario borrado');
        }
    };
    
    document.getElementById('clearAllShiftsBtn').onclick = function() {
        if(confirm('¿Borrar TODOS los turnos y notas del calendario actual? Esta accion no se puede deshacer')) {
            state.shiftData = {};
            state.notes = {};
            saveData();
            renderCalendar();
            showToast('Calendario limpiado');
        }
    };
    
    document.getElementById('helpBtn').onclick = function() {
        closeSb();
        showHelp();
    };
}

function showCustomShiftsManager() {
    const m = document.createElement('div');
    m.id = 'customShiftsModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:600px;max-height:80vh;overflow-y:auto;">';
    html += '<h3 class="text-xl font-bold mb-4"><i class="fas fa-palette"></i> Mis Turnos Personalizados</h3>';
    
    html += '<div class="mb-4 p-3 rounded-lg" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
    html += '<h4 class="font-bold mb-2 text-sm">Turnos por Defecto (No editables)</h4>';
    html += '<div class="flex gap-2 flex-wrap">';
    Object.entries(DEFAULT_SHIFT_TYPES).forEach(function(e) {
        html += '<span class="px-3 py-1 rounded text-sm font-bold" style="background:' + e[1].color + ';color:#000">';
        html += e[0] + ' - ' + e[1].label + ' (' + e[1].hours + 'h)</span>';
    });
    html += '</div></div>';
    
    if(Object.keys(state.customShifts).length === 0) {
        html += '<p class="text-center mb-4" style="color:var(--text-secondary)">No tienes turnos personalizados</p>';
    } else {
        html += '<div class="mb-4">';
        html += '<h4 class="font-bold mb-2 text-sm">Tus Turnos Personalizados</h4>';
        Object.entries(state.customShifts).forEach(function(e) {
            html += '<div class="mb-2 p-2 rounded-lg flex justify-between items-center" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
            html += '<span class="px-3 py-1 rounded font-bold" style="background:' + e[1].color + ';color:#000">';
            html += e[0] + ' - ' + e[1].label + ' (' + e[1].hours + 'h)</span>';
            html += '<div class="flex gap-1">';
            html += '<button class="btn-icon btn-secondary" onclick="editCustomShift(\'' + e[0] + '\')"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-icon btn-danger" onclick="deleteCustomShift(\'' + e[0] + '\')"><i class="fas fa-trash"></i></button>';
            html += '</div></div>';
        });
        html += '</div>';
    }
    
    html += '<button class="btn btn-primary w-full mt-3" onclick="createCustomShift()"><i class="fas fa-plus"></i> Crear Nuevo Turno</button>';
    html += '<button class="btn btn-secondary w-full mt-2" onclick="closeModal(\'customShiftsModal\')">Cerrar</button>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    m.onclick = function(e) { if(e.target === m) closeModal('customShiftsModal'); };
}

function createCustomShift() {
    closeModal('customShiftsModal');
    const m = document.createElement('div');
    m.id = 'createShiftModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:500px">';
    html += '<h3 class="text-lg font-bold mb-3"><i class="fas fa-plus"></i> Crear Turno Personalizado</h3>';
    
    html += '<label class="block mb-2 text-sm font-bold">Letra/Código (1-2 caracteres):</label>';
    html += '<input type="text" id="shiftCode" class="form-input w-full mb-3" placeholder="Ej: G, F, M12" maxlength="3">';
    
    html += '<label class="block mb-2 text-sm font-bold">Nombre del turno:</label>';
    html += '<input type="text" id="shiftLabel" class="form-input w-full mb-3" placeholder="Ej: Guardia 24h, Formación">';
    
    html += '<label class="block mb-2 text-sm font-bold">Duración (horas):</label>';
    html += '<input type="number" id="shiftHours" class="form-input w-full mb-3" placeholder="Ej: 8, 12, 24" min="0" max="24" value="8">';
    
    html += '<label class="block mb-2 text-sm font-bold">Color:</label>';
    html += '<div class="flex gap-2 mb-3 flex-wrap">';
    const colors = ['#00ff88','#ff9500','#5e5ce6','#64d2ff','#f43f5e','#ec4899','#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#84cc16'];
    colors.forEach(function(c) {
        html += '<button class="color-picker-btn" style="background:' + c + '" data-color="' + c + '" onclick="selectColor(\'' + c + '\')"></button>';
    });
    html += '</div>';
    html += '<input type="color" id="shiftColor" class="form-input w-full mb-3" value="#00ff88">';
    
    html += '<div id="shiftPreview" class="p-3 rounded-lg mb-3 text-center" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
    html += '<div class="text-xs mb-2" style="color:var(--text-secondary)">Vista previa:</div>';
    html += '<span id="previewBadge" class="px-4 py-2 rounded font-bold text-lg" style="background:#00ff88;color:#000">?</span>';
    html += '</div>';
    
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-primary flex-1" onclick="saveNewCustomShift()"><i class="fas fa-save"></i> Guardar</button>';
    html += '<button class="btn btn-secondary flex-1" onclick="closeModal(\'createShiftModal\');showCustomShiftsManager()">Cancelar</button>';
    html += '</div></div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    
    document.getElementById('shiftCode').oninput = updateShiftPreview;
    document.getElementById('shiftLabel').oninput = updateShiftPreview;
    document.getElementById('shiftColor').oninput = updateShiftPreview;
    updateShiftPreview();
}

function selectColor(color) {
    document.getElementById('shiftColor').value = color;
    updateShiftPreview();
    document.querySelectorAll('.color-picker-btn').forEach(function(btn) {
        if(btn.dataset.color === color) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function updateShiftPreview() {
    const code = document.getElementById('shiftCode').value.toUpperCase() || '?';
    const color = document.getElementById('shiftColor').value;
    const preview = document.getElementById('previewBadge');
    if(preview) {
        preview.textContent = code;
        preview.style.background = color;
    }
}

function saveNewCustomShift() {
    const code = document.getElementById('shiftCode').value.toUpperCase().trim();
    const label = document.getElementById('shiftLabel').value.trim();
    const hours = parseInt(document.getElementById('shiftHours').value) || 8;
    const color = document.getElementById('shiftColor').value;
    
    if(!code || code.length > 3) { alert('El código debe tener 1-3 caracteres'); return; }
    if(!label) { alert('Pon un nombre al turno'); return; }
    if(DEFAULT_SHIFT_TYPES[code]) { alert('Este código está reservado para turnos por defecto'); return; }
    
    state.customShifts[code] = {label: label, color: color, hours: hours};
    saveCustomShifts();
    setupShiftBtns();
    closeModal('createShiftModal');
    showCustomShiftsManager();
    showToast('Turno creado: ' + code);
}

function editCustomShift(code) {
    const shift = state.customShifts[code];
    closeModal('customShiftsModal');
    
    const m = document.createElement('div');
    m.id = 'editShiftModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:500px">';
    html += '<h3 class="text-lg font-bold mb-3"><i class="fas fa-edit"></i> Editar Turno: ' + code + '</h3>';
    
    html += '<label class="block mb-2 text-sm font-bold">Nombre del turno:</label>';
    html += '<input type="text" id="shiftLabel" class="form-input w-full mb-3" value="' + shift.label + '">';
    
    html += '<label class="block mb-2 text-sm font-bold">Duración (horas):</label>';
    html += '<input type="number" id="shiftHours" class="form-input w-full mb-3" min="0" max="24" value="' + shift.hours + '">';
    
    html += '<label class="block mb-2 text-sm font-bold">Color:</label>';
    html += '<div class="flex gap-2 mb-3 flex-wrap">';
    const colors = ['#00ff88','#ff9500','#5e5ce6','#64d2ff','#f43f5e','#ec4899','#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#84cc16'];
    colors.forEach(function(c) {
        html += '<button class="color-picker-btn ' + (c===shift.color?'selected':'') + '" style="background:' + c + '" data-color="' + c + '" onclick="selectColor(\'' + c + '\')"></button>';
    });
    html += '</div>';
    html += '<input type="color" id="shiftColor" class="form-input w-full mb-3" value="' + shift.color + '">';
    
    html += '<div id="shiftPreview" class="p-3 rounded-lg mb-3 text-center" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
    html += '<span id="previewBadge" class="px-4 py-2 rounded font-bold text-lg" style="background:' + shift.color + ';color:#000">' + code + '</span>';
    html += '</div>';
    
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-primary flex-1" onclick="updateCustomShift(\'' + code + '\')"><i class="fas fa-save"></i> Guardar</button>';
    html += '<button class="btn btn-secondary flex-1" onclick="closeModal(\'editShiftModal\');showCustomShiftsManager()">Cancelar</button>';
    html += '</div></div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    
    document.getElementById('shiftLabel').oninput = function() {
        document.getElementById('previewBadge').textContent = code;
    };
    document.getElementById('shiftColor').oninput = function() {
        document.getElementById('previewBadge').style.background = this.value;
    };
}

function updateCustomShift(code) {
    const label = document.getElementById('shiftLabel').value.trim();
    const hours = parseInt(document.getElementById('shiftHours').value) || 8;
    const color = document.getElementById('shiftColor').value;
    
    if(!label) { alert('El nombre no puede estar vacío'); return; }
    
    state.customShifts[code] = {label: label, color: color, hours: hours};
    saveCustomShifts();
    setupShiftBtns();
    renderCalendar();
    closeModal('editShiftModal');
    showCustomShiftsManager();
    showToast('Turno actualizado');
}

function deleteCustomShift(code) {
    if(confirm('¿Borrar el turno "' + code + '"? Los días con este turno quedarán sin turno asignado.')) {
        delete state.customShifts[code];
        saveCustomShifts();
        setupShiftBtns();
        renderCalendar();
        closeModal('customShiftsModal');
        showCustomShiftsManager();
        showToast('Turno eliminado');
    }
}

function updateTheme() {
    const btn = document.getElementById('themeToggleBtn');
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? '<i class="fas fa-moon"></i> Modo Oscuro' : '<i class="fas fa-sun"></i> Modo Claro';
}

const saved = localStorage.getItem('theme');
if(saved==='light') document.body.classList.add('light-mode');

function setupSwipeGestures() {
    const calendarArea = document.getElementById('mainCalendarArea');
    const calendarGrid = document.getElementById('calendarGrid');
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    calendarArea.addEventListener('touchstart', function(e) {
        if(state.isEditMode) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, {passive: true});
    
    calendarArea.addEventListener('touchmove', function(e) {
        if(!isDragging || state.isEditMode) return;
        
        const currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        
        if(Math.abs(diffX) > 20) {
            calendarGrid.classList.add('swipe-transition');
        }
    }, {passive: true});
    
    calendarArea.addEventListener('touchend', function(e) {
        if(!isDragging || state.isEditMode) return;
        isDragging = false;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        calendarGrid.classList.remove('swipe-transition');
        
        if(Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
            if(diffX > 0) {
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            } else {
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            }
            renderCalendar();
        }
    }, {passive: true});
}

function showCyclesManager() {
    const m = document.createElement('div');
    m.id = 'cyclesModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:600px;max-height:80vh;overflow-y:auto;"><h3 class="text-xl font-bold mb-4"><i class="fas fa-sync"></i> Mis Ciclos de Turno</h3>';
    
    if(state.cycles.length === 0) {
        html += '<p class="text-center mb-4" style="color:var(--text-secondary)">No tienes ciclos guardados</p>';
    } else {
        state.cycles.forEach(function(cycle, idx) {
            html += '<div class="mb-3 p-3 rounded-lg" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
            html += '<div class="flex justify-between items-start mb-2">';
            html += '<div><strong>' + cycle.name + '</strong><br><span class="text-xs" style="color:var(--text-secondary)">' + cycle.pattern.length + ' dias</span></div>';
            html += '<div class="flex gap-1"><button class="btn-icon btn-primary" onclick="applyCycle(' + idx + ')"><i class="fas fa-play"></i></button>';
            html += '<button class="btn-icon btn-secondary" onclick="editCycle(' + idx + ')"><i class="fas fa-edit"></i></button>';
            html += '<button class="btn-icon btn-danger" onclick="deleteCycle(' + idx + ')"><i class="fas fa-trash"></i></button></div></div>';
            html += '<div class="flex gap-1 flex-wrap">';
            cycle.pattern.forEach(function(s) {
                if(SHIFT_TYPES[s]) {
                    html += '<span class="px-2 py-1 rounded text-xs font-bold" style="background:' + SHIFT_TYPES[s].color + ';color:#000">' + s + '</span>';
                }
            });
            html += '</div></div>';
        });
    }
    
    html += '<button class="btn btn-primary w-full mt-3" onclick="createNewCycle()"><i class="fas fa-plus"></i> Crear Nuevo Ciclo</button>';
    html += '<button class="btn btn-secondary w-full mt-2" onclick="closeModal(\'cyclesModal\')">Cerrar</button>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    m.onclick = function(e) { if(e.target === m) closeModal('cyclesModal'); };
}

function createNewCycle() {
    closeModal('cyclesModal');
    const m = document.createElement('div');
    m.id = 'createCycleModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:500px"><h3 class="text-lg font-bold mb-3">Crear Ciclo</h3>';
    html += '<label class="block mb-2 text-sm font-bold">Nombre del ciclo:</label>';
    html += '<input type="text" id="cycleName" class="form-input w-full mb-3" placeholder="Ej: Turno 6x6">';
    html += '<label class="block mb-2 text-sm font-bold">Construye tu secuencia:</label>';
    html += '<div class="flex gap-2 mb-3 flex-wrap">';
    Object.entries(SHIFT_TYPES).forEach(function(e) {
        html += '<button class="btn" style="background:' + e[1].color + ';color:#000" onclick="addToCycle(\'' + e[0] + '\')">' + e[0] + '</button>';
    });
    html += '<button class="btn btn-danger" onclick="removeLastFromCycle()"><i class="fas fa-backspace"></i></button>';
    html += '</div>';
    html += '<div id="cyclePreview" class="p-3 rounded-lg mb-3 min-h-[60px]" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
    html += '<div class="text-xs mb-1" style="color:var(--text-secondary)">Secuencia (0 dias):</div>';
    html += '<div id="cyclePatternDisplay" class="flex gap-1 flex-wrap"></div>';
    html += '</div>';
    html += '<div class="flex gap-2"><button class="btn btn-primary flex-1" onclick="saveCycle()"><i class="fas fa-save"></i> Guardar</button>';
    html += '<button class="btn btn-secondary flex-1" onclick="cancelCycleCreation()">Cancelar</button></div>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    state.cycleBuilder = [];
}

function addToCycle(shiftType) {
    state.cycleBuilder.push(shiftType);
    updateCyclePreview();
}

function removeLastFromCycle() {
    state.cycleBuilder.pop();
    updateCyclePreview();
}

function updateCyclePreview() {
    const display = document.getElementById('cyclePatternDisplay');
    const preview = document.getElementById('cyclePreview');
    if(!display) return;
    
    display.innerHTML = '';
    state.cycleBuilder.forEach(function(s) {
        if(SHIFT_TYPES[s]) {
            const span = document.createElement('span');
            span.className = 'px-2 py-1 rounded text-xs font-bold';
            span.style.background = SHIFT_TYPES[s].color;
            span.style.color = '#000';
            span.textContent = s;
            display.appendChild(span);
        }
    });
    
    preview.querySelector('.text-xs').textContent = 'Secuencia (' + state.cycleBuilder.length + ' dias):';
}

function saveCycle() {
    const name = document.getElementById('cycleName').value.trim();
    if(!name) { alert('Pon un nombre al ciclo'); return; }
    if(state.cycleBuilder.length === 0) { alert('Anade turnos a la secuencia'); return; }
    
    state.cycles.push({
        name: name,
        pattern: [...state.cycleBuilder]
    });
    
    saveData();
    closeModal('createCycleModal');
    showCyclesManager();
}

function cancelCycleCreation() {
    state.cycleBuilder = [];
    closeModal('createCycleModal');
    showCyclesManager();
}

function editCycle(idx) {
    const cycle = state.cycles[idx];
    closeModal('cyclesModal');
    
    const m = document.createElement('div');
    m.id = 'editCycleModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:500px"><h3 class="text-lg font-bold mb-3">Editar Ciclo</h3>';
    html += '<label class="block mb-2 text-sm font-bold">Nombre:</label>';
    html += '<input type="text" id="cycleName" class="form-input w-full mb-3" value="' + cycle.name + '">';
    html += '<label class="block mb-2 text-sm font-bold">Secuencia:</label>';
    html += '<div class="flex gap-2 mb-3 flex-wrap">';
    Object.entries(SHIFT_TYPES).forEach(function(e) {
        html += '<button class="btn" style="background:' + e[1].color + ';color:#000" onclick="addToCycle(\'' + e[0] + '\')">' + e[0] + '</button>';
    });
    html += '<button class="btn btn-danger" onclick="removeLastFromCycle()"><i class="fas fa-backspace"></i></button>';
    html += '</div>';
    html += '<div id="cyclePreview" class="p-3 rounded-lg mb-3 min-h-[60px]" style="background:var(--bg-tertiary);border:1px solid var(--border-primary)">';
    html += '<div class="text-xs mb-1" style="color:var(--text-secondary)">Secuencia:</div>';
    html += '<div id="cyclePatternDisplay" class="flex gap-1 flex-wrap"></div></div>';
    html += '<div class="flex gap-2"><button class="btn btn-primary flex-1" onclick="updateCycle(' + idx + ')"><i class="fas fa-save"></i> Guardar</button>';
    html += '<button class="btn btn-secondary flex-1" onclick="closeModal(\'editCycleModal\');showCyclesManager()">Cancelar</button></div>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    
    state.cycleBuilder = [...cycle.pattern];
    updateCyclePreview();
}

function updateCycle(idx) {
    const name = document.getElementById('cycleName').value.trim();
    if(!name || state.cycleBuilder.length === 0) { alert('Completa los datos'); return; }
    
    state.cycles[idx] = {
        name: name,
        pattern: [...state.cycleBuilder]
    };
    
    saveData();
    closeModal('editCycleModal');
    showCyclesManager();
}

function deleteCycle(idx) {
    if(confirm('¿Borrar este ciclo?')) {
        state.cycles.splice(idx, 1);
        saveData();
        closeModal('cyclesModal');
        showCyclesManager();
    }
}

function applyCycle(idx) {
    const cycle = state.cycles[idx];
    closeModal('cyclesModal');
    
    const m = document.createElement('div');
    m.id = 'applyCycleModal';
    m.className = 'modal-overlay visible';
    
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    
    let html = '<div class="modal-content" style="max-width:500px"><h3 class="text-lg font-bold mb-3">Aplicar Ciclo: ' + cycle.name + '</h3>';
    html += '<div class="mb-3 p-3 rounded-lg" style="background:var(--bg-tertiary)"><div class="text-xs mb-2" style="color:var(--text-secondary)">Secuencia (' + cycle.pattern.length + ' dias):</div>';
    html += '<div class="flex gap-1 flex-wrap">';
    cycle.pattern.forEach(function(s) {
        if(SHIFT_TYPES[s]) {
            html += '<span class="px-2 py-1 rounded text-xs font-bold" style="background:' + SHIFT_TYPES[s].color + ';color:#000">' + s + '</span>';
        }
    });
    html += '</div></div>';
    html += '<label class="block mb-2 text-sm font-bold">Dia de inicio:</label>';
    html += '<input type="date" id="cycleStartDate" class="form-input w-full mb-3" value="' + todayStr + '">';
    html += '<label class="block mb-2 text-sm font-bold">Aplicar hasta:</label>';
    html += '<select id="cycleEndType" class="form-select w-full mb-3">';
    html += '<option value="3">3 meses</option>';
    html += '<option value="6">6 meses</option>';
    html += '<option value="12">12 meses</option>';
    html += '<option value="custom">Fecha personalizada</option>';
    html += '</select>';
    html += '<input type="date" id="cycleEndDate" class="form-input w-full mb-3 hidden">';
    html += '<div class="flex gap-2"><button class="btn btn-primary flex-1" onclick="confirmApplyCycle(' + idx + ')"><i class="fas fa-check"></i> Aplicar</button>';
    html += '<button class="btn btn-secondary flex-1" onclick="closeModal(\'applyCycleModal\');showCyclesManager()">Cancelar</button></div>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    
    document.getElementById('cycleEndType').onchange = function() {
        const custom = document.getElementById('cycleEndDate');
        if(this.value === 'custom') custom.classList.remove('hidden');
        else custom.classList.add('hidden');
    };
}

function confirmApplyCycle(idx) {
    const cycle = state.cycles[idx];
    const startDateStr = document.getElementById('cycleStartDate').value;
    if(!startDateStr) { alert('Selecciona fecha de inicio'); return; }
    
    const startDate = new Date(startDateStr + 'T00:00:00');
    let endDate;
    
    const endType = document.getElementById('cycleEndType').value;
    if(endType === 'custom') {
        const endDateStr = document.getElementById('cycleEndDate').value;
        if(!endDateStr) { alert('Selecciona fecha final'); return; }
        endDate = new Date(endDateStr + 'T00:00:00');
    } else {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(endType));
    }
    
    let currentDate = new Date(startDate);
    let patternIdx = 0;
    
    while(currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        state.shiftData[dateStr] = cycle.pattern[patternIdx];
        
        patternIdx = (patternIdx + 1) % cycle.pattern.length;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    saveData();
    renderCalendar();
    closeModal('applyCycleModal');
    showToast('Ciclo aplicado correctamente');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if(m) document.body.removeChild(m);
}

function updateCalendarSelector() {
    const sel = document.getElementById('calendarSelector');
    sel.innerHTML = '';
    Object.entries(state.calendars).forEach(function(e) {
        const opt = document.createElement('option');
        opt.value = e[0];
        opt.textContent = e[1].name;
        if(e[0] === state.activeCalendar) opt.selected = true;
        sel.appendChild(opt);
    });
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { 
        if(toast.parentNode) document.body.removeChild(toast); 
    }, 2500);
}

function showHelp() {
    const m = document.createElement('div');
    m.id = 'helpModal';
    m.className = 'modal-overlay visible';
    
    let html = '<div class="modal-content" style="max-width:600px;max-height:80vh;overflow-y:auto">';
    html += '<h3 class="text-xl font-bold mb-4"><i class="fas fa-question-circle"></i> Como usar el Calendario</h3>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-edit" style="color:var(--accent-primary)"></i> Editar Turnos</h4>';
    html += '<p class="text-sm mb-2">1. Pulsa el boton verde <i class="fas fa-edit"></i> (abajo derecha)</p>';
    html += '<p class="text-sm mb-2">2. Selecciona un turno (M, T, N, L o personalizados)</p>';
    html += '<p class="text-sm">3. Haz click en los dias para asignar el turno</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-palette" style="color:var(--accent-primary)"></i> Turnos Personalizados</h4>';
    html += '<p class="text-sm mb-2">Crea tus propios turnos con letra, nombre, color y horas:</p>';
    html += '<p class="text-sm mb-2">1. Menu → "Mis Turnos"</p>';
    html += '<p class="text-sm mb-2">2. "Crear Nuevo Turno"</p>';
    html += '<p class="text-sm">3. Define codigo (G, F, M12...), nombre, color y duracion</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-sync" style="color:var(--accent-primary)"></i> Ciclos de Turno</h4>';
    html += '<p class="text-sm mb-2">Para turnos que se repiten:</p>';
    html += '<p class="text-sm mb-2">1. Menu → "Mis Ciclos"</p>';
    html += '<p class="text-sm mb-2">2. "Crear Nuevo Ciclo"</p>';
    html += '<p class="text-sm mb-2">3. Construye tu secuencia con cualquier turno</p>';
    html += '<p class="text-sm">4. Aplica el ciclo con fecha de inicio y duracion</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-sticky-note" style="color:var(--accent-primary)"></i> Notas</h4>';
    html += '<p class="text-sm">Haz doble-click en cualquier dia para anadir una nota</p></div>';
    
    html += '<button class="btn btn-primary w-full" onclick="closeModal(\'helpModal\')">Entendido</button>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    m.onclick = function(e) { if(e.target === m) closeModal('helpModal'); };
}
