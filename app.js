/* === MORSIMON ENGINE === */

const APP_STATE = {
    bpm: 12,
    isPlayingFILE: false,
    textData: "",
    isClassicPlaying: false,
    synthConfigs: null,
    synth: {
        1: { synthEpoch: "4", rootFreq: 110.00, delayTime: 0.0, feedback: 0.0, masterVolume: 0.6 },
        2: { synthEpoch: "4", rootFreq: 110.00, delayTime: 0.0, feedback: 0.0, masterVolume: 0.6 }
    }
};

const CLASSIC_STATE = {
    1: { sequence: [], playerIndex: 0, isPlaying: false, score: 0 },
    2: { sequence: [], playerIndex: 0, isPlaying: false, score: 0 },
    mode: 'human',
    highScore: 0
};

// ========================
// 0. FULLSCREEN, MODAL, FLIP & SHORTCUTS
// ========================
const fsBtn = document.getElementById('fullscreenBtn');
if(fsBtn) {
    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// Info Modal Logic
const infoModal = document.getElementById('infoModal');
const infoBtn = document.getElementById('infoBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
if (infoBtn && infoModal) {
    infoBtn.addEventListener('click', () => infoModal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => infoModal.classList.remove('active'));
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) infoModal.classList.remove('active');
    });
}

// Flipper events are resolved parametrically inside the Engine function

const KEY_MAP = {
    'q': { color: 'green', id: 1 }, 'Q': { color: 'green', id: 1 },
    'w': { color: 'red',   id: 1 }, 'W': { color: 'red',   id: 1 },
    'a': { color: 'yellow',id: 1 }, 'A': { color: 'yellow',id: 1 },
    's': { color: 'blue',  id: 1 }, 'S': { color: 'blue',  id: 1 },
    
    'e': { color: 'green', id: 2 }, 'E': { color: 'green', id: 2 },
    'r': { color: 'red',   id: 2 }, 'R': { color: 'red',   id: 2 },
    'd': { color: 'yellow',id: 2 }, 'D': { color: 'yellow',id: 2 },
    'f': { color: 'blue',  id: 2 }, 'F': { color: 'blue',  id: 2 }
};

document.addEventListener('keydown', (e) => {
    if (e.target.id === 'liveInput') return; 
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key.toLowerCase() === 'x') {
        document.body.classList.toggle('zen-mode');
        return;
    }

    if (KEY_MAP[e.key] && !e.repeat) {
        const { color, id } = KEY_MAP[e.key];
        userStartTone(color, id);
    }
});
document.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (KEY_MAP[e.key]) {
        const { color, id } = KEY_MAP[e.key];
        userStopTone(color, id);
    }
});

// ========================
// 1. ROUTING LÓGICO Y CONTROLES
// ========================
const app = {
    views: ['home', 'classic', 'experimental'],
    currentView: 'home',
    navigate: function(target) {
        if (APP_STATE.isPlayingFILE) return; 
        
        // Force classic stop if navigating away
        if ((CLASSIC_STATE[1].isPlaying || CLASSIC_STATE[2].isPlaying) && target !== 'classic') {
            CLASSIC_STATE[1].isPlaying = false;
            CLASSIC_STATE[2].isPlaying = false;
            APP_STATE.isClassicPlaying = false;
            COLORS_ARRAY.forEach(c => { stopTone(c, 1); stopTone(c, 2); });
            
            const sHuman = document.getElementById('startBotVsHumanBtn');
            const sBot = document.getElementById('startBotVsBotBtn');
            const sDual = document.getElementById('startDualBotBtn');
            if (sHuman) sHuman.disabled = false;
            if (sBot) sBot.disabled = false;
            if (sDual) sDual.disabled = false;
            
            const cSc = document.getElementById('classicSpeedControl');
            if (cSc) { cSc.style.opacity = '0'; cSc.style.pointerEvents = 'none'; }
        }
        
        this.currentView = target;
        this.views.forEach(v => {
            document.getElementById(`view-${v}`).classList.remove('active');
        });
        document.getElementById(`view-${target}`).classList.add('active');
        
        // Dynamic Simon Placement
        const simonElement = document.getElementById('simon-container');
        if (target === 'classic') {
            document.getElementById('classic-simon-placeholder').appendChild(simonElement);
        } else if (target === 'experimental') {
            const expHolder = document.getElementById('experimental-simon-placeholder');
            expHolder.insertBefore(simonElement, expHolder.firstChild);
        }
    }
};
document.getElementById('home-title').addEventListener('click', () => {
    // Solo permitir salir si no está tocando archivo
    if (!APP_STATE.isPlayingFILE) app.navigate('home');
});

