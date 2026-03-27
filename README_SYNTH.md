# MORSIMON - Configuración de Sintetizadores

Este documento explica cómo agregar o modificar los motores de síntesis disponibles en el proyecto MORSIMON. El motor soporta síntesis sustractiva avanzada con osciladores, filtros y modulación (LFO).

## Cómo agregar un sonido nuevo

1. Abre `synths.js` en tu editor.
2. Agrega un nuevo bloque JS dentro de `window.SYNTH_CONFIGS = { ... }`.
3. Define las propiedades indicadas a continuación.

### Ejemplo
```javascript
window.SYNTH_CONFIGS = {
  // ...
  "7": {
    name: "7. MI NUEVO SYNTH",
    type: "sawtooth",
    freq_multiplier: 1.0,
    attack: 0.1,
    release: 0.8
  }
};
```

### Propiedades Básicas de Oscilador y Amplitud

- `name`: Etiqueta visible en el menú.
- `type`: Forma de onda (`"sine"`, `"square"`, `"sawtooth"`, `"triangle"`).
- `freq_multiplier`: Multiplicador cromático (ej. `0.5` = una octava abajo).
- `attack`: Segundos para llegar al volumen máximo.
- `release`: Segundos de la cola resonante post-soltar.

### Propiedades de Filtro (Subtractive Synthesis)

El motor ahora incluye un filtro **Biquad** independiente por voz, permitiendo moldear la brillantez y armónicos en el tiempo.

- `filter_type`: Tipo de filtro (`"lowpass"`, `"highpass"`, `"bandpass"`). Por defecto "lowpass".
- `filter_cutoff`: Frecuencia de corte base en Hz (ej. `400`).
- `filter_resonance`: Valor Q o resonancia. Hace más brillante o silbante el punto de corte (ej. `1.0` a `10.0`).
- `filter_env_amount`: (Opcional) Cuántos Hz barren o "barren" las frecuencias tras presionar. Si pones el corte en 400 y el env_amount en 1500, el sonido iniciará opaco, se abrirá hasta 1900Hz y se cerrará de nuevo.
- `filter_attack`: Tiempo de barrido de apertura del filtro.
- `filter_release`: Tiempo de barrido de cierre del filtro tras soltar.

### Propiedades de Modulación (LFO Pitch Vibrato)

- `lfo_rate`: Velocidad de la vibración o fluctuación en Hz (ej. `5.0` para un vibrato rápido, o `1.5` para inestabilidad "wow/flutter" estilo tape).
- `lfo_depth`: Profundidad de la fluctuación (ej. `5.0` a `15.0`). Ideal para el tono orgánico y análogo estilo Vangelis o Boards of Canada.
