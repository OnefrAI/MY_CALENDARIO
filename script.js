// ==========================================
// CALENDARIO GUARD-IA - SCRIPT MÍNIMO FUNCIONAL
// ==========================================

// Ocultar el loader y mostrar el contenido cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Iniciando calendario...');
    
    // Ocultar loader
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Mostrar contenido
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.classList.remove('hidden');
    }
    
    // Mostrar área principal del calendario
    const mainCalendarArea = document.getElementById('mainCalendarArea');
    if (mainCalendarArea) {
        mainCalendarArea.classList.remove('hidden');
    }
    
    // Ocultar mensaje de "Selecciona o crea un calendario"
    const footerStatus = document.getElementById('footer-status');
    if (footerStatus) {
        footerStatus.style.display = 'none';
    }
    
    console.log('Calendario cargado correctamente');
    
    // Inicializar el calendario
    initCalendar();
});

// ==========================================
// CONSTANTES
// ==========================================

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SHIFT_TYPES = {
    'M': { label: 'Mañana', color: '#00ff88' },
    'T': { label: 'Tarde', color: '#ff9500' },
    'N': { label: 'Noche', color: '#5e5ce6' },
    'L': { label: 'Libre', color: '#64d2ff' }
};

// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================

const state = {
    currentDate: new Date(),
    selectedShiftType: null,
    shiftData: {}, // { 'YYYY-MM-DD': 'M'|'T'|'N'|'L' }
    isEditMode: false
};

// ==========================================
// INICIALIZAR CALENDARIO
// ==========================================

function initCalendar() {
    console.log('Inicializando calendario...');
    
    // Renderizar calendario
    renderCalendar();
    
    // Setup eventos
    setupEvents();
    
    console.log('Calendario inicializado');
}

// ==========================================
// RENDERIZAR CALENDARIO
// ==========================================

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    // Actualizar título del mes
    const monthYearDisplay = document.getElementById('currentMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${MONTH_NAMES[month]} ${year}`;
    }
    
    // Actualizar título del header móvil
    const calendarTitle = document.getElementById('calendarTitle');
    if (calendarTitle) {
        calendarTitle.textContent = `${MONTH_NAMES[month]} ${year}`;
    }
    
    // Obtener primer y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Primer día de la semana (0 = Domingo, ajustar para que empiece en Lunes)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // Domingo = 7
    
    // Días del mes anterior a mostrar
    const prevMonthDays = firstDayOfWeek - 1; // -1 porque empezamos en Lunes
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    
    // Generar grid
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Total de celdas a mostrar (6 semanas × 8 columnas = 48 celdas)
    // Primera columna es para números de semana
    const totalWeeks = 6;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dayCounter = 1 - prevMonthDays;
    let weekNumber = getWeekNumber(new Date(year, month, 1));
    
    for (let week = 0; week < totalWeeks; week++) {
        // Celda de número de semana
        const weekCell = createWeekNumberCell(weekNumber);
        calendarGrid.appendChild(weekCell);
        weekNumber++;
        
        // Días de la semana (Lunes a Domingo = 7 días)
        for (let day = 0; day < 7; day++) {
            let cellDate;
            let isCurrentMonth = true;
            let dayNumber;
            
            if (dayCounter < 1) {
                // Días del mes anterior
                dayNumber = prevMonthLastDay + dayCounter;
                cellDate = new Date(prevMonthYear, prevMonth, dayNumber);
                isCurrentMonth = false;
            } else if (dayCounter > daysInMonth) {
                // Días del mes siguiente
                dayNumber = dayCounter - daysInMonth;
                const nextMonth = month === 11 ? 0 : month + 1;
                const nextMonthYear = month === 11 ? year + 1 : year;
                cellDate = new Date(nextMonthYear, nextMonth, dayNumber);
                isCurrentMonth = false;
            } else {
                // Días del mes actual
                dayNumber = dayCounter;
                cellDate = new Date(year, month, dayNumber);
            }
            
            const cell = createDayCell(cellDate, dayNumber, isCurrentMonth, today);
            calendarGrid.appendChild(cell);
            
            dayCounter++;
        }
    }
}

// ==========================================
// CREAR CELDA DE NÚMERO DE SEMANA
// ==========================================

function createWeekNumberCell(weekNumber) {
    const cell = document.createElement('div');
    cell.className = 'day-cell week-number-cell';
    cell.innerHTML = `<div class="day-number">${weekNumber}</div>`;
    return cell;
}

// ==========================================
// CREAR CELDA DE DÍA
// ==========================================

