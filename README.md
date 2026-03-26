# MORSIMON - Voyager Edition

Morsimon es un proyecto interactivo puramente experimental que funciona como un secuenciador armónico/rítmico y como una instalación de arte sonoro. Es una reimaginación estético-conceptual del clásico juego "Simón" de los años 80, pero convertido en un **traductor sinestésico de Código Morse de la era de la carrera espacial (Voyager / Carl Sagan)** y sintetizador basado puramente en la Web Audio API (JS puro).

## 🚀 Modos de Uso

### Oráculo Experimental (El Lector Morse)
Permite importar un archivo plano de texto (`.txt`) y observar cómo la máquina lo recita a través del espacio y el tiempo.
- Carga un `.txt` usando el menú de mandos lateral.
- Modifica el **BPM (Beats Per Minute)** para acelerar o pausar sutilmente la lectura de la máquina.
- El panel de lectura (estilo "Spotify Lyrics") hará un *auto-scroll* suave hacia el centro.

### Módulo de Juego y Síntesis (Fase de Pruebas)
Puedes usar el tablero principal como un instrumento de improvisación tocando los colores, encadenando polirritmias o imitando el estilo electro-orgánico de los sistemas Buchla o de Laurie Spiegel.

## 🎹 Controles de Teclado
Se han mapeado las teclas de tu ordenador a los 4 cuadrantes para una interpretación coreografiada de alta velocidad:
- **`Q`** : Cuadrante Verde (Earth/Soma)
- **`W`** : Cuadrante Rojo (Agresivo/Saw)
- **`A`** : Cuadrante Amarillo (Cristalino/Air)
- **`S`** : Cuadrante Azul (Agua/Sub)

*NOTA:* Para instalaciones en salas y proyecciones visuales inmersivas, cuentas con un botón de **[ FULLSCREEN ]** situado en la sección superior de telemetría, en la barra de título principal de la instalación.

---

## 🛠 Instalación y Arquitectura Local

Dado que Morsimon pertenece a un esquema arquitectónico de filosofía SOTA e hiper-minimalista plano (Sin node_modules, sin configuraciones esotéricas de empaquetadores como Webpack, Vite ni frameworks como React), su instalación y ejecución es **nativa y directa al vuelo**.

### Ejecutando en Red Local (Servidor de Pruebas Creador)
Es un plano de HTML, JS y CSS.
1. Abre tu terminal.
2. Navega al directorio del proyecto `cd /Users/vladimirobellini/Documents/REPOS/morsimon`.
3. Lanza cualquier mini-servidor estático como Python3 por ejemplo:
   ```bash
   python3 -m http.server 8000
   ```
4. Navega en tu consola VGR_112_B (tu navegador) a: `localhost:8000`.

### Subiendo el Sistema al Espacio Profundo (GitHub Pages)
Dado que es código del lado del cliente puro, puede funcionar excelentemente desde GitHub Pages.
Como este repositorio en GitHub existe bajo la cuenta personal **vlasvlasvlas** en la dirección de red github, dirígete en tu panel de control de GH (Settings -> Pages) y activa las pages hacia tu rama principal o `master`.

## Ecosistema de Fases y Progreso
Morsimon está en iteración activa:
- **Fase 1 completada:** Rediseño arquitectónico visual (El "Golden Record"). Enrutador lógico. Funciones modulares UI.
- **Fase 2 completada:** Analizador del "Oráculo" (Motor Morse Web API Audio), interfaz "Lyrics" con highlight temporal, scroll sincrónico.
- **Fase 3 & Fase 4:** Actualmente en los escritorios del laboratorio de diseño, programadas para implementar el "Flip 3D del Anverso Analógico" para controlar texturas sintéticas (Convoluciones, FM, etc) y el clasico motor mecánico de juego secuencial.

*A communication transmission made purely from logic, algorithms, light, and sound frequencies.*