const bpmSlider = document.getElementById('bpmSlider');
const bpmDisplay = document.getElementById('bpmDisplay');
bpmSlider.addEventListener('input', (e) => {
    APP_STATE.bpm = parseInt(e.target.value);
    bpmDisplay.textContent = APP_STATE.bpm;
});

const setupEngineControls = (instanceId) => {
    const ext = instanceId === 1 ? '' : '2';
    const btnFlipBack = document.getElementById(`flipToBackBtn${ext}`);
    const flipper = document.getElementById(`simonFlipper${ext}`);
    if (btnFlipBack && flipper) btnFlipBack.addEventListener('click', () => flipper.classList.add('flipped'));

    const backFace = document.getElementById(`simonBackFace${ext}`);
    if (backFace && flipper) {
        backFace.style.cursor = 'pointer';
        const ep = document.getElementById(`enginePanel${ext}`);
        if(ep) ep.style.cursor = 'default';
        backFace.addEventListener('click', (e) => {
            if (e.target === backFace || e.target.tagName==='H4') flipper.classList.remove('flipped');
        });
    }
    
    const pSelect = document.getElementById(`rootNoteSelect${ext}`);
    const epSelect = document.getElementById(`synthEpochSelect${ext}`);
    const dSlider = document.getElementById(`delayTimeSlider${ext}`);
    const setDSlider = document.getElementById(`delayTimeVal${ext}`);
    const fSlider = document.getElementById(`feedbackSlider${ext}`);
    const setFSlider = document.getElementById(`feedbackVal${ext}`);
    const vSlider = document.getElementById(`volSlider${ext}`);
    const setVSlider = document.getElementById(`volVal${ext}`);
    
    if (pSelect) pSelect.addEventListener('change', (e) => APP_STATE.synth[instanceId].rootFreq = parseFloat(e.target.value));
    if (epSelect) epSelect.addEventListener('change', (e) => APP_STATE.synth[instanceId].synthEpoch = e.target.value);
    if (dSlider) dSlider.addEventListener('input', (e) => {
        APP_STATE.synth[instanceId].delayTime = parseInt(e.target.value) / 100;
        setDSlider.textContent = e.target.value;
        if(audioCtx && synthNodes[instanceId].delayNode) synthNodes[instanceId].delayNode.delayTime.setValueAtTime(APP_STATE.synth[instanceId].delayTime, audioCtx.currentTime);
    });
    if(fSlider) fSlider.addEventListener('input', (e) => {
        APP_STATE.synth[instanceId].feedback = parseInt(e.target.value) / 100;
        setFSlider.textContent = e.target.value;
        if(audioCtx && synthNodes[instanceId].delayFeedback) synthNodes[instanceId].delayFeedback.gain.setValueAtTime(APP_STATE.synth[instanceId].feedback, audioCtx.currentTime);
    });
    if(vSlider) vSlider.addEventListener('input', (e) => {
        APP_STATE.synth[instanceId].masterVolume = parseInt(e.target.value) / 100;
        setVSlider.textContent = e.target.value;
        if(audioCtx && synthNodes[instanceId].masterGain) {
            synthNodes[instanceId].masterGain.gain.setTargetAtTime(APP_STATE.synth[instanceId].masterVolume * 0.4, audioCtx.currentTime, 0.02);
        }
    });
};


// ========================
// 2. DICTIONARY & UI STATE
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

const lyricsTextHalf = document.getElementById('lyricsTextHalf');
const lyricsMorseHalf = document.getElementById('lyricsMorseHalf');
const lyricsPlaceholderText = document.getElementById('lyricsPlaceholderText');

let textScroller, morseScroller;
let charSpans = [];

function createSplitScrollers() {
    lyricsTextHalf.innerHTML = '';
    lyricsMorseHalf.innerHTML = '';
    
    textScroller = document.createElement('div');
    textScroller.className = 'lyrics-scroller';
    
    morseScroller = document.createElement('div');
    morseScroller.className = 'lyrics-scroller';
    
    const halfHeight = lyricsTextHalf.clientHeight;
    textScroller.style.transform = `translateY(${halfHeight / 2 - 20}px)`;
    morseScroller.style.transform = `translateY(${halfHeight / 2 - 20}px)`;
    
    lyricsTextHalf.appendChild(textScroller);
    lyricsMorseHalf.appendChild(morseScroller);
}

