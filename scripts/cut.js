const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseChapters, getOutputFilename, parseSRT, buildChaptersFromSRT, buildChapterRangesFromSRT, sliceSRTByRange, formatSRT } = require('./helpers');

const execAsync = promisify(exec);

const ROOT_DIR = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT_DIR, config.inputDir);
const OUTPUT_DIR = path.join(ROOT_DIR, config.outputDir);
const CHAPTERS_FILE = path.join(ROOT_DIR, config.chaptersFile);
const SUBTITLES_FILE = path.join(ROOT_DIR, config.inputDir, config.subtitlesFile);

/**
 * Ajusta las duraciones de los capítulos usando subtítulos .srt
 * Encuentra el último subtítulo antes del siguiente capítulo para mayor precisión
 */
function refineDurationsWithSRT(chapters, subtitles) {
  return chapters.map((chapter, i) => {
    const nextChapter = chapters[i + 1];
    
    if (!nextChapter) {
      // Último capítulo: buscar el último subtítulo
      const lastSubtitle = subtitles[subtitles.length - 1];
      if (lastSubtitle) {
        const duration = Math.ceil(lastSubtitle.endSeconds - chapter.startSeconds);
        return {
          ...chapter,
          duration: require('./helpers').secondsToTime(duration),
          source: 'srt'
        };
      }
      return chapter;
    }

    // Buscar el último subtítulo antes del siguiente capítulo
    const subsInRange = subtitles.filter(
      sub => sub.startSeconds >= chapter.startSeconds && sub.startSeconds < nextChapter.startSeconds
    );

    if (subsInRange.length > 0) {
      const lastSub = subsInRange[subsInRange.length - 1];
      const duration = Math.ceil(lastSub.endSeconds - chapter.startSeconds);
      return {
        ...chapter,
        duration: require('./helpers').secondsToTime(duration),
        source: 'srt'
      };
    }

    return chapter;
  });
}

/**
 * Detecta el primer archivo de video en /input
 */
