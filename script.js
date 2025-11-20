/* ==========================================
   VARIABLES CSS - TEMA OSCURO Y CLARO
   ========================================== */

:root {
    /* Modo Oscuro (Por defecto) */
    --bg-primary: #0a0a0a;
    --bg-secondary: #1a1a1a;
    --bg-tertiary: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #888888;
    --border-primary: rgba(255, 255, 255, 0.1);
    --border-secondary: rgba(255, 255, 255, 0.05);
    --accent-primary: #39FF14;
    --accent-text: #0a0a0a;
    --danger-primary: #ff3b30;
    
    /* Colores de Turnos */
    --shift-m-bg: #00ff88;
    --shift-t-bg: #ff9500;
    --shift-n-bg: #5e5ce6;
    --shift-l-bg: #64d2ff;
    --shift-text: #000000;
}

body.light-mode {
    /* Modo Claro */
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f7;
    --bg-tertiary: #e8e8ed;
    --text-primary: #000000;
    --text-secondary: #86868b;
    --accent-primary: #007aff;
    --accent-text: #ffffff;
    
    /* Colores de Turnos en modo claro */
    --shift-m-bg: #34c759;
    --shift-t-bg: #ff9500;
    --shift-n-bg: #5856d6;
    --shift-l-bg: #32ade6;
    --shift-text: #ffffff;
}

/* ==========================================
   RESET Y BASE
   ========================================== */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    overflow-x: hidden;
}

body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
    display: flex;
    flex-direction: column;
}

.hidden {
    display: none !important;
}

/* ==========================================
   HEADER MÓVIL
   ========================================== */

.mobile-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--border-primary);
    padding: 0.5rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 3rem;
}

.hamburger-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    transition: transform 0.2s ease;
}

.hamburger-btn:active {
    transform: scale(0.9);
}

/* ==========================================
   SIDEBAR (MENÚ LATERAL)
   ========================================== */

.sidebar-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);
}

.sidebar-overlay.active {
    opacity: 1;
    visibility: visible;
}

.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 85%;
    max-width: 320px;
    height: 100%;
    background-color: var(--bg-secondary);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.5);
}

.sidebar.active {
    transform: translateX(0);
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.sidebar-content {
    padding: 1.5rem;
}

.sidebar-section {
    margin-bottom: 2rem;
}

.sidebar-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    letter-spacing: 0.05em;
}

/* ==========================================
   BOTONES
   ========================================== */

.btn {
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.btn:active {
    transform: scale(0.97);
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background-color: var(--accent-primary);
    color: var(--accent-text);
}

.btn-secondary {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
}

.btn-danger {
    background-color: var(--danger-primary);
    color: white;
}

.btn-icon {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border-radius: 50%;
}

/* ==========================================
   FORMULARIOS
   ========================================== */

.form-input,
.form-select {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
    border-radius: 0.75rem;
    padding: 0.75rem;
    font-size: 0.95rem;
    width: 100%;
    transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
    outline: none;
    border-color: var(--accent-primary);
}

/* ==========================================
   CALENDARIO
   ========================================== */

#app-content {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-bottom: 1rem;
}

#mainCalendarArea {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-primary);
    padding: 0.5rem 0;
}

.calendar-weekdays > div {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    padding: 0.25rem 0;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: var(--border-primary);
    border: 1px solid var(--border-primary);
    border-radius: 0.5rem;
    overflow: hidden;
}

/* ==========================================
   CELDAS DEL CALENDARIO
   ========================================== */

