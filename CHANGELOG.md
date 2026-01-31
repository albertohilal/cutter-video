# Changelog - Cutter Video

## [2.0.0] - 31 de enero de 2026

### ✨ Nuevas Características

#### 1. Sanitización Automática de Nombres
- Elimina caracteres inválidos para nombres de archivo (`/`, `:`, `?`, `*`, etc.)
- Reemplaza espacios por guiones configurable
- Opción de normalizar a minúsculas
- Límite de longitud configurable (200 caracteres por defecto)
- **Resultado**: Títulos como "Async / Await" ahora funcionan correctamente

#### 2. Detección Automática de Video
- Ya no se asume `input/video.mp4`
- Detecta automáticamente el primer archivo de video en `/input`
- Soporta múltiples formatos: `.mp4`, `.webm`, `.mkv`, `.avi`, `.mov`
- Validación: aborta si hay 0 o más de 1 video
- **Resultado**: Mayor flexibilidad en el nombre y formato del archivo de entrada

#### 3. Configuración Centralizada (`config.js`)
Nueva estructura de configuración que permite controlar:
- **Modo de corte**: `copy` (rápido) o `reencode` (seguro)
- **Carpetas**: `inputDir`, `outputDir`, `chaptersFile`
- **Formato de salida**: extensión configurable
- **Prefijo opcional**: para nombres de archivo
- **Parámetros de reencoding**: codec, preset, CRF
- **Reglas de sanitización**: espacios, minúsculas, longitud máxima

#### 4. Modos de Exportación
**Modo Fast (copy)**:
- `ffmpeg -c copy` - sin recodificar
- Procesamiento ultrarrápido
- Conserva calidad original
- Puede fallar con timestamps inexactos

**Modo Safe (reencode)**:
- Recodifica con `libx264 + aac`
- Preset: fast
- CRF: 20 (alta calidad)
- Garantiza compatibilidad total

#### 5. Manejo Inteligente del Último Capítulo
- Detecta duración total del video usando `ffprobe`
- Calcula automáticamente la duración del último capítulo hasta el final
- Ya no pasa `-t null` a ffmpeg
- Muestra duración real del video en logs

#### 6. Sistema de Logs Profesional
**Información mostrada**:
- 📹 Video detectado con nombre
- ⏱️ Duración total (horas, minutos, segundos)
- 📋 Cantidad de capítulos
- ⚙️ Modo de procesamiento
- [n/total] Progreso de cada capítulo
- ✅ Confirmación de completado
- ══════ Resumen final con estadísticas

**Mensajes de error**:
- Claros y accionables
- Indican el problema específico
- Sugieren soluciones cuando es posible

### 🔧 Mejoras Técnicas

#### `scripts/cut.js`
- Migrado a async/await con `promisify`
- Función `detectInputVideo()` para autodetección
- Función `getVideoDuration()` con ffprobe
- Función `buildFFmpegCommand()` para construcción dinámica de comandos
- Manejo de errores mejorado con try/catch
- Contador de errores en resumen final

#### `scripts/helpers.js`
- Nueva función `sanitizeFilename()` para limpieza de títulos
- Nueva función `getOutputFilename()` para generación de nombres
- `parseChapters()` ahora acepta `videoDuration` opcional
- Manejo correcto de último capítulo (duration = null si no hay siguiente)
- Validación mejorada de formatos de tiempo

#### `config.js` (nuevo archivo)
- Configuración modular y documentada
- Todos los parámetros en un solo lugar
- Fácil de extender y mantener
- Valores por defecto sensatos

### 🐛 Bugs Corregidos

1. **Caracteres especiales en nombres**: Títulos con `/`, `:`, `?` ya no rompen el proceso
2. **Último capítulo sin duración**: Se calcula automáticamente hasta el final del video
3. **Video hardcodeado**: Ya no se asume `video.mp4`, se detecta automáticamente
4. **Logs poco claros**: Ahora muestran información completa y profesional

### 📊 Resultados de Prueba

**Ejecución exitosa**:
- 36/36 capítulos procesados sin errores
- Video de entrada: `video.mp4` (4h 42m 34s)
- Modo: copy (rápido)
- Tiempo total: ~2 minutos
- Todos los archivos generados correctamente en `/output`

### ⚙️ Compatibilidad

✅ **Preservada**:
- Formato `chapters.txt` (TIEMPO|TITULO)
- Estructura de carpetas (input/, output/, scripts/)
- Nombres de archivos de salida (01 - titulo.mp4)
- Comando de ejecución (`node scripts/cut.js`)

### 📝 Archivos Modificados

```
✏️  scripts/cut.js       - Reescrito completamente
✏️  scripts/helpers.js   - Funciones nuevas agregadas
🆕 config.js            - Archivo de configuración nuevo
```

### 🚀 Uso

```bash
# Modo rápido (por defecto)
node scripts/cut.js

# Cambiar a modo seguro
# Editar config.js: mode: "reencode"
node scripts/cut.js
```

### 📦 Dependencias

No se agregaron nuevas dependencias npm. El proyecto sigue usando:
- Node.js built-ins: `fs`, `path`, `child_process`, `util`
- Herramientas externas: `ffmpeg`, `ffprobe` (deben estar instaladas)

---

**Autor**: Alberto Hilal/GitHub Copilot  
**Fecha**: 31 de enero de 2026  
**Versión anterior**: 1.0.0 (básica, sin configuración)  
**Versión actual**: 2.0.0 (profesional, configurable, robusta)
