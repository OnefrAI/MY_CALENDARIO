document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('app-loader').style.display = 'none';
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('mainCalendarArea').classList.remove('hidden');
    initCalendar();
});

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SHIFT_TYPES = {'M':{label:'Manana',color:'#00ff88'},'T':{label:'Tarde',color:'#ff9500'},'N':{label:'Noche',color:'#5e5ce6'},'L':{label:'Libre',color:'#64d2ff'}};
const state = {currentDate:new Date(),selectedShiftType:null,shiftData:{},notes:{},isEditMode:false};

function initCalendar() {
    renderCalendar();
    setupEvents();
    loadData();
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
    localStorage.setItem('guardia_shifts', JSON.stringify(state.shiftData));
    localStorage.setItem('guardia_notes', JSON.stringify(state.notes));
}

function loadData() {
    try {
        const s = localStorage.getItem('guardia_shifts');
        if(s) state.shiftData = JSON.parse(s);
        const n = localStorage.getItem('guardia_notes');
        if(n) state.notes = JSON.parse(n);
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
}

function updateTheme() {
    const btn = document.getElementById('themeToggleBtn');
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? '<i class="fas fa-moon"></i> Modo Oscuro' : '<i class="fas fa-sun"></i> Modo Claro';
}

const saved = localStorage.getItem('theme');
if(saved==='light') document.body.classList.add('light-mode');
