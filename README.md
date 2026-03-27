# MORSIMON

**MORSIMON** es un proyecto interactivo que cruza el lenguaje del código Morse con la lógica del clásico juego **Simón**.

## Qué propone

MORSIMON funciona como juego de memoria y también como sistema de sonido y transmisión.

### Modo clásico

- **Bot vs Human**  
  La versión tradicional del juego, pensada para poner a prueba la memoria y la atención.

- **Bot vs Bot**  
  El sistema se ejecuta de forma autónoma, permitiendo escuchar las secuencias y variaciones generadas por el motor sonoro.

- **Dual Bot vs Bot**  
  Dos instancias de Simón corren en paralelo, cada una con su propio motor de audio, produciendo capas sonoras, cruces rítmicos y desajustes temporales.

### Modo experimental

- Permite escribir texto en tiempo real y traducirlo a **código Morse**.
- Permite cargar archivos `.txt` para generar transmisiones automáticas.
- Todo el audio es generado por código en tiempo real, sin samples externos.

## Controles de teclado

- **Simón 1 (izquierda):** `Q`, `W`, `A`, `S`
- **Simón 2 (derecha):** `E`, `R`, `D`, `F`
- **Modo Zen:** presionar `X` para ocultar la interfaz y dejar visibles solo los instrumentos.

## Instalación

Dado que el proyecto carga la configuración de sintes desde el archivo `synths.js`, puedes elegir abrir el `index.html` directamente (funcionará sin problemas) o bien levantar un servidor de desarrollo si prefieres esa experiencia (útil para live reload o testeo en red).

Para correr el servidor local en el puerto 8000:
```bash
npm install
npm start
```

Luego abre `http://localhost:8000` en tu navegador.
## Sobre el proyecto

MORSIMON toma la estructura secuencial del juego Simón y la cruza con la traducción de texto a Morse, abriendo un uso más libre del sistema entre juego, secuencia y escucha.

## Repositorio

[GitHub: vlasvlasvlas/morsimon](https://github.com/vlasvlasvlas/morsimon)
