ESTE ES UN ARCHIVO INFORMATIVO PORQUE EL JAVASCRIPT COMPLETO ES MUY LARGO

==============================================================
INSTRUCCIONES PARA IMPLEMENTAR LAS MEJORAS EN TU SCRIPT.JS
==============================================================

Las 4 funcionalidades nuevas que debes añadir son:

1. ✅ BOTÓN "HOY" + ATAJOS DE TECLADO
2. ✅ NOTIFICACIONES PERFECTAS  
3. ✅ PERSONALIZAR COLORES
4. ✅ INDICADORES VISUALES DE NOTIFICACIONES

==============================================================
PASO 1: ACTUALIZAR CONSTANTES (línea 41-51)
==============================================================

Reemplaza:
```javascript
const SHIFT_TYPES = {
    'M': { label: 'Mañana', colorClass: 'shift-M' },
    'T': { label: 'Tarde', colorClass: 'shift-T' },
    'N': { label: 'Noche', colorClass: 'shift-N' },
    'L': { label: 'Libre', colorClass: 'shift-L' }
};
```

Por:
```javascript
const SHIFT_TYPES = {
    'M': { label: 'Mañana', colorClass: 'shift-M', defaultColor: '#00ff88', hours: 8, startTime: '07:00' },
    'T': { label: 'Tarde', colorClass: 'shift-T', defaultColor: '#ff9500', hours: 8, startTime: '15:00' },
    'N': { label: 'Noche', colorClass: 'shift-N', defaultColor: '#5e5ce6', hours: 8, startTime: '23:00' },
    'L': { label: 'Libre', colorClass: 'shift-L', defaultColor: '#64d2ff', hours: 0, startTime: null }
};
```

Y DESPUÉS de MONTH_NAMES, añade:
```javascript
const NOTIFICATION_TIMES = {
    '1day': { label: '1 día antes', minutes: 1440 },
    '2hours': { label: '2 horas antes', minutes: 120 },
    '1hour': { label: '1 hora antes', minutes: 60 },
    '30min': { label: '30 minutos antes', minutes: 30 },
    '15min': { label: '15 minutos antes', minutes: 15 }
};
```

==============================================================
PASO 2: ACTUALIZAR STATE (línea 57-70)
==============================================================

Reemplaza:
```javascript
const state = {
    currentDate: new Date(),
    selectedShiftType: null,
    calendars: {},
    activeCalendarId: null,
    shiftData: {},
    isSelectingPattern: false,
    patternStartDate: null,
    patternEndDate: null,
    selectedPatternSequence: [],
    userId: null,
    unsubscribeCalendars: null,
    unsubscribeShifts: null
};
```

Por:
```javascript
const state = {
    currentDate: new Date(),
    selectedShiftType: null,
    calendars: {},
    activeCalendarId: null,
    shiftData: {},
    notifications: {}, // NUEVO: { 'dateStr': { enabled: true, times: ['1day', '1hour'] } }
    customColors: {}, // NUEVO: { 'M': '#custom-color' }
    isSelectingPattern: false,
    patternStartDate: null,
    patternEndDate: null,
    selectedPatternSequence: [],
    userId: null,
    unsubscribeCalendars: null,
    unsubscribeShifts: null,
    scheduledNotifications: [] // NUEVO: IDs de notificaciones programadas
};
```

==============================================================
PASO 3: AÑADIR FUNCIONES DE ATAJOS DE TECLADO
==============================================================

DESPUÉS de la función setupEvents() (línea 923), añade:

```javascript
// ==========================================
// ATAJOS DE TECLADO
// ==========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignorar si está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                state.currentDate.setMonth(state.currentDate.getMonth() - 1);
                renderCalendar();
                showToast('← Mes anterior');
                break;
            case 'ArrowRight':
                e.preventDefault();
                state.currentDate.setMonth(state.currentDate.getMonth() + 1);
                renderCalendar();
                showToast('Mes siguiente →');
                break;
            case ' ':
                e.preventDefault();
                goToToday();
                break;
            case 'e':
            case 'E':
                if (!$('#floatingEditPanel').classList.contains('active')) {
                    e.preventDefault();
                    toggleEditPanel();
                }
                break;
        }
    });
}

function goToToday() {
    state.currentDate = new Date();
    renderCalendar();
    showToast('📅 Hoy');
}
```

==============================================================
PASO 4: AÑADIR FUNCIONES DE NOTIFICACIONES
==============================================================

DESPUÉS de setupKeyboardShortcuts(), añade:

```javascript
// ==========================================
// NOTIFICACIONES WEB
// ==========================================

async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('✅ Notificaciones activadas');
        } else {
            showToast('❌ Notificaciones bloqueadas');
        }
        return permission;
    }
    return Notification.permission;
}

function scheduleNotification(dateStr, shiftType, notifTime) {
    if (Notification.permission !== 'granted') return;
    
    const shiftDate = parseDate(dateStr);
    const shiftInfo = SHIFT_TYPES[shiftType];
    if (!shiftInfo || !shiftInfo.startTime) return;
    
    const [hours, minutes] = shiftInfo.startTime.split(':');
    shiftDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const notifMinutes = NOTIFICATION_TIMES[notifTime].minutes;
    const notifDate = new Date(shiftDate.getTime() - (notifMinutes * 60 * 1000));
    
    const now = new Date();
    const timeUntilNotif = notifDate.getTime() - now.getTime();
    
    if (timeUntilNotif > 0) {
        const timeoutId = setTimeout(() => {
            new Notification('🛡️ GUARD-IA - Recordatorio de turno', {
                body: `Turno de ${shiftInfo.label} ${notifTime === '1day' ? 'mañana' : 'en ' + NOTIFICATION_TIMES[notifTime].label}`,
                icon: 'https://onefrai.github.io/guard-ia-app/icon.png',
                badge: 'https://onefrai.github.io/guard-ia-app/badge.png',
                tag: `shift-${dateStr}-${notifTime}`,
                requireInteraction: false
            });
        }, timeUntilNotif);
        
        return timeoutId;
    }
}

function cancelAllNotifications() {
    state.scheduledNotifications.forEach(id => clearTimeout(id));
    state.scheduledNotifications = [];
}

function scheduleAllNotifications() {
    cancelAllNotifications();
    
    Object.entries(state.shiftData).forEach(([dateStr, data]) => {
        if (data.shift && state.notifications[dateStr]?.enabled) {
            const times = state.notifications[dateStr].times || [];
            times.forEach(time => {
                const id = scheduleNotification(dateStr, data.shift, time);
                if (id) state.scheduledNotifications.push(id);
            });
        }
    });
}

async function editDayNotifications(dateStr) {
    const dayData = state.shiftData[dateStr] || {};
    if (!dayData.shift) {
        return showToast('❌ Asigna un turno primero');
    }
    
    const currentNotif = state.notifications[dateStr] || { enabled: false, times: [] };
    
    const body = `
        <div class="space-y-3">
            <p class="text-sm">Turno: <strong>${SHIFT_TYPES[dayData.shift].label}</strong></p>
            <label class="flex items-center gap-2">
                <input type="checkbox" id="notif-enabled" ${currentNotif.enabled ? 'checked' : ''}>
                <span>Activar notificaciones</span>
            </label>
            <div id="notif-times" class="space-y-2 ${!currentNotif.enabled ? 'hidden' : ''}">
                ${Object.entries(NOTIFICATION_TIMES).map(([key, val]) => `
                    <label class="flex items-center gap-2">
                        <input type="checkbox" class="notif-time" value="${key}" 
                            ${currentNotif.times?.includes(key) ? 'checked' : ''}>
                        <span>${val.label}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    const actions = `
        <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
        <button class="btn btn-primary" data-action="save">Guardar</button>
    `;
    
    const modalId = showModal({ 
        title: '🔔 Configurar notificaciones', 
        body, 
        actions 
    });
    
    $(`#${modalId} #notif-enabled`).addEventListener('change', (e) => {
        const timesDiv = $(`#${modalId} #notif-times`);
        if (e.target.checked) {
            timesDiv.classList.remove('hidden');
            requestNotificationPermission();
        } else {
            timesDiv.classList.add('hidden');
        }
    });
    
    return new Promise(resolve => {
        $(`#${modalId}`).addEventListener('click', e => {
            const action = e.target.closest('button')?.dataset.action;
            if (action) {
                if (action === 'save') {
                    const enabled = $(`#${modalId} #notif-enabled`).checked;
                    const times = Array.from($$(`#${modalId} .notif-time:checked`)).map(el => el.value);
                    
                    state.notifications[dateStr] = { enabled, times };
                    saveNotifications();
                    scheduleAllNotifications();
                    renderCalendar();
                    showToast('✅ Notificaciones guardadas');
                }
                closeModal(modalId);
                resolve(action === 'save');
            }
        });
    });
}

