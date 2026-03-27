/**
 * MORSIMON - LOOPS MODULE
 * Máquina de estado y lógica para la grabación de secuencias (Loop Station)
 */

const LOOP_STATION = {
    state: 'IDLE',   // IDLE, REC, DUB, PLAY
    lengthMs: 0,     // Duración total del loop en ms
    startTime: 0,    // Timestamp absoluto de cuando inició la grabación/reproducción
    tracks: [],      // Array de eventos [ { timeOffset, type, color, id } ]
    bpm: 120,        // BPM objetivo (cuantización base)
    activeVoices: new Set(), // Notas actualmente sostenidas físicamente
    tickerId: null,  // requestAnimationFrame ID
    
    // UI Elements
    ui: {
        circle: null,
        statusLabel: null,
        svgLayer: null,
        synthSelect: null
    }
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    LOOP_STATION.ui.circle = document.getElementById('loop-progress-circle');
    LOOP_STATION.ui.statusLabel = document.getElementById('loops-status-indicator');
    LOOP_STATION.ui.svgLayer = document.getElementById('loop-orbit-svg');
    LOOP_STATION.ui.synthSelect = document.getElementById('loops-synth-select');
    
    const bpmSlider = document.getElementById('loops-bpm-slider');
    const bpmDisplay = document.getElementById('loops-bpm-display');
    
    if (bpmSlider) {
        bpmSlider.addEventListener('input', (e) => {
            LOOP_STATION.bpm = parseInt(e.target.value);
            bpmDisplay.textContent = LOOP_STATION.bpm;
            // Si recalculamos tempo, ajustamos lengthMs
        });
    }

    // Llenar selector de sintes
    setTimeout(() => {
        if (!window.SYNTH_CONFIGS) return;
        for (const [id, config] of Object.entries(window.SYNTH_CONFIGS)) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = config.name;
            if (id === "4") option.selected = true; // SPIEGEL default
            LOOP_STATION.ui.synthSelect.appendChild(option);
        }
    }, 500);
});

// ==========================================
// MAQUINA DE ESTADO DEL TRANSPORTE
// ==========================================

function handleLoopsTransport() {
    if (app.currentView !== 'loops') return;

    const now = performance.now();

    switch (LOOP_STATION.state) {
        case 'IDLE':
            // Iniciar grabación (Free Time por ahora)
            LOOP_STATION.state = 'REC';
            LOOP_STATION.startTime = now;
            LOOP_STATION.tracks = [];
            clearOrbitDots();
            updateLoopsUI();
            startLoopTicker();
            break;

        case 'REC':
            // Cerrar el loop
            LOOP_STATION.lengthMs = now - LOOP_STATION.startTime;
            LOOP_STATION.state = 'PLAY';
            updateLoopsUI();
            break;

        case 'PLAY':
            // Entrar en modo DUB
            LOOP_STATION.state = 'DUB';
            updateLoopsUI();
            break;

        case 'DUB':
            // Salir de modo DUB, volver a PLAY
            LOOP_STATION.state = 'PLAY';
            updateLoopsUI();
            break;
    }
}

function stopLoops() {
    LOOP_STATION.state = 'IDLE';
    LOOP_STATION.startTime = 0;
    if (LOOP_STATION.tickerId) cancelAnimationFrame(LOOP_STATION.tickerId);
    // kill all active loop sounds
    ['green','red','yellow','blue'].forEach(c => {
        if (typeof stopTone === 'function') stopTone(c, 'loops');
    });
    updateLoopsUI();
}

function clearLoops() {
    stopLoops();
    LOOP_STATION.tracks = [];
    LOOP_STATION.lengthMs = 0;
    clearOrbitDots();
}

// Interceptación de Espacio y Doble Espacio
let lastSpaceTime = 0;
let spaceTimer = null;
let isSpaceDown = false;