// File Reader logic
const fileInput = document.getElementById('fileInput');
const playSequenceBtn = document.getElementById('playSequenceBtn');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            APP_STATE.textData = evt.target.result;
            renderLyricsFile(APP_STATE.textData);
            if(lyricsPlaceholderText) lyricsPlaceholderText.style.display = 'none';
            playSequenceBtn.disabled = false;
        };
        reader.readAsText(file);
    }
});

function renderLyricsFile(text) {
    createSplitScrollers();
    charSpans = [];
    const paragraphs = text.split('\n');
    
    paragraphs.forEach(p => {
        const pT = document.createElement('p'); pT.className = 'lyric-p';
        const pM = document.createElement('p'); pM.className = 'lyric-p';
        
        for(let i=0; i<p.length; i++) {
            const char = p[i].toUpperCase();
            const morseStr = MORSE_DICT[char] || char; 
            
            const spanT = document.createElement('span');
            spanT.textContent = char;
            spanT.className = 'lyric-char';
            pT.appendChild(spanT);
            
            const spanM = document.createElement('span');
            spanM.textContent = (char === ' ') ? '   ' : morseStr + ' ';
            spanM.className = 'lyric-char';
            pM.appendChild(spanM);
            
            charSpans.push({ char: char, textEl: spanT, morseEl: spanM });
        }
        textScroller.appendChild(pT);
        morseScroller.appendChild(pM);
    });
}


// ========================
// 3. WEB AUDIO API (ANTI-CLICK PERFECT ENGINE)
// ========================

const SYNTH_PRESETS = {
    green:  { type: 'sine',     freq: 110.00 },
    red:    { type: 'sawtooth', freq: 220.00 },
    yellow: { type: 'triangle', freq: 440.00 },
    blue:   { type: 'sine',     freq: 164.81 }
};

let audioCtx, globalCompressor;
const synthNodes = {
    1: { masterGain: null, delayNode: null, delayFeedback: null, activeEngines: {} },
    2: { masterGain: null, delayNode: null, delayFeedback: null, activeEngines: {} }
};

const initAudio = (instanceId = 1) => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        globalCompressor = audioCtx.createDynamicsCompressor();
        globalCompressor.threshold.setValueAtTime(-24, audioCtx.currentTime); 
        globalCompressor.knee.setValueAtTime(30, audioCtx.currentTime);     
        globalCompressor.ratio.setValueAtTime(12, audioCtx.currentTime);    
        globalCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);   
        globalCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);  
        globalCompressor.connect(audioCtx.destination);
    }
    const nodes = synthNodes[instanceId];
    if (nodes.masterGain) return;

    nodes.masterGain = audioCtx.createGain();
    nodes.masterGain.gain.setValueAtTime(APP_STATE.synth[instanceId].masterVolume * 0.4, audioCtx.currentTime); 
    
    nodes.delayNode = audioCtx.createDelay(2.0); 
    nodes.delayNode.delayTime.value = APP_STATE.synth[instanceId].delayTime;
    
    nodes.delayFeedback = audioCtx.createGain();
    nodes.delayFeedback.gain.value = APP_STATE.synth[instanceId].feedback;
    
    nodes.delayNode.connect(nodes.delayFeedback);
    nodes.delayFeedback.connect(nodes.delayNode);
    
    // El Delay ahora entra al MasterGain de la instancia, no al compresor global directo
    nodes.delayNode.connect(nodes.masterGain); 
    
    nodes.masterGain.connect(globalCompressor); 
};

const getToneConfig = (color, instanceId) => {
    const fBase = APP_STATE.synth[instanceId].rootFreq;
    const epoch = APP_STATE.synth[instanceId].synthEpoch;
    const config = APP_STATE.synthConfigs ? APP_STATE.synthConfigs[epoch] : null;

    const freqs = { green: fBase, red: fBase * 2.0, blue: fBase * 1.4983, yellow: fBase * 4.0 };
    const f = freqs[color];
    
    let type = 'sine', freq = f;
    
    if (config) {
        type = config.type || 'sine';
        freq = f * (config.freq_multiplier || 1.0);
    } else {
        if (epoch === '1') { type = 'square'; freq = f * 2; } 
        else if (epoch === '2') { type = 'sawtooth'; freq = f; }
        else if (epoch === '3') { type = 'triangle'; freq = f / 2;} 
        else if (epoch === '4') { type = 'sine'; freq = f; } 
        else if (epoch === '5') { type = 'sine'; freq = f * 1.5; }
    }
    return { type, freq }; 
};

