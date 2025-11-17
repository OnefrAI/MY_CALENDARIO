document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('app-loader').style.display = 'none';
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('mainCalendarArea').classList.remove('hidden');
    initCalendar();
});

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SHIFT_TYPES = {'M':{label:'Manana',color:'#00ff88'},'T':{label:'Tarde',color:'#ff9500'},'N':{label:'Noche',color:'#5e5ce6'},'L':{label:'Libre',color:'#64d2ff'}};
const state = {currentDate:new Date(),selectedShiftType:null,shiftData:{},notes:{},cycles:[],calendars:{default:{name:'Mi Calendario',shifts:{},notes:{}}},activeCalendar:'default',isEditMode:false,isBuildingCycle:false,cycleBuilder:[]};

function initCalendar() {
    loadActiveCalendar();
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
    let weekNum = getWeekNumber(new Date(year, month, 1));
    
    for(let w=0; w<6; w++) {
        const wCell = document.createElement('div');
        wCell.className = 'day-cell week-number-cell';
        wCell.innerHTML = '<div class="day-number">' + weekNum + '</div>';
        grid.appendChild(wCell);
        weekNum++;
        
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
}

function createCell(date, num, isCurr, today) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if(!isCurr) cell.classList.add('other-month');
    if(date.getTime() === today.getTime()) cell.classList.add('current-day');
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-number';
    dayDiv.textContent = num;
    cell.appendChild(dayDiv);
    
    const dateStr = formatDate(date);
    const shift = state.shiftData[dateStr];
    
    if(shift && SHIFT_TYPES[shift]) {
        const sDiv = document.createElement('div');
        sDiv.className = 'shift-indicator';
        sDiv.textContent = shift;
        sDiv.style.backgroundColor = SHIFT_TYPES[shift].color;
        sDiv.style.color = '#000';
        cell.appendChild(sDiv);
    }
    
    if(state.notes[dateStr]) {
        const nDiv = document.createElement('div');
        nDiv.className = 'note-indicator';
        nDiv.innerHTML = '<i class="fas fa-sticky-note"></i>';
        cell.appendChild(nDiv);
    }
    
    if(isCurr && state.isEditMode && state.selectedShiftType) {
        cell.style.cursor = 'pointer';
        cell.onclick = function() { setShift(dateStr, state.selectedShiftType); };
    }
    
    if(isCurr) {
        cell.ondblclick = function() { showNote(dateStr, date); };
    }
    
    return cell;
}

function formatDate(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getWeekNumber(d) {
    const dd = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const dayNum = dd.getUTCDay() || 7;
    dd.setUTCDate(dd.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dd.getUTCFullYear(),0,1));
    return Math.ceil((((dd - yearStart)/86400000)+1)/7);
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

function updateTheme() {
    const btn = document.getElementById('themeToggleBtn');
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? '<i class="fas fa-moon"></i> Modo Oscuro' : '<i class="fas fa-sun"></i> Modo Claro';
}

const saved = localStorage.getItem('theme');
if(saved==='light') document.body.classList.add('light-mode');

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
                html += '<span class="px-2 py-1 rounded text-xs font-bold" style="background:' + SHIFT_TYPES[s].color + ';color:#000">' + s + '</span>';
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
        const span = document.createElement('span');
        span.className = 'px-2 py-1 rounded text-xs font-bold';
        span.style.background = SHIFT_TYPES[s].color;
        span.style.color = '#000';
        span.textContent = s;
        display.appendChild(span);
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
        html += '<span class="px-2 py-1 rounded text-xs font-bold" style="background:' + SHIFT_TYPES[s].color + ';color:#000">' + s + '</span>';
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
    html += '<p class="text-sm mb-2">2. Selecciona un turno (M, T, N, L)</p>';
    html += '<p class="text-sm">3. Haz click en los dias para asignar el turno</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-sync" style="color:var(--accent-primary)"></i> Ciclos de Turno</h4>';
    html += '<p class="text-sm mb-2">Para turnos que se repiten (ej: 6 trabajo, 6 libres):</p>';
    html += '<p class="text-sm mb-2">1. Menu → "Mis Ciclos"</p>';
    html += '<p class="text-sm mb-2">2. "Crear Nuevo Ciclo"</p>';
    html += '<p class="text-sm mb-2">3. Construye tu secuencia: M M M M M M L L L L L L</p>';
    html += '<p class="text-sm mb-2">4. Guardalo con un nombre</p>';
    html += '<p class="text-sm">5. Aplica el ciclo seleccionando dia de inicio y duracion</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-sticky-note" style="color:var(--accent-primary)"></i> Notas</h4>';
    html += '<p class="text-sm">Haz doble-click en cualquier dia para anadir una nota o recordatorio</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-calendar-alt" style="color:var(--accent-primary)"></i> Varios Calendarios</h4>';
    html += '<p class="text-sm mb-2">Puedes crear varios calendarios (ej: trabajo, personal, familia)</p>';
    html += '<p class="text-sm">Menu → Seccion "Calendarios" → Escribe nombre → Crear</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-keyboard" style="color:var(--accent-primary)"></i> Atajos</h4>';
    html += '<p class="text-sm mb-1">• Botones ← → para cambiar mes</p>';
    html += '<p class="text-sm mb-1">• Boton <i class="fas fa-calendar-day"></i> para volver a hoy</p>';
    html += '<p class="text-sm">• Menu hamburguesa ☰ para todas las opciones</p></div>';
    
    html += '<div class="mb-4"><h4 class="font-bold mb-2 flex items-center gap-2"><i class="fas fa-palette" style="color:var(--accent-primary)"></i> Colores de Turnos</h4>';
    html += '<div class="flex gap-2 flex-wrap">';
    html += '<span class="px-3 py-1 rounded font-bold" style="background:#00ff88;color:#000">M - Manana</span>';
    html += '<span class="px-3 py-1 rounded font-bold" style="background:#ff9500;color:#000">T - Tarde</span>';
    html += '<span class="px-3 py-1 rounded font-bold" style="background:#5e5ce6;color:#fff">N - Noche</span>';
    html += '<span class="px-3 py-1 rounded font-bold" style="background:#64d2ff;color:#000">L - Libre</span>';
    html += '</div></div>';
    
    html += '<button class="btn btn-primary w-full" onclick="closeModal(\'helpModal\')">Entendido</button>';
    html += '</div>';
    
    m.innerHTML = html;
    document.body.appendChild(m);
    m.onclick = function(e) { if(e.target === m) closeModal('helpModal'); };
}
