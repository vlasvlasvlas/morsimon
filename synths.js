// MORSIMON - Configuración de Sintetizadores
// Edita este archivo para agregar o modificar los sonidos.

window.SYNTH_CONFIGS = {
  "1": {
    name: "1. TELEGRAPH",
    type: "sine",
    freq_multiplier: 1.5,
    attack: 0.005,
    release: 0.05,
    filter_cutoff: 8000
  },
  "2": {
    name: "2. BUCHLA",
    type: "triangle",
    freq_multiplier: 1.0,
    attack: 0.005,
    release: 0.1,
    filter_type: "lowpass",
    filter_cutoff: 200,
    filter_env_amount: 3000,
    filter_attack: 0.005,
    filter_release: 0.1,
    filter_resonance: 3.0
  },
  "3": {
    name: "3. VANGELIS",
    type: "sawtooth",
    freq_multiplier: 0.5,
    attack: 0.15,
    release: 0.8,
    filter_type: "lowpass",
    filter_cutoff: 400,
    filter_env_amount: 1500,
    filter_attack: 0.2,
    filter_release: 0.8,
    filter_resonance: 2.0,
    lfo_rate: 4.5,
    lfo_depth: 10.0
  },
  "4": {
    name: "4. SPIEGEL",
    type: "square",
    freq_multiplier: 1.0,
    attack: 0.02,
    release: 0.3,
    filter_type: "lowpass",
    filter_cutoff: 800,
    filter_env_amount: 2500,
    filter_attack: 0.02,
    filter_release: 0.4,
    filter_resonance: 1.5
  },
  "5": {
    name: "5. COSMOS",
    type: "sine",
    freq_multiplier: 2.0,
    attack: 0.2,
    release: 1.5,
    filter_cutoff: 4000,
    lfo_rate: 1.5,
    lfo_depth: 12.0
  },
  "6": {
    name: "6. SPACE LADY",
    type: "square",
    freq_multiplier: 1.0,
    attack: 0.05,
    release: 0.4,
    filter_type: "lowpass",
    filter_cutoff: 1800,
    filter_resonance: 1.0,
    lfo_rate: 6.0,
    lfo_depth: 7.0
  }
};