const startTone = (color, instanceId = 1) => {
    initAudio(instanceId);
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const nodes = synthNodes[instanceId];
    if (nodes.activeEngines[color]) return;

    const epoch = APP_STATE.synth[instanceId].synthEpoch;
    const config = APP_STATE.synthConfigs ? APP_STATE.synthConfigs[epoch] : null;
    const conf = getToneConfig(color, instanceId);
    
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const env = audioCtx.createGain();
    
    osc.type = conf.type;
    osc.frequency.setValueAtTime(conf.freq, audioCtx.currentTime);
    
    // Filter config
    const filterType = config ? (config.filter_type || 'lowpass') : 'lowpass';
    const filterCutoff = config ? (config.filter_cutoff || 4000) : 4000;
    const filterResonance = config ? (config.filter_resonance || 1.0) : 1.0;
    const filterEnvAmt = config ? (config.filter_env_amount || 0) : 0;
    const fAtt = config ? (config.filter_attack || 0.02) : 0.02;
    
    filter.type = filterType;
    filter.Q.value = filterResonance;
    filter.frequency.setValueAtTime(filterCutoff, audioCtx.currentTime);
    
    if (filterEnvAmt > 0) {
        filter.frequency.setTargetAtTime(filterCutoff + filterEnvAmt, audioCtx.currentTime, fAtt);
    }
    
    // LFO config (Pitch modulation)
    let lfo = null;
    let lfoGain = null;
    const lfoRate = config ? (config.lfo_rate || 0) : 0;
    const lfoDepth = config ? (config.lfo_depth || 0) : 0;
    
    if (lfoRate > 0 && lfoDepth > 0) {
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = lfoRate;
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = lfoDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
    }
    
    env.gain.setValueAtTime(0, audioCtx.currentTime);
    const attackConstant = config ? (config.attack || 0.02) : (epoch === '1' ? 0.005 : 0.02);
    env.gain.setTargetAtTime(0.7, audioCtx.currentTime, attackConstant);
    
    osc.connect(filter);
    filter.connect(env);
    env.connect(nodes.masterGain);
    env.connect(nodes.delayNode);
    
    osc.start();
    nodes.activeEngines[color] = { osc, env, filter, lfo };
    
    const quadrantId = instanceId === 1 ? `q-${color}` : `q-${color}-2`;
    const quadrant = document.getElementById(quadrantId);
    if(quadrant) quadrant.classList.add('active');
};

const stopTone = (color, instanceId = 1) => {
    const nodes = synthNodes[instanceId];
    if (!nodes || !nodes.activeEngines[color]) return;
    const { osc, env, filter, lfo } = nodes.activeEngines[color];
    const epoch = APP_STATE.synth[instanceId].synthEpoch;
    const config = APP_STATE.synthConfigs ? APP_STATE.synthConfigs[epoch] : null;
    const now = audioCtx.currentTime;
    
    env.gain.cancelScheduledValues(now);
    const releaseConstant = config ? (config.release || 0.05) : (epoch === '1' ? 0.01 : 0.05);
    env.gain.setTargetAtTime(0.00001, now, releaseConstant);
    
    const filterCutoff = config ? (config.filter_cutoff || 4000) : 4000;
    const filterEnvAmt = config ? (config.filter_env_amount || 0) : 0;
    const fRel = config ? (config.filter_release || releaseConstant) : releaseConstant;
    
    if (filter && filterEnvAmt > 0) {
        filter.frequency.cancelScheduledValues(now);
        filter.frequency.setTargetAtTime(filterCutoff, now, fRel);
    }
    
    osc.stop(now + 2.0); 
    if (lfo) lfo.stop(now + 2.0);
    
    delete nodes.activeEngines[color];
    
    const quadrantId = instanceId === 1 ? `q-${color}` : `q-${color}-2`;
    const quadrant = document.getElementById(quadrantId);
    if(quadrant) quadrant.classList.remove('active');
};

const userStartTone = (color, instanceId = 1) => {
    if (APP_STATE.isClassicPlaying && CLASSIC_STATE.mode !== 'human') return;
    startTone(color, instanceId);
    if (app.currentView === 'classic' && CLASSIC_STATE[instanceId].isPlaying) {
        handleClassicPlayerInput(color, instanceId);
    }
};

const userStopTone = (color, instanceId = 1) => {
    if (APP_STATE.isClassicPlaying && CLASSIC_STATE.mode !== 'human') return;
    stopTone(color, instanceId);
};