document.addEventListener('keydown', (e) => {
    if (app.currentView !== 'loops') return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        isSpaceDown = true;
        
        // Handle Clear on hold
        spaceTimer = setTimeout(() => {
            if (isSpaceDown) {
                clearLoops();
                console.log("LOOP CLEARED");
            }
        }, 800);
    }
    
    // Interceptar notas QWAS
    if (LOOP_STATION.state === 'REC' || LOOP_STATION.state === 'DUB') {
        const key = e.key.toLowerCase();
        const map = { 'q': 'green', 'w': 'red', 'a': 'yellow', 's': 'blue'};
        if (map[key] && !LOOP_STATION.activeVoices.has(map[key])) {
            LOOP_STATION.activeVoices.add(map[key]);
            recordEvent('noteOn', map[key]);
            
            // Forzar synth correcto antes de que app.js dispare el tono
            if (APP_STATE.synthConfigs && LOOP_STATION.ui.synthSelect) {
                // app.js checkea APP_STATE.synthConfigs
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (app.currentView !== 'loops') return;

    if (e.code === 'Space') {
        isSpaceDown = false;
        clearTimeout(spaceTimer);
        
        const now = performance.now();
        if (now - lastSpaceTime < 250) {
            // Double Tap -> STOP
            stopLoops();
            console.log("LOOP STOPPED");
            lastSpaceTime = 0;
            return;
        }
        
        // Single tap (trigger on release if it wasn't a long hold)
        if (now - lastSpaceTime >= 250) {
            handleLoopsTransport();
        }
        lastSpaceTime = now;
    }
    
    // Interceptar liberación QWAS
    if (LOOP_STATION.state === 'REC' || LOOP_STATION.state === 'DUB') {
        const key = e.key.toLowerCase();
        const map = { 'q': 'green', 'w': 'red', 'a': 'yellow', 's': 'blue'};
        if (map[key] && LOOP_STATION.activeVoices.has(map[key])) {
            LOOP_STATION.activeVoices.delete(map[key]);
            recordEvent('noteOff', map[key]);
        }
    }
});

// ==========================================
// SISTEMA DE GRABACIÓN
// ==========================================

let eventIdCounter = 0;
function recordEvent(type, color) {
    if (LOOP_STATION.state !== 'REC' && LOOP_STATION.state !== 'DUB') return;
    
    const now = performance.now();
    let offset = (now - LOOP_STATION.startTime) % LOOP_STATION.lengthMs;
    if (LOOP_STATION.state === 'REC') {
        offset = now - LOOP_STATION.startTime;
    }
    
    const event = {
        id: eventIdCounter++,
        type: type, // 'noteOn' or 'noteOff'
        color: color,
        timeOffset: offset,
        playedInCurrentCycle: true // previene reproducirlo en la misma vuelta que se grabó
    };
    
    LOOP_STATION.tracks.push(event);
    
    // Visual dot
    if (type === 'noteOn') {
        drawOrbitDot(offset, color);
    }
}

// ==========================================
// RELOJ DE REPRODUCCIÓN (TICKER)
// ==========================================

let lastTickTime = 0;
function startLoopTicker() {
    if (LOOP_STATION.tickerId) cancelAnimationFrame(LOOP_STATION.tickerId);
    lastTickTime = performance.now();
    loopTicker();
}

function loopTicker() {
    if (app.currentView !== 'loops' || LOOP_STATION.state === 'IDLE') return;

    const now = performance.now();
    
    // SVG Progress
    if (LOOP_STATION.ui.circle && LOOP_STATION.lengthMs > 0) {
        const cycleProgress = ((now - LOOP_STATION.startTime) % LOOP_STATION.lengthMs) / LOOP_STATION.lengthMs;
        const dashoffset = 1225 - (1225 * cycleProgress);
        LOOP_STATION.ui.circle.style.strokeDashoffset = dashoffset;
    } else if (LOOP_STATION.state === 'REC') {
        // En REC no sabemos la longitud todavía, gira lento artificialmente o se llena continuo
        const recProgress = (now - LOOP_STATION.startTime) / 4000; // Asume 4s max para dibujo default
        const loopVal = recProgress % 1.0;
        LOOP_STATION.ui.circle.style.strokeDashoffset = 1225 - (1225 * loopVal);
    }

    // Ticker Logic (Event Playback)
    if (LOOP_STATION.state === 'PLAY' || LOOP_STATION.state === 'DUB') {
        const cycleCurrentTime = (now - LOOP_STATION.startTime) % LOOP_STATION.lengthMs;
        const cyclePreviousTime = (lastTickTime - LOOP_STATION.startTime) % LOOP_STATION.lengthMs;
        
        let wrapAround = cycleCurrentTime < cyclePreviousTime;
        
        // Reset flags en cada nueva vuelta
        if (wrapAround) {
            LOOP_STATION.tracks.forEach(ev => ev.playedInCurrentCycle = false);
        }

        LOOP_STATION.tracks.forEach(ev => {
            if (ev.playedInCurrentCycle) return;
            
            // Check if event falls into the time window between lastTick and now
            let shouldPlay = false;
            if (!wrapAround) {
                if (ev.timeOffset >= cyclePreviousTime && ev.timeOffset < cycleCurrentTime) shouldPlay = true;
            } else {
                // Wrap around happened! Event is between previous time -> end, OR 0 -> current time
                if (ev.timeOffset >= cyclePreviousTime || ev.timeOffset <= cycleCurrentTime) shouldPlay = true;
            }

            if (shouldPlay) {
                firePlaybackEvent(ev);
                ev.playedInCurrentCycle = true;
            }
        });
    }

    lastTickTime = now;
    LOOP_STATION.tickerId = requestAnimationFrame(loopTicker);
}

function firePlaybackEvent(ev) {
    // Necesitamos asegurarnos de que el synth seleccionado por el dropdown de loops se use
    const synthId = LOOP_STATION.ui.synthSelect.value;
    
    if (ev.type === 'noteOn') {
        // Truco sucio temporal: forzamos el DOM del dropdown de main a igualar al de loops, 
        // o mejor aún, modificamos startTone para que acepte un synthId predefinido. 
        // Por ahora, como app.js usa document.getElementById('synthEpochSelect').value, lo puenteamos:
        const mainSelect = document.getElementById('synthEpochSelect');
        const oldVal = mainSelect.value;
        mainSelect.value = synthId;
        
        if (typeof startTone === 'function') startTone(ev.color, 'loops', true);
        
        mainSelect.value = oldVal;
    } else if (ev.type === 'noteOff') {
        if (typeof stopTone === 'function') stopTone(ev.color, 'loops', true);
    }
}

// ==========================================
// ACTUALIZACIÓN DE INTERFAZ
// ==========================================

function updateLoopsUI() {
    if (!LOOP_STATION.ui.circle) return;
    
    const circle = LOOP_STATION.ui.circle;
    const label = LOOP_STATION.ui.statusLabel;
    
    circle.classList.remove('state-rec', 'state-dub', 'state-play', 'state-idle');
    circle.classList.add('state-' + LOOP_STATION.state.toLowerCase());
    
    label.textContent = LOOP_STATION.state;
    label.style.color = 
        LOOP_STATION.state === 'REC' ? 'var(--v-red)' :
        LOOP_STATION.state === 'DUB' ? 'var(--v-yellow)' :
        LOOP_STATION.state === 'PLAY' ? 'var(--v-green)' :
        'var(--gold-dim)';
}

function drawOrbitDot(offsetMs, colorClass) {
    if (!LOOP_STATION.ui.svgLayer || LOOP_STATION.lengthMs === 0) return;
    
    // Si la grabacion no esta cerrada, asumimos radio en base a 4000ms.
    // Esto es temporal hasta hacer el SVG dinamico total.
    const length = LOOP_STATION.lengthMs > 0 ? LOOP_STATION.lengthMs : 4000; 
    const angle = (offsetMs / length) * Math.PI * 2 - (Math.PI / 2); // -90 deg para arriba
    
    const r = 195;
    const cx = 210;
    const cy = 210;
    
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 4);
    dot.setAttribute("class", "loop-orbit-dot");
    
    const colorMap = { 'green': '#4CAF50', 'red': '#E53935', 'yellow': '#FFB300', 'blue': '#1E88E5'};
    dot.setAttribute("fill", colorMap[colorClass] || 'white');
    
    LOOP_STATION.ui.svgLayer.appendChild(dot);
}

function clearOrbitDots() {
    if (!LOOP_STATION.ui.svgLayer) return;
    const dots = LOOP_STATION.ui.svgLayer.querySelectorAll('.loop-orbit-dot');
    dots.forEach(d => d.remove());
}
