module.exports = {
  // Modo de corte: 
  // - "chapters": corta por chapters.txt (refinamiento opcional con SRT)
  // - "srt": un video por cada subtítulo
  // - "chapters+srt": un video por capítulo, duración precisa usando subtítulos agrupados
  cutMode: "chapters",
  
  // Modo de exportación: "copy" (rápido, sin recodificar) o "reencode" (seguro, recodifica)
  mode: "copy",
  
  // Carpetas
  inputDir: "input",
  outputDir: "output",
  chaptersFile: "chapters.txt",
  subtitlesFile: "subtitles.srt", // Opcional: para mayor precisión en duraciones
  
  // Extensiones de video soportadas
  videoExtensions: [".mp4", ".webm", ".mkv", ".avi", ".mov"],
  
  // Formato de salida
  outputFormat: "mp4",
  
  // Prefijo opcional para nombres de archivo (ej: "cap" -> "cap_01 - titulo.mp4")
  outputPrefix: "",
  
  // Configuración de reencoding (solo si mode = "reencode")
  reencode: {
    videoCodec: "libx264",
    audioCodec: "aac",
    preset: "fast",
    crf: 20
  },
  
  // Sanitización de nombres
  sanitize: {
    replaceSpaces: "-", // "-" o "_" o " "
    lowercase: false,   // true para convertir a minúsculas
    maxLength: 200      // longitud máxima del nombre
  }
};