// ========================
// 4. ANIMATION & PLAYBACK EXPERIMENTAL
// ========================
const COLORS_ARRAY = ['green', 'red', 'yellow', 'blue'];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getUnitTime = () => Math.round(1200 / APP_STATE.bpm);

async function syncScrollToItem(item) {
    if (!item || !textScroller || !morseScroller) return;
    
    const halfHText = lyricsTextHalf.clientHeight / 2;
    const halfHMorse = lyricsMorseHalf.clientHeight / 2;
    
    const targetScrollT = -(item.textEl.offsetTop - halfHText + 20); 
    const targetScrollM = -(item.morseEl.offsetTop - halfHMorse + 20); 
    
    textScroller.style.transform = `translateY(${targetScrollT}px)`;
    morseScroller.style.transform = `translateY(${targetScrollM}px)`;
}

async function playSingleChar(char, item = null) {
    const unitTime = getUnitTime();
    const dotTime = unitTime;
    const dashTime = unitTime * 3;
    const symbolGap = unitTime; 
    
    if (item) {
        item.textEl.style.color = '#fff';
        item.morseEl.style.color = '#fff';
    }

    if (char === ' ' || char === '\n') {
        await sleep(unitTime * 5); 
        if (item) {
            item.textEl.style.color = '#555';
            item.morseEl.style.color = '#555';
        }
        return;
    }

    const morse = MORSE_DICT[char];
    if (!morse) {
        if (item) {
            item.textEl.style.color = '#555';
            item.morseEl.style.color = '#555';
        }
        return;
    }

    const colorIndex = char.charCodeAt(0) % 4;
    const color = COLORS_ARRAY[colorIndex];
    
    if (item) {
        item.textEl.classList.add(`active-${color}`);
        item.morseEl.classList.add(`active-${color}`);
    }

    for (let j = 0; j < morse.length; j++) {
        const sym = morse[j];
        const duration = (sym === '.') ? dotTime : dashTime;
        
        startTone(color);
        await sleep(duration);
        stopTone(color);
        await sleep(symbolGap);
    }
    
    if (item) {
        item.textEl.classList.remove(`active-${color}`);
        item.morseEl.classList.remove(`active-${color}`);
        item.textEl.style.color = 'var(--gold-dim)'; 
        item.morseEl.style.color = 'var(--gold-dim)'; 
    }
}

// === LIVE TELEMETRY LOGIC ===
const liveInput = document.getElementById('liveInput');
const transmitQueue = [];
let isQueueProcessing = false;

function queueCharacter(char) {
    transmitQueue.push(char);
    
    if (!textScroller) {
        createSplitScrollers();
        if(lyricsPlaceholderText) lyricsPlaceholderText.style.display = 'none';
    }
    
    let pT = document.getElementById('live-p-t');
    let pM = document.getElementById('live-p-m');
    if(!pT) {
        pT = document.createElement('p'); pT.id = 'live-p-t'; pT.className = 'lyric-p';
        pM = document.createElement('p'); pM.id = 'live-p-m'; pM.className = 'lyric-p';
        textScroller.appendChild(pT);
        morseScroller.appendChild(pM);
    }
    
    const spanT = document.createElement('span');
    spanT.textContent = char;
    spanT.className = 'lyric-char';
    pT.appendChild(spanT);
    
    const spanM = document.createElement('span');
    const morseStr = MORSE_DICT[char] || char; 
    spanM.textContent = (char === ' ') ? '   ' : morseStr + ' ';
    spanM.className = 'lyric-char';
    pM.appendChild(spanM);
    
    charSpans.push({ char: char, textEl: spanT, morseEl: spanM });
}

liveInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        lyricsTextHalf.innerHTML = '';
        lyricsMorseHalf.innerHTML = '';
        textScroller = null; morseScroller = null;
        if(lyricsPlaceholderText) lyricsPlaceholderText.style.display = 'block';
        charSpans = [];
        transmitQueue.length = 0;
        liveInput.value = '';
        isQueueProcessing = false;
        abortTXT = true;
        COLORS_ARRAY.forEach(c => stopTone(c));
        const btn = document.getElementById('playSequenceBtn');
        if (btn && !APP_STATE.isPlayingFILE) {
            btn.textContent = 'START';
            btn.style.borderColor = 'var(--gold)';
            btn.style.color = 'var(--gold)';
            if (!APP_STATE.textData || APP_STATE.textData.trim() === '') {
                btn.disabled = true;
            }
        }
        return;
    }
    
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        queueCharacter(e.key.toUpperCase());
        processQueue();
    }
});

liveInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    for (let i = 0; i < paste.length; i++) {
        queueCharacter(paste[i].toUpperCase());
    }
    processQueue();
});