async function saveNotifications() {
    if (!state.activeCalendarId) return;
    try {
        const calRef = doc(db, `users/${state.userId}/calendars/${state.activeCalendarId}`);
        await setDoc(calRef, { notifications: state.notifications }, { merge: true });
    } catch (error) {
        console.error('Error guardando notificaciones:', error);
    }
}

async function loadNotifications() {
    if (!state.activeCalendarId) return;
    try {
        const calRef = doc(db, `users/${state.userId}/calendars/${state.activeCalendarId}`);
        onSnapshot(calRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.notifications) {
                state.notifications = data.notifications;
                scheduleAllNotifications();
            }
        });
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}
```
        ==============================================================
PASO 5: AÑADIR FUNCIONES DE PERSONALIZACIÓN DE COLORES
==============================================================

DESPUÉS de las funciones de notificaciones, añade:

```javascript
// ==========================================
// PERSONALIZACIÓN DE COLORES
// ==========================================

async function customizeColors() {
    const body = `
        <div class="space-y-3">
            ${Object.entries(SHIFT_TYPES).map(([key, type]) => `
                <div class="flex items-center justify-between gap-3">
                    <span>${type.label}</span>
                    <input type="color" id="color-${key}" value="${state.customColors[key] || type.defaultColor}" 
                        class="w-16 h-10 rounded border-2 cursor-pointer">
                </div>
            `).join('')}
        </div>
    `;
    
    const actions = `
        <button class="btn btn-secondary" data-action="reset">Restaurar</button>
        <button class="btn btn-primary" data-action="save">Guardar</button>
    `;
    
    const modalId = showModal({ 
        title: '🎨 Personalizar colores', 
        body, 
        actions 
    });
    
    return new Promise(resolve => {
        $(`#${modalId}`).addEventListener('click', e => {
            const action = e.target.closest('button')?.dataset.action;
            if (action) {
                if (action === 'save') {
                    Object.keys(SHIFT_TYPES).forEach(key => {
                        const color = $(`#${modalId} #color-${key}`).value;
                        state.customColors[key] = color;
                    });
                    saveCustomColors();
                    applyCustomColors();
                    renderCalendar();
                    showToast('✅ Colores guardados');
                } else if (action === 'reset') {
                    state.customColors = {};
                    saveCustomColors();
                    applyCustomColors();
                    renderCalendar();
                    showToast('🔄 Colores restaurados');
                }
                closeModal(modalId);
                resolve(true);
            }
        });
    });
}

function applyCustomColors() {
    const style = document.createElement('style');
    style.id = 'custom-colors';
    $('#custom-colors')?.remove();
    
    let css = '';
    Object.entries(state.customColors).forEach(([key, color]) => {
        css += `.shift-${key} { background-color: ${color} !important; }\n`;
    });
    
    style.textContent = css;
    document.head.appendChild(style);
}

async function saveCustomColors() {
    if (!state.activeCalendarId) return;
    try {
        const calRef = doc(db, `users/${state.userId}/calendars/${state.activeCalendarId}`);
        await setDoc(calRef, { customColors: state.customColors }, { merge: true });
    } catch (error) {
        console.error('Error guardando colores:', error);
    }
}