function detectInputVideo() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Error: La carpeta ${config.inputDir}/ no existe`);
    process.exit(1);
  }

  const files = fs.readdirSync(INPUT_DIR);
  const videos = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return config.videoExtensions.includes(ext);
  });

  if (videos.length === 0) {
    console.error(`❌ Error: No se encontró ningún video en ${config.inputDir}/`);
    console.error(`   Extensiones soportadas: ${config.videoExtensions.join(', ')}`);
    process.exit(1);
  }

  if (videos.length > 1) {
    console.error(`❌ Error: Se encontraron múltiples videos en ${config.inputDir}/:`);
    videos.forEach(v => console.error(`   - ${v}`));
    console.error(`   Por favor, deja solo un archivo de video.`);
    process.exit(1);
  }

  return path.join(INPUT_DIR, videos[0]);
}

/**
 * Obtiene la duración del video en segundos usando ffprobe
 */
async function getVideoDuration(videoPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return Math.floor(parseFloat(stdout.trim()));
  } catch (error) {
    console.warn('⚠️  No se pudo detectar la duración del video');
    return null;
  }
}

/**
 * Construye el comando ffmpeg según el modo configurado
 */
function buildFFmpegCommand(inputVideo, startTime, duration, outputFile) {
  const durationArg = duration ? `-t ${duration}` : '';
  
  if (config.mode === 'copy') {
    return `ffmpeg -i "${inputVideo}" -ss ${startTime} ${durationArg} -c copy "${outputFile}" -y`;
  } else {
    const { videoCodec, audioCodec, preset, crf } = config.reencode;
    return `ffmpeg -i "${inputVideo}" -ss ${startTime} ${durationArg} -c:v ${videoCodec} -preset ${preset} -crf ${crf} -c:a ${audioCodec} "${outputFile}" -y`;
  }
}

/**
 * Corta un capítulo del video
 */
async function cutChapter(inputVideo, chapter, outputFile, index, total) {
  console.log(`[${index}/${total}] ${chapter.title}`);
  console.log(`    Inicio: ${chapter.start}${chapter.duration ? ` | Duración: ${chapter.duration}` : ' | Hasta el final'}`);
  
  const command = buildFFmpegCommand(inputVideo, chapter.start, chapter.duration, outputFile);
  
  try {
    await execAsync(command);
    console.log(`✅ Completado\n`);
  } catch (error) {
    console.error(`❌ Error al cortar este capítulo`);
    console.error(`   ${error.message.split('\n')[0]}\n`);
    throw error;
  }
}

/**
 * Genera archivo SRT para un capítulo específico
 */
async function generateChapterSRT(chapter, subtitles, outputFile, index, total) {
  if (!subtitles || subtitles.length === 0) {
    return; // No hay subtítulos disponibles
  }
  
  // Calcular duración en segundos si no está disponible
  let durationSeconds = chapter.durationSeconds;
  if (!durationSeconds && chapter.duration) {
    const { timeToSeconds } = require('./helpers');
    durationSeconds = timeToSeconds(chapter.duration);
  }
  
  if (!durationSeconds) {
    return; // No se puede calcular el rango del capítulo
  }
  
  const endSeconds = chapter.startSeconds + durationSeconds;
  const chapterSubs = sliceSRTByRange(subtitles, chapter.startSeconds, endSeconds);
  
  if (chapterSubs.length === 0) {
    return; // No hay subtítulos para este capítulo
  }
  
  const srtContent = formatSRT(chapterSubs);
  const srtFile = outputFile.replace(/\.mp4$/, '.srt');
  
  try {
    fs.writeFileSync(srtFile, srtContent, 'utf-8');
    console.log(`📝 Subtítulos: ${path.basename(srtFile)} (${chapterSubs.length} bloques)`);
  } catch (error) {
    console.warn(`⚠️  No se pudo generar SRT para capítulo ${index}`);
  }
}

/**
 * Proceso principal
 */
async function main() {
  console.log('🎬 Iniciando cortador de videos\n');

  // Modo SRT: cortar por cada subtítulo
  if (config.cutMode === 'srt') {
    if (!fs.existsSync(SUBTITLES_FILE)) {
      console.error(`❌ Error: Modo 'srt' activado pero no se encontró ${config.subtitlesFile}`);
      console.error(`   Solución: Coloca el archivo en ${config.inputDir}/ o cambia cutMode a "chapters"`);
      process.exit(1);
    }

    const srtContent = fs.readFileSync(SUBTITLES_FILE, 'utf-8');
    const subtitles = parseSRT(srtContent);
    
    if (subtitles.length === 0) {
      console.error(`❌ Error: ${config.subtitlesFile} no contiene subtítulos válidos`);
      process.exit(1);
    }

    const inputVideo = detectInputVideo();
    console.log(`📹 Video detectado: ${path.basename(inputVideo)}`);
    console.log(`📝 Subtítulos: ${subtitles.length} bloques`);
    console.log(`⚙️  Modo: ${config.mode === 'copy' ? 'rápido (sin recodificar)' : 'seguro (recodificar)'}`);
    console.log(`🎯 Corte: SRT (un video por subtítulo)\n`);

    const chapters = buildChaptersFromSRT(subtitles);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('🚀 Procesando...\n');
    
    let errors = 0;
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const outputFile = path.join(OUTPUT_DIR, getOutputFilename(i + 1, chapter.title));
      
      try {
        await cutChapter(inputVideo, chapter, outputFile, i + 1, chapters.length);
        
        // Generar SRT individual para este clip
        await generateChapterSRT(chapter, subtitles, outputFile, i + 1, chapters.length);
      } catch (error) {
        errors++;
      }
    }

    console.log('═'.repeat(50));
    if (errors === 0) {
      console.log('🎉 Proceso completado exitosamente');
    } else {
      console.log(`⚠️  Completado con ${errors} error(es)`);
    }
    console.log(`📁 Videos en: ${config.outputDir}/`);
    return;
  }

  // Modo CHAPTERS (comportamiento original)
  // Verificar chapters.txt
  if (!fs.existsSync(CHAPTERS_FILE)) {
    console.error(`❌ Error: No se encontró ${config.chaptersFile}`);
    process.exit(1);
  }

  // Detectar video de entrada
  const inputVideo = detectInputVideo();
  console.log(`📹 Video detectado: ${path.basename(inputVideo)}`);

  // Obtener duración del video
  const videoDuration = await getVideoDuration(inputVideo);
  if (videoDuration) {
    const hours = Math.floor(videoDuration / 3600);
    const mins = Math.floor((videoDuration % 3600) / 60);
    const secs = videoDuration % 60;
    console.log(`⏱️  Duración: ${hours}h ${mins}m ${secs}s`);
  }

  // Parsear capítulos
  const chaptersContent = fs.readFileSync(CHAPTERS_FILE, 'utf-8');
  let chapters = parseChapters(chaptersContent, videoDuration);
  
  // Intentar cargar subtítulos para refinar duraciones y generar SRTs
  let usingSRT = false;
  let subtitles = null;
  
  if (fs.existsSync(SUBTITLES_FILE)) {
    try {
      const srtContent = fs.readFileSync(SUBTITLES_FILE, 'utf-8');
      subtitles = parseSRT(srtContent);
      
      if (subtitles.length > 0) {
        chapters = refineDurationsWithSRT(chapters, subtitles);
        usingSRT = true;
        console.log(`📝 Subtítulos: ${subtitles.length} bloques detectados`);
      }
    } catch (error) {
      console.warn(`⚠️  No se pudo procesar ${config.subtitlesFile}, usando chapters.txt`);
    }
  }
  
  console.log(`📋 Capítulos: ${chapters.length}`);
  console.log(`⚙️  Modo: ${config.mode === 'copy' ? 'rápido (sin recodificar)' : 'seguro (recodificar)'}`);
  console.log(`🎯 Corte: chapters.txt`);
  console.log(`🎯 Precisión: ${usingSRT ? 'SRT (alta)' : 'estándar'}\n`);

  // Crear carpeta de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Procesar capítulos
  console.log('🚀 Procesando...\n');
  
  let errors = 0;
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const outputFile = path.join(OUTPUT_DIR, getOutputFilename(i + 1, chapter.title));
    
    try {
      await cutChapter(inputVideo, chapter, outputFile, i + 1, chapters.length);
      
      // Generar SRT si hay subtítulos disponibles
      if (subtitles && subtitles.length > 0) {
        await generateChapterSRT(chapter, subtitles, outputFile, i + 1, chapters.length);
      }
    } catch (error) {
      errors++;
    }
  }

  // Resumen final
  console.log('═'.repeat(50));
  if (errors === 0) {
    console.log('🎉 Proceso completado exitosamente');
  } else {
    console.log(`⚠️  Completado con ${errors} error(es)`);
  }
  console.log(`📁 Videos en: ${config.outputDir}/`);
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