async function processQueue() {
    if (isQueueProcessing) return;
    isQueueProcessing = true;
    
    const btn = document.getElementById('playSequenceBtn');
    if (btn && transmitQueue.length > 1) {
        btn.disabled = false;
        btn.textContent = '[ STOP ]';
        btn.style.borderColor = 'var(--v-red)';
        btn.style.color = 'var(--v-red)';
    }
    
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    while(transmitQueue.length > 0) {
        if (abortTXT) break; 

        const unitTime = getUnitTime();
        const char = transmitQueue.shift();
        const currentIndex = charSpans.length - transmitQueue.length - 1;
        const item = charSpans[currentIndex];
        
        await syncScrollToItem(item);
        await playSingleChar(char, item);
        await sleep(unitTime * 3);
    }
    isQueueProcessing = false;
    abortTXT = false;
    if (!APP_STATE.isPlayingFILE) {
        const btn = document.getElementById('playSequenceBtn');
        if (btn) {
            btn.textContent = 'START';
            btn.style.borderColor = 'var(--gold)';
            btn.style.color = 'var(--gold)';
            if (!APP_STATE.textData || APP_STATE.textData.trim() === '') {
                btn.disabled = true;
            }
        }
    }
}

// === PLAYBACK FILE TXT ===
let abortTXT = false;

playSequenceBtn.addEventListener('click', async () => {
    if (APP_STATE.isPlayingFILE || isQueueProcessing) {
        // Detener
        APP_STATE.isPlayingFILE = false;
        abortTXT = true;
        isQueueProcessing = false;
        transmitQueue.length = 0;
        playSequenceBtn.classList.remove('playing');
        playSequenceBtn.textContent = 'START';
        playSequenceBtn.style.borderColor = 'var(--gold)';
        playSequenceBtn.style.color = 'var(--gold)';
        if (!APP_STATE.textData || APP_STATE.textData.trim() === '') {
            playSequenceBtn.disabled = true;
        }
        if(fileInput) fileInput.disabled = false;
        COLORS_ARRAY.forEach(c => stopTone(c));
        return; 
    }
    
    // If there's no text data, the button should be disabled, so prevent playing.
    // This also handles the case where the button was enabled by live input but then textData was cleared.
    if (!APP_STATE.textData || APP_STATE.textData.trim() === '') {
        playSequenceBtn.disabled = true;
        return; 
    }

    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    APP_STATE.isPlayingFILE = true;
    abortTXT = false;
    
    playSequenceBtn.textContent = '[ STOP ]';
    playSequenceBtn.style.borderColor = 'var(--v-red)';
    playSequenceBtn.style.color = 'var(--v-red)';
    fileInput.disabled = true;
    liveInput.disabled = true;

    for (let i = 0; i < charSpans.length; i++) {
        if (!APP_STATE.isPlayingFILE || abortTXT) break; 
        
        const unitTime = getUnitTime();
        const item = charSpans[i];
        
        await syncScrollToItem(item);
        await playSingleChar(item.char, item);
        await sleep(unitTime * 3); 
    }
    
    APP_STATE.isPlayingFILE = false;
    abortTXT = false;
    playSequenceBtn.textContent = 'START';
    playSequenceBtn.style.borderColor = 'var(--gold)';
    playSequenceBtn.style.color = 'var(--gold)';
    playSequenceBtn.disabled = false;
    fileInput.disabled = false;
    liveInput.disabled = false;
});

// ========================
// 5. CLASSIC GAME LOGIC
// ========================

const startBotVsHumanBtn = document.getElementById('startBotVsHumanBtn');
const startBotVsBotBtn = document.getElementById('startBotVsBotBtn');
const startDualBotBtn = document.getElementById('startDualBotBtn');
const classicScoreDisplay = document.getElementById('classicScoreDisplay');

const classicSpeedControl = document.getElementById('classicSpeedControl');
const classicSpeedSlider = document.getElementById('classicSpeedSlider');
const classicSpeedDisplay = document.getElementById('classicSpeedDisplay');

if (classicSpeedSlider) {
    classicSpeedSlider.addEventListener('input', (e) => {
        classicSpeedDisplay.textContent = e.target.value;
    });
}

