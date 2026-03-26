# MORSIMON - Voyager Edition

MORSIMON es una instalación artística audiovisual y un "Oráculo" generativo que fusiona el lenguaje máquina (Código Morse) con la lúdica interactiva del clásico juego de memoria "Simón". 

Diseñado bajo una estética brutalista inspirada en la sonda espacial Voyager (1977), el proyecto utiliza la Web Audio API para generar paisajes sonoros analógicos en tiempo real a través de 5 épocas de síntesis distintas.

## Características Principales

### 🔴 Modo Clásico (Instancias Duales)
- **Bot vs Human:** Juego de memoria tradicional con dificultad progresiva.
- **Bot vs Bot:** Modo generativo donde el algoritmo juega contra sí mismo.
- **Dual Bot vs Bot:** Dos instancias independientes (Simón A y B) con sus propios parámetros de síntesis, creando polifonías desfasadas y texturas rítmicas complejas.

### 📡 Modo Experimental (Oráculo)
- **Transmisión en Vivo:** Traducción instantánea de texto a código Morse.
- **Lector de Archivos:** Carga de archivos `.txt` para reproducciones largas.
- **Motor de Control:** Ajuste fino de `ROOT_TONE`, `SYNTH_EPOCH`, `DELAY_TIME` y `FEEDBACK` para manipular la señal en tiempo real.

### 🌌 Estética Voyager (Zen Mode)
- **Modo Proyección:** Atajo de teclado `X` para ocultar la interfaz y centrar los instrumentos en un entorno inmersivo.
- **Responsive:** Optimizado para dispositivos móviles con layout adaptativo y scroll nativo.
- **Controles de Teclado:** 
  - Simón 1 (Izq): `Q`, `W`, `A`, `S` 
  - Simón 2 (Der): `E`, `R`, `D`, `F`

## Instalación y Uso

Este es un proyecto **Vanilla Web** (HTML5, CSS3, Vanilla JS). No requiere dependencias ni servidores complejos.

1. Clona el repositorio: `git clone https://github.com/vlasvlasvlas/morsimon.git`
2. Abre `index.html` en cualquier navegador moderno.
3. (Opcional) Sube los archivos a GitHub Pages para tener tu propia instalación online.

## Detalles Técnicos
- **Audio:** Motor de síntesis sustractiva/aditiva nativo (Web Audio API).
- **Control de Estado:** Sistema de colas asíncronas para la transmisión de código Morse sin bloqueos de UI.
- **Ruteado:** Los efectos de Delay y Ganancia están aislados por instancia para permitir mezclas complejas en modo Dual.

---
*MORSIMON es un proyecto de código abierto para entusiastas del sonido experimental y la estética espacial.*