.day-cell {
    min-height: 6rem;
    padding: 0.5rem 0.3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0.35rem;
    position: relative;
    background-color: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.day-cell.has-shift {
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.day-cell:hover:not(.other-month) {
    filter: brightness(1.1);
}

.day-cell:active:not(.other-month) {
    transform: scale(0.98);
}

.day-number {
    font-size: 1.4rem;
    font-weight: 700;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    z-index: 2;
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.25);
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.day-cell:not(.has-shift) .day-number {
    background-color: transparent;
    color: var(--text-primary);
    text-shadow: none;
}

.current-day .day-number {
    background-color: var(--accent-primary) !important;
    color: var(--accent-text) !important;
    box-shadow: 0 2px 8px rgba(57, 255, 20, 0.4);
    text-shadow: none;
}

.other-month {
    opacity: 0.3;
    cursor: default;
}

/* ==========================================
   BADGE DE TIPO DE TURNO
   ========================================== */

.shift-type-badge {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    background-color: rgba(0, 0, 0, 0.6);
    color: #ffffff;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    z-index: 1;
    backdrop-filter: blur(4px);
}

/* ==========================================
   CONTENIDO DE NOTAS EN LAS CELDAS
   ========================================== */

.note-content {
    width: 100%;
    padding: 0.3rem;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    border-radius: 0.35rem;
    font-size: 0.7rem;
    line-height: 1.2;
    color: #ffffff;
    text-align: center;
    word-wrap: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    z-index: 1;
    max-height: 2.8rem;
    font-weight: 500;
}

.day-cell:not(.has-shift) .note-content {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
}

/* ==========================================
   INDICADORES DE TURNOS Y NOTAS (ANTIGUOS - YA NO SE USAN)
   ========================================== */

.shift-indicator {
    display: none;
}

.note-indicator {
    display: none;
}

/* ==========================================
   HISTORIAL DE NOTAS
   ========================================== */

.notes-history {
    display: none;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-tertiary);
    border-radius: 0.75rem;
    border: 1px solid var(--border-primary);
}

.notes-header {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
}

.notes-header i {
    color: var(--accent-primary);
}

.note-item {
    background-color: var(--bg-secondary);
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    border-left: 3px solid var(--accent-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    gap: 0.75rem;
}

.note-item:hover {
    background-color: var(--bg-primary);
    transform: translateX(2px);
}

.note-item:active {
    transform: scale(0.98);
}

.note-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    flex-shrink: 0;
}

.note-day-badge {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--accent-primary);
    min-width: 2rem;
}

.note-day-name {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.note-shift-badge {
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    font-weight: 700;
    margin-left: auto;
}

.note-text-container {
    flex: 1;
}

.note-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.note-preview {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
}

.note-text {
    font-size: 0.85rem;
    color: var(--text-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* ==========================================
   DÍAS PASADOS
   ========================================== */

.past-day {
    opacity: 0.65;
    filter: grayscale(40%);
}

.past-day .day-number {
    opacity: 0.8;
}

.past-day .note-content {
    opacity: 0.7;
}

/* ==========================================
   BOTÓN FLOTANTE (FAB)
   ========================================== */

.fab-button {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background-color: var(--accent-primary);
    color: var(--accent-text);
    border: none;
    font-size: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.fab-button:active {
    transform: scale(0.9);
}

.fab-button.edit-active {
    background-color: var(--danger-primary);
}

/* ==========================================
   PANEL DE EDICIÓN FLOTANTE
   ========================================== */

.floating-edit-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-primary);
    padding: 1rem;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 50;
    max-height: 60vh;
    overflow-y: auto;
}

.floating-edit-panel.active {
    transform: translateY(0);
}

.compact-edit-grid {
    margin-bottom: 0.5rem;
}

.turno-buttons-row-1 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
    margin-bottom: 0.4rem;
}

.turno-buttons-row-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
}