function resetClassicGame(mode) {
    if (APP_STATE.isClassicPlaying || CLASSIC_STATE[1].isPlaying || CLASSIC_STATE[2].isPlaying) {
        stopClassicGame();
        return;
    }

    CLASSIC_STATE.mode = mode;
    CLASSIC_STATE[1] = { sequence: [], playerIndex: 0, isPlaying: true, score: 0 };
    CLASSIC_STATE[2] = { sequence: [], playerIndex: 0, isPlaying: mode === 'dual', score: 0 };
    APP_STATE.isClassicPlaying = true;
    
    // Reset all buttons first
    startBotVsHumanBtn.textContent = 'BOT VS HUMAN';
    startBotVsBotBtn.textContent = 'BOT VS BOT';
    startDualBotBtn.textContent = 'DUAL BOT VS BOT';
    startBotVsHumanBtn.disabled = true;
    startBotVsBotBtn.disabled = true;
    startDualBotBtn.disabled = true;

    // Highlight the active one as STOP
    let activeBtn = null;
    if (mode === 'human') activeBtn = startBotVsHumanBtn;
    else if (mode === 'bot') activeBtn = startBotVsBotBtn;
    else if (mode === 'dual') activeBtn = startDualBotBtn;

    if (activeBtn) {
        activeBtn.disabled = false;
        activeBtn.textContent = '[ STOP ]';
        activeBtn.style.color = 'var(--v-red)';
        activeBtn.style.borderColor = 'var(--v-red)';
    }
    
    if (mode === 'dual') {
        document.getElementById('classic-simon-placeholder-2').style.display = 'flex';
        document.getElementById('classic-simons-wrapper').classList.add('dual-active');
    } else {
        document.getElementById('classic-simon-placeholder-2').style.display = 'none';
        document.getElementById('classic-simons-wrapper').classList.remove('dual-active');
    }

    if (classicSpeedControl) {
        classicSpeedControl.style.opacity = (mode === 'bot' || mode === 'dual') ? '1' : '0';
        classicSpeedControl.style.pointerEvents = (mode === 'bot' || mode === 'dual') ? 'auto' : 'none';
        
        if (mode === 'bot' || mode === 'dual') {
            classicSpeedSlider.value = 100;
            classicSpeedDisplay.textContent = "100";
        }
    }
    
    generateNextClassicStep(1);
    if(mode === 'dual') generateNextClassicStep(2);
}

function stopClassicGame() {
    CLASSIC_STATE[1].isPlaying = false;
    CLASSIC_STATE[2].isPlaying = false;
    APP_STATE.isClassicPlaying = false;
    COLORS_ARRAY.forEach(c => { stopTone(c, 1); stopTone(c, 2); });

    startBotVsHumanBtn.disabled = false;
    startBotVsBotBtn.disabled = false;
    startDualBotBtn.disabled = false;
    startBotVsHumanBtn.textContent = 'BOT VS HUMAN';
    startBotVsBotBtn.textContent = 'BOT VS BOT';
    startDualBotBtn.textContent = 'DUAL BOT VS BOT';
    startBotVsHumanBtn.style.color = 'var(--gold)';
    startBotVsHumanBtn.style.borderColor = 'var(--gold)';
    startBotVsBotBtn.style.color = 'var(--gold)';
    startBotVsBotBtn.style.borderColor = 'var(--gold)';
    startDualBotBtn.style.color = 'var(--gold)';
    startDualBotBtn.style.borderColor = 'var(--gold)';
}

if (startBotVsHumanBtn) startBotVsHumanBtn.addEventListener('click', () => {
    if (CLASSIC_STATE[1].isPlaying || CLASSIC_STATE[2].isPlaying) stopClassicGame();
    else resetClassicGame('human');
});
if (startBotVsBotBtn) startBotVsBotBtn.addEventListener('click', () => {
    if (CLASSIC_STATE[1].isPlaying || CLASSIC_STATE[2].isPlaying) stopClassicGame();
    else resetClassicGame('bot');
});
if (startDualBotBtn) startDualBotBtn.addEventListener('click', () => {
    if (CLASSIC_STATE[1].isPlaying || CLASSIC_STATE[2].isPlaying) stopClassicGame();
    else resetClassicGame('dual');
});

async function generateNextClassicStep(instanceId = 1) {
    if (!CLASSIC_STATE[instanceId].isPlaying) return;

    const randomColor = COLORS_ARRAY[Math.floor(Math.random() * 4)];
    CLASSIC_STATE[instanceId].sequence.push(randomColor);
    CLASSIC_STATE[instanceId].score = CLASSIC_STATE[instanceId].sequence.length;
    
    const maxS = Math.max(CLASSIC_STATE[1].score || 0, CLASSIC_STATE[2].score || 0);
    classicScoreDisplay.textContent = `SEQUENCE: ${maxS.toString().padStart(3, '0')}`;
    
    await sleep(800 * (1 + Math.random() * 0.2)); 
    await playClassicSequence(instanceId);
}