function createDayCell(date, dayNumber, isCurrentMonth, today) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    if (!isCurrentMonth) {
        cell.classList.add('other-month');
    }
    
    // Verificar si es hoy
    if (date.getTime() === today.getTime()) {
        cell.classList.add('current-day');
    }
    
    // Crear número del día
    const dayNumberDiv = document.createElement('div');
    dayNumberDiv.className = 'day-number';
    dayNumberDiv.textContent = dayNumber;
    cell.appendChild(dayNumberDiv);
    
    // Obtener turno del día
    const dateStr = formatDate(date);
    const shiftType = state.shiftData[dateStr];
    
    if (shiftType && SHIFT_TYPES[shiftType]) {
        const shiftIndicator = document.createElement('div');
        shiftIndicator.className = 'shift-indicator';
        shiftIndicator.textContent = shiftType;
        shiftIndicator.style.backgroundColor = SHIFT_TYPES[shiftType].color;
        shiftIndicator.style.color = '#000';
        cell.appendChild(shiftIndicator);
    }
    
    // Evento click para editar (solo en mes actual)
    if (isCurrentMonth && state.isEditMode && state.selectedShiftType) {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            setShift(dateStr, state.selectedShiftType);
        });
    }
    
    return cell;
}

// ==========================================
// UTILIDADES
// ==========================================

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function setShift(dateStr, shiftType) {
    if (shiftType === 'erase') {
        delete state.shiftData[dateStr];
    } else {
        state.shiftData[dateStr] = shiftType;
    }
    renderCalendar();
    saveToLocalStorage();
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('guardia_shifts', JSON.stringify(state.shiftData));
    } catch (e) {
        console.error('Error guardando en localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('guardia_shifts');
        if (saved) {
            state.shiftData = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error cargando de localStorage:', e);
    }
}

// ==========================================
// SETUP EVENTOS
// ==========================================

function setupEvents() {
    // Navegación de mes
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            state.currentDate = new Date();
            renderCalendar();
        });
    }
    
    // FAB button (editar)
    const fabBtn = document.getElementById('fabEditBtn');
    const editPanel = document.getElementById('floatingEditPanel');
    
    if (fabBtn) {
        fabBtn.classList.remove('hidden');
        fabBtn.addEventListener('click', () => {
            state.isEditMode = !state.isEditMode;
            
            if (state.isEditMode) {
                fabBtn.classList.add('edit-active');
                if (editPanel) editPanel.classList.add('active');
            } else {
                fabBtn.classList.remove('edit-active');
                if (editPanel) editPanel.classList.remove('active');
                state.selectedShiftType = null;
                updateShiftButtons();
            }
            renderCalendar();
        });
    }
    
    // Cerrar panel de edición
    const closeEditPanelBtn = document.getElementById('closeEditPanelBtn');
    if (closeEditPanelBtn) {
        closeEditPanelBtn.addEventListener('click', () => {
            state.isEditMode = false;
            if (fabBtn) fabBtn.classList.remove('edit-active');
            if (editPanel) editPanel.classList.remove('active');
            state.selectedShiftType = null;
            updateShiftButtons();
            renderCalendar();
        });
    }
    
    // Botones de turnos
    setupShiftButtons();
    
    // Sidebar
    setupSidebar();
    
    // Cargar datos
    loadFromLocalStorage();
}

// ==========================================
// SETUP BOTONES DE TURNO
// ==========================================

function setupShiftButtons() {
    const shiftSelector = document.getElementById('shiftSelector');
    if (!shiftSelector) return;
    
    // Crear botones de turno
    shiftSelector.innerHTML = '';
    
    Object.entries(SHIFT_TYPES).forEach(([type, info]) => {
        const btn = document.createElement('button');
        btn.className = 'shift-button';
        btn.textContent = `${type} - ${info.label}`;
        btn.style.backgroundColor = info.color;
        btn.style.color = '#000';
        btn.dataset.shiftType = type;
        
        btn.addEventListener('click', () => {
            state.selectedShiftType = type;
            updateShiftButtons();
        });
        
        shiftSelector.appendChild(btn);
    });
    
    // Botón borrar
    const eraseBtn = document.querySelector('[data-shift-type="erase"]');
    if (eraseBtn) {
        eraseBtn.addEventListener('click', () => {
            state.selectedShiftType = 'erase';
            updateShiftButtons();
        });
    }
}

function updateShiftButtons() {
    document.querySelectorAll('.shift-button, .turno-btn').forEach(btn => {
        if (btn.dataset.shiftType === state.selectedShiftType) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// ==========================================
// SETUP SIDEBAR
// ==========================================

function setupSidebar() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    
    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }
    
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openSidebar);
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Botón de tema
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        updateThemeButton();
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// ==========================================
// TEMA CLARO/OSCURO
// ==========================================

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeButton();
}

function updateThemeButton() {
    const themeBtn = document.getElementById('themeToggleBtn');
    if (!themeBtn) return;
    
    const isLight = document.body.classList.contains('light-mode');
    themeBtn.innerHTML = isLight 
        ? '<i class="fas fa-moon"></i> Modo Oscuro'
        : '<i class="fas fa-sun"></i> Modo Claro';
}

// Cargar tema guardado
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
}

console.log('Script cargado completamente');
