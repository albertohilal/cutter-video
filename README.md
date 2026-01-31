# Video Cutter

Herramienta automatizada para cortar videos largos en múltiples clips usando timestamps definidos en `chapters.txt` y subtítulos `.srt` para máxima precisión.

El sistema permite generar **videos por capítulo** y **subtítulos independientes por capítulo**, sin quemarlos ni embeberlos en el video.

---

## 🚀 Características

- ✂️ **Corte por capítulos**: Divide videos usando timestamps definidos
- 📝 **Generación automática de SRT**: Crea archivos de subtítulos sincronizados por capítulo
- 🎯 **Alta precisión**: Usa subtítulos para calcular duraciones exactas
- ⚡ **Modo rápido**: Sin recodificación (`copy`) o recodificación segura (`reencode`)
- 🎬 **Modos de corte configurables** mediante `cutMode`
- 🧹 **Sanitización automática**: Nombres de archivo seguros y compatibles
- 🔧 **Configurable**: Toda la configuración centralizada en `config.js`
- 📦 **Sin dependencias npm externas** (solo Node.js + FFmpeg)

---

## 📋 Requisitos

- Node.js v14 o superior
- FFmpeg instalado en el sistema
- FFprobe (incluido con FFmpeg)

Verificar instalación:

```bash
node -v
ffmpeg -version
````

---

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/albertohilal/cutter-video.git
cd cutter-video

# No requiere dependencias externas
npm install
```

---

## 📁 Estructura del Proyecto

```
cutter-video/
├── input/              # Video y subtítulos de entrada
│   ├── video.mp4       # Video a cortar (nombre libre)
│   └── subtitles.srt   # Subtítulos completos (opcional)
├── output/             # Videos y SRT generados
├── scripts/
│   ├── cut.js          # Script principal
│   └── helpers.js     # Funciones auxiliares
├── chapters.txt        # Definición de capítulos
├── config.js           # Configuración central
└── package.json
```

---

## 📝 Uso

### 1. Preparar los archivos

### `chapters.txt` (obligatorio)

Formato:

```
MM:SS|Título del capítulo
HH:MM:SS|Título largo
```

Ejemplo:

```
00:00|Introducción al Curso
00:46|Requerimientos
01:38|Qué es Node.js
03:50|Instalación
```

### Video de entrada

Colocar **un solo archivo de video** en `input/`.
Extensiones soportadas:

* `.mp4`
* `.webm`
* `.mkv`
* `.avi`
* `.mov`

El sistema detecta automáticamente el archivo.

### Subtítulos (opcional, recomendado)

Colocar el archivo completo de subtítulos en:

```
input/subtitles.srt
```

Si existe, se utilizará para calcular duraciones con **mayor precisión**.

---

## ⚙️ Configuración (`config.js`)

Ejemplo básico:

```js
module.exports = {
  cutMode: "chapters",   // "chapters" | "chapters+srt"
  mode: "copy",          // "copy" (rápido) | "reencode" (seguro)

  sanitize: {
    replaceSpaces: "-",
    lowercase: false,
    maxLength: 200
  }
};
```

---

## 🎯 Modos de Corte (`cutMode`)

### `chapters` (por defecto)

* Usa `chapters.txt` como fuente de inicio
* Si existe `subtitles.srt`, refina las duraciones automáticamente
* Genera **video + SRT por capítulo**

Salida:

```
01 - Introduccion.mp4
01 - Introduccion.srt
02 - Requerimientos.mp4
02 - Requerimientos.srt
```

---

### `chapters+srt`

* Usa capítulos como base
* Agrupa subtítulos dentro de cada rango
* Calcula el final del capítulo usando el último subtítulo
* Máxima precisión temporal

Recomendado para cursos largos.

---

### `srt` (experimental)

Modo experimental que corta clips basándose únicamente en subtítulos.

⚠️ No recomendado para videos largos sin revisión manual.

---

## ⚡ Modos de Exportación

### Modo rápido (copy)

```js
mode: "copy"
```

* Sin recodificación
* Procesamiento ultrarrápido
* Conserva calidad original
* Puede fallar con timestamps imprecisos

---

### Modo seguro (reencode)

```js
mode: "reencode",
reencode: {
  videoCodec: "libx264",
  audioCodec: "aac",
  preset: "fast",
  crf: 20
}
```

* Recodificación completa
* Máxima compatibilidad
* Más lento

---

## ▶️ Ejecutar

```bash
node scripts/cut.js
```

---

## 📊 Ejemplo de Salida

```
🎬 Iniciando cortador de videos

📹 Video detectado: video.mp4
⏱️  Duración: 4h 42m 34s
📝 Subtítulos: 8522 bloques detectados
📋 Capítulos: 36
⚙️  Modo: rápido (sin recodificar)
🎯 Corte: chapters.txt
🎯 Precisión: SRT (alta)

🚀 Procesando...

[1/36] Introducción al Curso
    Inicio: 00:00 | Duración: 00:00:49
✅ Completado
📝 Subtítulos: 01 - Introduccion.srt (27 bloques)

══════════════════════════════════════════════════
🎉 Proceso completado exitosamente
📁 Archivos generados en: output/
```

---

## 🔧 Solución de Problemas

### El video no se detecta

* Verificar que haya **un solo video** en `input/`
* Revisar extensiones soportadas

### Errores de FFmpeg

* Confirmar instalación: `ffmpeg -version`
* Probar con `mode: "reencode"`

### No se generan SRT

* Verificar `input/subtitles.srt`
* Comprobar formato SRT válido

### Caracteres especiales en títulos

* El sistema sanitiza automáticamente los nombres
* Configurable desde `config.js`

---

## ⚠️ Nota importante sobre subtítulos

Los archivos `.srt` generados son **independientes**.
No se queman ni se embeben en los videos.

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama (`git checkout -b feature/nueva-feature`)
3. Commit (`git commit -m "Agregar nueva feature"`)
4. Push (`git push origin feature/nueva-feature`)
5. Abrir Pull Request

---

## 📄 Licencia

MIT License
Ver archivo [LICENSE](LICENSE)

---

## 👤 Autor

**Alberto Hilal**
GitHub: [https://github.com/albertohilal](https://github.com/albertohilal)

---

## 🙏 Agradecimientos

* FFmpeg por el procesamiento de video
* Comunidad Node.js

```