.turno-btn {
    padding: 0.6rem 0.3rem;
    font-size: 0.75rem;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    font-weight: 700;
    text-transform: uppercase;
    white-space: nowrap;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.turno-btn:active {
    transform: scale(0.95);
}

.turno-btn.selected {
    border-color: var(--text-primary);
}

.btn-borrar {
    background-color: var(--danger-primary);
    color: #fff;
}

.shift-button {
    padding: 0.6rem 0.3rem;
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

.shift-button.selected {
    border-color: var(--text-primary);
    transform: scale(0.95);
}

/* ==========================================
   MODALES
   ========================================== */

.modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    backdrop-filter: blur(3px);
}

.modal-overlay.visible {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background-color: var(--bg-secondary);
    padding: 1.5rem 2rem;
    border-radius: 0.75rem;
    width: 90%;
    max-width: 500px;
    border: 1px solid var(--border-primary);
    transform: scale(0.9);
    transition: transform 0.3s ease;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-overlay.visible .modal-content {
    transform: scale(1);
}

/* ==========================================
   TOAST
   ========================================== */

.toast {
    position: fixed;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border-left: 4px solid var(--accent-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    animation: slideUp 0.3s forwards, fadeOut 0.3s 2s forwards;
    z-index: 1100;
    white-space: nowrap;
}

@keyframes slideUp {
    to {
        transform: translate(-50%, 0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translate(-50%, -10px);
    }
}

/* ==========================================
   SELECTOR DE COLOR
   ========================================== */

.color-picker-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.color-picker-btn:hover {
    transform: scale(1.1);
}

.color-picker-btn.selected {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.color-picker-btn:active {
    transform: scale(0.95);
}

/* ==========================================
   ANIMACIONES
   ========================================== */

.swipe-transition {
    opacity: 0.5;
    transform: scale(0.98);
}

/* ==========================================
   UTILIDADES
   ========================================== */

.space-y-2 > * + * {
    margin-top: 0.5rem;
}

.space-y-3 > * + * {
    margin-top: 0.75rem;
}

.space-y-4 > * + * {
    margin-top: 1rem;
}

.flex {
    display: flex;
}

.flex-1 {
    flex: 1;
}

.gap-2 {
    gap: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
}

.w-full {
    width: 100%;
}

.mb-3 {
    margin-bottom: 0.75rem;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mt-2 {
    margin-top: 0.5rem;
}

.mt-4 {
    margin-top: 1rem;
}

.text-center {
    text-align: center;
}

.text-sm {
    font-size: 0.875rem;
}

.text-lg {
    font-size: 1.125rem;
}

.text-xl {
    font-size: 1.25rem;
}

.font-bold {
    font-weight: 700;
}

.justify-between {
    justify-content: space-between;
}

.justify-end {
    justify-content: flex-end;
}

.items-center {
    align-items: center;
}

.block {
    display: block;
}

/* ==========================================
   RESPONSIVE
   ========================================== */

@media (max-width: 768px) {
    .day-cell {
        min-height: 6.5rem;
        padding: 0.5rem 0.25rem;
    }
    
    .day-number {
        font-size: 1.5rem;
        width: 2.6rem;
        height: 2.6rem;
    }
    
    .note-content {
        font-size: 0.65rem;
        padding: 0.25rem;
    }
    
    .shift-type-badge {
        font-size: 0.65rem;
        padding: 0.1rem 0.3rem;
    }
}

@media (max-width: 480px) {
    .mobile-header {
        padding: 0.4rem 0.6rem;
        min-height: 2.75rem;
    }
    
    .day-cell {
        min-height: 6.5rem;
    }
    
    .day-number {
        font-size: 1.4rem;
        width: 2.4rem;
        height: 2.4rem;
    }
    
    .note-content {
        font-size: 0.6rem;
        padding: 0.2rem;
        max-height: 2.4rem;
    }
    
    .shift-type-badge {
        font-size: 0.6rem;
        padding: 0.1rem 0.25rem;
    }
    
    .turno-btn,
    .shift-button {
        font-size: 0.65rem;
        padding: 0.5rem 0.2rem;
    }
}

@media (max-width: 380px) {
    .turno-btn,
    .shift-button {
        font-size: 0.65rem;
        padding: 0.5rem 0.2rem;
    }
    
    .turno-btn i {
        font-size: 0.7rem;
    }
    
    .turno-buttons-row-1,
    .turno-buttons-row-2 {
        gap: 0.3rem;
    }
    
    .note-content {
        font-size: 0.55rem;
    }
}