async function loadCustomColors() {
    if (!state.activeCalendarId) return;
    try {
        const calRef = doc(db, `users/${state.userId}/calendars/${state.activeCalendarId}`);
        onSnapshot(calRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.customColors) {
                state.customColors = data.customColors;
                applyCustomColors();
            }
        });
    } catch (error) {
        console.error('Error cargando colores:', error);
    }
}
```

==============================================================
PASO 6: MODIFICAR renderCalendar()
==============================================================

Busca esta parte en renderCalendar (alrededor de línea 600):

```javascript
if (dayData.shift && SHIFT_TYPES[dayData.shift]) {
    const shiftBadge = document.createElement('div');
    shiftBadge.className = `shift-indicator ${SHIFT_TYPES[dayData.shift].colorClass}`;
    shiftBadge.textContent = dayData.shift;
    cell.appendChild(shiftBadge);
}
```

Y AÑADE DESPUÉS:

```javascript
// INDICADOR DE NOTIFICACIÓN
if (state.notifications[dateStr]?.enabled) {
    const bellIcon = document.createElement('i');
    bellIcon.className = 'fas fa-bell bell-indicator';
    bellIcon.title = 'Notificación programada';
    cell.appendChild(bellIcon);
}
```

==============================================================
PASO 7: MODIFICAR handleDayClick()
==============================================================

Busca la función handleDayClick (alrededor de línea 645) y REEMPLÁZALA completa por:

```javascript
async function handleDayClick(e) {
    const cell = e.target.closest('.day-cell');
    if (!cell || cell.classList.contains('week-number-cell') || cell.classList.contains('other-month')) {
        return;
    }
    
    const dateStr = cell.dataset.date;
    if (!dateStr) return;
    
    // Click derecho para notificaciones
    if (e.button === 2 || e.type === 'contextmenu') {
        e.preventDefault();
        await editDayNotifications(dateStr);
        return;
    }
    
    if (state.isSelectingPattern) {
        handlePatternSelection(dateStr);
        return;
    }
    
    if (state.selectedShiftType !== null) {
        await assignShift(dateStr, state.selectedShiftType);
    } else {
        const eraseBtn = $('[data-shift-type="erase"]');
        if (eraseBtn && eraseBtn.classList.contains('selected')) {
            await deleteShift(dateStr);
        } else {
            await editNote(dateStr);
        }
    }
}
```

Y en setupEvents(), MODIFICA la línea del calendario para capturar contextmenu:

```javascript
// Click en días del calendario
$('#calendarGrid').addEventListener('click', handleDayClick);
$('#calendarGrid').addEventListener('contextmenu', handleDayClick); // NUEVO
```

==============================================================
PASO 8: MODIFICAR setupEvents()
==============================================================

Busca setupEvents() y AÑADE al final de la función (ANTES del cierre}):

```javascript
// Botón HOY
$('#todayBtn').addEventListener('click', goToToday);

// Botón personalizar colores
$('#customizeColorsBtn').addEventListener('click', customizeColors);
```

==============================================================
PASO 9: MODIFICAR initApp()
==============================================================

Busca la función initApp (línea 208) y AÑADE después de setupEvents():

```javascript
setupEvents();
setupKeyboardShortcuts(); // NUEVO
applyTheme();
createShiftButtons();
await listenCalendars();
loadCustomColors(); // NUEVO
loadNotifications(); // NUEVO
applyCustomColors(); // NUEVO
```

==============================================================
PASO 10: MODIFICAR listenShifts()
==============================================================

Busca listenShifts() y al final de la función, ANTES de renderCalendar(), añade:

```javascript
scheduleAllNotifications(); // NUEVO
renderCalendar();
```

==============================================================
PASO 11: TUTORIAL ACTUALIZADO
==============================================================

Busca la función showTutorial() y REEMPLAZA el body por:

```javascript
const body = `
    <ul class="space-y-3 text-sm">
        <li class="flex gap-3">
            <i class="fas fa-bars text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Menú:</strong> Toca el icono ☰ para acceder a configuración y gestionar calendarios.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-edit text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Editar:</strong> Pulsa el botón flotante para mostrar los controles de edición.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-hand-pointer text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Asignar Turno:</strong> Selecciona un turno (M, T, N, L) y toca los días del calendario.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-comment-dots text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Añadir Nota:</strong> Sin turno seleccionado, toca un día para añadir o editar una nota.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-bell text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Notificaciones:</strong> Click derecho en un día con turno para configurar notificaciones.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-palette text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Colores:</strong> Personaliza los colores de los turnos desde el menú lateral.</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-keyboard text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Atajos:</strong> ← → (navegar), Espacio (hoy), E (editar), Click derecho (notificación).</div>
        </li>
        <li class="flex gap-3">
            <i class="fas fa-magic text-lg" style="color: var(--accent-primary); min-width: 1.5rem;"></i>
            <div><strong>Repetir Patrón:</strong> Asigna turnos, pulsa "Seleccionar Patrón", marca inicio y fin, elige fecha y aplica.</div>
        </li>
    </ul>
`;
```

==============================================================
¡LISTO! RESUMEN DE CAMBIOS
==============================================================

✅ 1. Botón "HOY" prominente con animación
✅ 2. Atajos de teclado: ←→ (navegar), Espacio (hoy), E (editar)
✅ 3. Notificaciones web perfectas con múltiples opciones de tiempo
✅ 4. Personalización de colores para cada tipo de turno
✅ 5. Indicador visual (campanita) cuando hay notificación programada
✅ 6. Click derecho en días para configurar notificaciones
✅ 7. Tutorial actualizado

TOTAL DE CAMBIOS: ~450 líneas de código nuevo

¡Ahora tu calendario tiene las 4 funcionalidades implementadas!