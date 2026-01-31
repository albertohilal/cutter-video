# Video Cutter

Herramienta automatizada para cortar videos largos en múltiples clips usando timestamps definidos en `chapters.txt` y subtítulos `.srt` para máxima precisión.

## 🚀 Características

- ✂️ **Corte por capítulos**: Divide videos usando timestamps definidos
- 📝 **Generación automática de SRT**: Crea archivos de subtítulos sincronizados por capítulo
- 🎯 **Alta precisión**: Usa subtítulos para calcular duraciones exactas
- ⚡ **Modo rápido**: Sin recodificación (`copy`) o recodificación segura (`reencode`)
- 🎬 **3 modos de corte**: `chapters`, `srt`, `chapters+srt`
- 🧹 **Sanitización automática**: Nombres de archivo seguros y compatibles
- 🔧 **Configurable**: Toda la configuración en un solo archivo

## 📋 Requisitos

- Node.js (v14 o superior)
- FFmpeg instalado en el sistema
- FFprobe (incluido con FFmpeg)

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/albertohilal/cutter-video.git
cd cutter-video

# Instalar dependencias (ninguna externa requerida)
npm install
```

## 📁 Estructura del Proyecto

```
cutter-video/
├── input/              # Videos y subtítulos de entrada
│   ├── video.mp4      # Video a cortar (cualquier nombre)
│   └── subtitles.srt  # Subtítulos opcionales
├── output/            # Videos y SRT generados
├── scripts/
│   ├── cut.js         # Script principal
│   └── helpers.js     # Funciones auxiliares
├── chapters.txt       # Definición de capítulos
├── config.js          # Configuración
└── package.json
```

## 📝 Uso

### 1. Preparar archivos

**chapters.txt** (obligatorio):
```
00:00|Introducción al Curso
00:46|Requerimientos
01:38|Qué es Node.js
03:50|Instalación
```

**input/video.mp4**: Coloca tu video en la carpeta `input/`

**input/subtitles.srt** (opcional): Para mayor precisión

### 2. Configurar

Edita `config.js`:

```javascript
{
  cutMode: "chapters",    // "chapters" | "srt" | "chapters+srt"
  mode: "copy",           // "copy" (rápido) | "reencode" (seguro)
  sanitize: {
    replaceSpaces: "-",   // Reemplazar espacios con guiones
    lowercase: false,
    maxLength: 200
  }
}
```

### 3. Ejecutar

```bash
node scripts/cut.js
```

## 🎯 Modos de Corte

### `chapters` (por defecto)
Corta usando `chapters.txt`. Si existe `subtitles.srt`, refina las duraciones automáticamente.

**Salida:**
- `01 - Introduccion.mp4`
- `01 - Introduccion.srt`
- `02 - Requerimientos.mp4`
- `02 - Requerimientos.srt`

### `srt`
Genera un video por cada subtítulo del archivo SRT.

**Uso:**
```javascript
cutMode: "srt"
```

### `chapters+srt`
Combina capítulos con precisión máxima usando subtítulos agrupados.

**Uso:**
```javascript
cutMode: "chapters+srt"
```

## ⚙️ Configuración Avanzada

### Modos de exportación

**Modo Copy (rápido)**
```javascript
mode: "copy"
```
- Sin recodificación
- Procesamiento ultrarrápido
- Conserva calidad original
- Puede tener problemas con timestamps inexactos

**Modo Reencode (seguro)**
```javascript
mode: "reencode",
reencode: {
  videoCodec: "libx264",
  audioCodec: "aac",
  preset: "fast",
  crf: 20
}
```

### Sanitización de nombres

```javascript
sanitize: {
  replaceSpaces: "-",    // "-" | "_" | " "
  lowercase: false,      // true para minúsculas
  maxLength: 200         // Longitud máxima
}
```

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

[2/36] Requerimientos
    Inicio: 00:46 | Duración: 00:00:56
✅ Completado
📝 Subtítulos: 02 - Requerimientos.srt (31 bloques)

══════════════════════════════════════════════════
🎉 Proceso completado exitosamente
📁 Videos en: output/
```

## 🔧 Solución de Problemas

### El video no se detecta
- Verifica que el archivo esté en `input/`
- Extensiones soportadas: `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`
- Solo debe haber **un** archivo de video en `input/`

### Errores de FFmpeg
- Asegúrate de tener FFmpeg instalado: `ffmpeg -version`
- Prueba con `mode: "reencode"` si `copy` falla

### Caracteres especiales en nombres
- El sistema sanitiza automáticamente
- Configura `replaceSpaces` según prefieras

### No se generan SRT
- Verifica que `input/subtitles.srt` exista
- Formato SRT válido requerido

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Alberto Hilal**
- GitHub: [@albertohilal](https://github.com/albertohilal)

## 🙏 Agradecimientos

- FFmpeg por el procesamiento de video
- Comunidad Node.js

---

**Nota:** Este proyecto no incluye dependencias externas de npm, solo módulos nativos de Node.js.
