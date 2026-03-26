/* === MORSIMON VOYAGER ENGINE === */

const APP_STATE = {
    bpm: 120,
    isPlaying: false,
    textData: ""
};

// ========================
// 0. FULLSCREEN & SHORTCUTS
// ========================
const fsBtn = document.getElementById('fullscreenBtn');
if(fsBtn) {
    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
            fsBtn.textContent = '[-] EXIT FULLSCREEN';
        } else {
            document.exitFullscreen();
            fsBtn.textContent = '[ ] FULLSCREEN';
        }
    });
}

const KEY_MAP = {
    'q': 'green', 'Q': 'green',
    'w': 'red',   'W': 'red',
    'a': 'yellow','A': 'yellow',
    's': 'blue',  'S': 'blue'
};

document.addEventListener('keydown', (e) => {
    // Evitamos activar audio si el usuario escribe en un campo de texto oculto en el futuro
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (KEY_MAP[e.key] && !e.repeat) {
        startTone(KEY_MAP[e.key]);
    }
});
document.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (KEY_MAP[e.key]) {
        stopTone(KEY_MAP[e.key]);
    }
});


// ========================
// 1. ROUTING LÓGICO
// ========================
const app = {
    views: ['home', 'classic', 'experimental'],
    navigate: function(target) {
        if(APP_STATE.isPlaying) return; // No navegar mientras reproduce
        
        this.views.forEach(v => {
            document.getElementById(`view-${v}`).classList.remove('active');
        });
        document.getElementById(`view-${target}`).classList.add('active');
    }
};

document.getElementById('home-title').addEventListener('click', () => app.navigate('home'));

// ========================
// 2. CONTROLES Y ORÁCULO
// ========================
const bpmSlider = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
bpmSlider.addEventListener('input', (e) => {
    APP_STATE.bpm = parseInt(e.target.value);
    bpmDisplay.textContent = APP_STATE.bpm;
});

const fileInput = document.getElementById('fileInput');
const playSequenceBtn = document.getElementById('playSequenceBtn');
const lyricsContainer = document.getElementById('lyricsContainer');

let lyricsScroller;
let charSpans = [];

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            APP_STATE.textData = evt.target.result;
            renderLyrics(APP_STATE.textData);
            playSequenceBtn.disabled = false;
        };
        reader.readAsText(file);
    }
});

function renderLyrics(text) {
    lyricsContainer.innerHTML = '';
    lyricsScroller = document.createElement('div');
    lyricsScroller.className = 'lyrics-scroller';
    
    charSpans = [];
    const paragraphs = text.split('\n');
    
    paragraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.style.marginBottom = '25px';
        pEl.style.lineHeight = '1.8';
        pEl.style.color = '#333'; // Gris oscuro para letras no leídas
        
        for(let i=0; i<p.length; i++) {
            const char = p[i];
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'lyric-char';
            charSpans.push({ char: char.toUpperCase(), el: span });
            pEl.appendChild(span);
        }
        lyricsScroller.appendChild(pEl);
    });
    
    // Posición inicial centrada verticalmente en base al contenedor
    lyricsScroller.style.transform = `translateY(${lyricsContainer.clientHeight / 2 - 20}px)`;
    lyricsContainer.appendChild(lyricsScroller);
}

// ========================
// 3. WEB AUDIO API & MORSE
// ========================
const MORSE_DICT = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----', ' ': ' '
};

// Preset SOMA/Space
const SYNTH_PRESETS = {
    green:  { type: 'sine',     freq: 110.00 },
    red:    { type: 'sawtooth', freq: 220.00 },
    yellow: { type: 'triangle', freq: 440.00 },
    blue:   { type: 'sine',     freq: 164.81 }
};

let audioCtx, masterGain, delayNode, delayFeedback;
const activeSynths = {};

const initAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.4;
    delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.4;
    
    // Add mild distortion/compression by letting the master be slightly saturated,
    // though WebAudio clips naturally. 
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(masterGain);
    masterGain.connect(audioCtx.destination);
};

const startTone = (color) => {
    initAudio();
    if (activeSynths[color]) return;

    const preset = SYNTH_PRESETS[color];
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    
    osc.type = preset.type;
    osc.frequency.value = preset.freq;
    
    env.gain.setValueAtTime(0, audioCtx.currentTime);
    // Ataque suave tipo pad análogo
    env.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.08);
    
    osc.connect(env);
    env.connect(masterGain);
    env.connect(delayNode);
    
    osc.start();
    activeSynths[color] = { osc, env };
    
    document.getElementById(`q-${color}`).classList.add('active');
};

const stopTone = (color) => {
    if (!activeSynths[color]) return;
    const { osc, env } = activeSynths[color];
    const now = audioCtx.currentTime;
    
    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(env.gain.value, now);
    // Release espacial
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.3); 
    
    osc.stop(now + 0.3);
    delete activeSynths[color];
    document.getElementById(`q-${color}`).classList.remove('active');
};

const COLORS_ARRAY = ['green', 'red', 'yellow', 'blue'];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

playSequenceBtn.addEventListener('click', async () => {
    if (APP_STATE.isPlaying) return; // Evitar disparar múltiple
    
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    APP_STATE.isPlaying = true;
    playSequenceBtn.disabled = true;
    fileInput.disabled = true;
    
    // Matemática limpia para relacionar BPM con Milisegundos de Punto
    const getUnitTime = () => Math.round(1200 / APP_STATE.bpm);

    const containerHeight = lyricsContainer.clientHeight;
    
    for (let i = 0; i < charSpans.length; i++) {
        if (!APP_STATE.isPlaying) break; 
        
        const unitTime = getUnitTime(); // Recalcular en vivo si mueve el slider
        const dotTime = unitTime;
        const dashTime = unitTime * 3;
        const symbolGap = unitTime; 
        const letterGap = unitTime * 3; 

        const item = charSpans[i];
        const char = item.char;
        
        // --- Spotify Auto-Scroll Logic ---
        const topPos = item.el.offsetTop;
        const targetScroll = -(topPos - (containerHeight / 2) + 20); 
        lyricsScroller.style.transform = `translateY(${targetScroll}px)`;

        // Highlight la letra actual brillante
        item.el.style.color = '#fff';

        if (char === ' ' || char === '\n') {
            await sleep(unitTime * 5); // word gap minus ya consumidos
            item.el.style.color = '#555'; // Color de lectura pasada
            continue;
        }

        const morse = MORSE_DICT[char];
        if (!morse) {
            item.el.style.color = '#555';
            continue;
        }

        const colorIndex = char.charCodeAt(0) % 4;
        const color = COLORS_ARRAY[colorIndex];
        
        item.el.classList.add(`active-${color}`);

        // Tocar los dashes y dots
        for (let j = 0; j < morse.length; j++) {
            const sym = morse[j];
            const duration = (sym === '.') ? dotTime : dashTime;
            
            startTone(color);
            await sleep(duration);
            stopTone(color);
            await sleep(symbolGap);
        }
        
        // Quitar color vibrante, dejarlo con estilo de "ya leído"
        item.el.classList.remove(`active-${color}`);
        item.el.style.color = 'var(--gold-dim)'; 
        await sleep(letterGap);
    }
    
    APP_STATE.isPlaying = false;
    playSequenceBtn.disabled = false;
    fileInput.disabled = false;
});

// Interacción manual en el tablero frontal (Ratón)
document.querySelectorAll('.quadrant').forEach(q => {
    q.addEventListener('mousedown', () => startTone(q.dataset.color));
    q.addEventListener('mouseup', () => stopTone(q.dataset.color));
    q.addEventListener('mouseleave', () => stopTone(q.dataset.color));
});