async function playClassicSequence(instanceId = 1) {
    for (let i = 0; i < CLASSIC_STATE[instanceId].sequence.length; i++) {
        if (!CLASSIC_STATE[instanceId].isPlaying) break; 
        
        const color = CLASSIC_STATE[instanceId].sequence[i];
        let duration = 500;
        let gap = 150;
        
        if (CLASSIC_STATE.mode === 'human') {
            const speedMultiplier = Math.max(0.25, 1.0 - (CLASSIC_STATE[instanceId].score * 0.05));
            duration = 500 * speedMultiplier;
            gap = 150;
        } else {
            const pct = parseFloat(classicSpeedSlider.value) / 100.0;
            duration = 500 / pct; 
            gap = duration * 0.3; 
        }
        
        startTone(color, instanceId);
        await sleep(duration);
        stopTone(color, instanceId);
        await sleep(gap); 
    }
    
    CLASSIC_STATE[instanceId].playerIndex = 0; 
    
    if ((CLASSIC_STATE.mode === 'bot' || CLASSIC_STATE.mode === 'dual') && CLASSIC_STATE[instanceId].isPlaying) {
        await sleep(1000);
        generateNextClassicStep(instanceId);
    }
}

function handleClassicPlayerInput(color, instanceId = 1) {
    if (!CLASSIC_STATE[instanceId].isPlaying || CLASSIC_STATE.mode !== 'human') return;
    
    const expectedColor = CLASSIC_STATE[instanceId].sequence[CLASSIC_STATE[instanceId].playerIndex];
    if (color === expectedColor) {
        CLASSIC_STATE[instanceId].playerIndex++;
        if (CLASSIC_STATE[instanceId].playerIndex === CLASSIC_STATE[instanceId].sequence.length) {
             CLASSIC_STATE[instanceId].playerIndex = 0; 
             generateNextClassicStep(instanceId);
             
             const maxS = Math.max(CLASSIC_STATE[1].score, CLASSIC_STATE[2].score);
             if (maxS > CLASSIC_STATE.highScore) {
                 CLASSIC_STATE.highScore = maxS;
             }
        }
    } else {
        gameOverClassic();
    }
}

async function gameOverClassic() {
    const maxS = Math.max(CLASSIC_STATE[1].score || 0, CLASSIC_STATE[2].score || 0);
    if(maxS > CLASSIC_STATE.highScore) CLASSIC_STATE.highScore = maxS;

    classicScoreDisplay.textContent = `[ FALLO DE SISTEMA ] // SEQ ALCANZADA: ${maxS.toString().padStart(3, '0')}`;
    
    stopClassicGame();
    
    if (classicSpeedControl) {
        classicSpeedControl.style.opacity = '0';
        classicSpeedControl.style.pointerEvents = 'none';
    }
    
    COLORS_ARRAY.forEach(c => startTone(c, 1));
    if(CLASSIC_STATE.mode === 'dual') COLORS_ARRAY.forEach(c => startTone(c, 2));
    
    await sleep(800);
    
    COLORS_ARRAY.forEach(c => stopTone(c, 1));
    if(CLASSIC_STATE.mode === 'dual') COLORS_ARRAY.forEach(c => stopTone(c, 2));
}


// Final Initialization
async function loadSynthConfigs() {
    try {
        APP_STATE.synthConfigs = window.SYNTH_CONFIGS;
        
        const selects = [document.getElementById('synthEpochSelect'), document.getElementById('synthEpochSelect2')];
        selects.forEach(select => {
            if (!select) return;
            select.innerHTML = '';
            for (const [id, config] of Object.entries(APP_STATE.synthConfigs)) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = config.name;
                if (id === "4") option.selected = true;
                select.appendChild(option);
            }
        });
    } catch (e) {
        console.error("Failed to load synths.yaml", e);
    }
}

loadSynthConfigs();
setupEngineControls(1);
setupEngineControls(2);

// Ratón
document.querySelectorAll('.quadrant').forEach(q => {
    q.addEventListener('mousedown', (e) => userStartTone(q.dataset.color, parseInt(q.dataset.instance || '1')));
    q.addEventListener('mouseup', (e) => userStopTone(q.dataset.color, parseInt(q.dataset.instance || '1')));
    q.addEventListener('mouseleave', (e) => userStopTone(q.dataset.color, parseInt(q.dataset.instance || '1')));
});
