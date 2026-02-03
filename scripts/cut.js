const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseChapters, getOutputFilename, parseSRT, buildChaptersFromSRT, buildChapterRangesFromSRT, sliceSRTByRange, formatSRT } = require('./helpers');
const { argv } = require('process');

const ROOT_DIR = path.join(__dirname, '..'); // Definir ROOT_DIR correctamente
const INPUT_DIR = path.join(ROOT_DIR, config.inputDir); // Definir INPUT_DIR correctamente
const OUTPUT_DIR = path.join(ROOT_DIR, config.outputDir); // Definir OUTPUT_DIR correctamente

const execAsync = promisify(exec);

/**
 * Construye el comando ffmpeg para cortar el video
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
  console.log(`[${index}/${total}] Procesando: ${chapter.title || chapter.name}`);
  console.log(`    Inicio: ${chapter.start}${chapter.duration ? ` | Duración: ${chapter.duration}` : ' | Hasta el final'}`);

  const command = buildFFmpegCommand(inputVideo, chapter.start, chapter.duration, outputFile);

  try {
    await execAsync(command);
    console.log(`✅ Capítulo ${index} completado: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Error al cortar el capítulo ${index}`);
    console.error(`   ${error.message.split('\n')[0]}`);
    throw error;
  }
}

/**
 * Genera un archivo SRT para un capítulo específico
 */
async function generateChapterSRT(chapter, subtitlesFile, outputFile) {
  const { parseSRT, sliceSRTByRange, formatSRT, timeToSeconds } = require('./helpers');

  if (!fs.existsSync(subtitlesFile)) {
    console.warn(`⚠️  No se encontró el archivo de subtítulos: ${subtitlesFile}`);
    return;
  }

  const srtContent = fs.readFileSync(subtitlesFile, 'utf-8');
  const subtitles = parseSRT(srtContent);

  if (!subtitles || subtitles.length === 0) {
    console.warn('⚠️  No se encontraron subtítulos válidos en el archivo proporcionado.');
    return;
  }

  const startSeconds = timeToSeconds(chapter.startTime);
  const endSeconds = timeToSeconds(chapter.endTime);
  const chapterSubs = sliceSRTByRange(subtitles, startSeconds, endSeconds);

  if (chapterSubs.length === 0) {
    console.warn(`⚠️  No se encontraron subtítulos para el capítulo: ${chapter.name}`);
    return;
  }

  const formattedSRT = formatSRT(chapterSubs);
  const srtOutputFile = outputFile.replace(/\.mp4$/, '.srt');

  try {
    fs.writeFileSync(srtOutputFile, formattedSRT, 'utf-8');
    console.log(`📝 Subtítulos generados: ${srtOutputFile}`);
  } catch (error) {
    console.error(`❌ Error al generar subtítulos para el capítulo ${chapter.name}:`, error.message);
  }
}

/**
 * Proceso principal
 */
async function main() {
  console.log('🎬 Iniciando cortador de videos con capítulos desde chapters.txt\n');

  const chaptersFile = path.join(ROOT_DIR, 'chapters.txt');

  if (!fs.existsSync(chaptersFile)) {
    console.error(`❌ Error: No se encontró el archivo chapters.txt en ${chaptersFile}`);
    process.exit(1);
  }

  const chaptersContent = fs.readFileSync(chaptersFile, 'utf-8');
  const chapters = chaptersContent.split('\n').filter(line => line.trim() !== '').map(line => {
    const [order, startTime, endTime, ...nameParts] = line.split('\t');
    return {
      order: parseInt(order, 10),
      startTime,
      endTime,
      name: nameParts.join('_')
    };
  });

  const inputVideo = path.join(INPUT_DIR, 'video.mp4');
  const subtitlesFile = path.join(INPUT_DIR, 'subtitles.srt');

  if (!fs.existsSync(inputVideo)) {
    console.error(`❌ Error: No se encontró el archivo de video en ${inputVideo}`);
    process.exit(1);
  }

  if (!fs.existsSync(subtitlesFile)) {
    console.error(`❌ Error: No se encontró el archivo de subtítulos en ${subtitlesFile}`);
    process.exit(1);
  }

  console.log(`📹 Video detectado: ${path.basename(inputVideo)}`);
  console.log(`📝 Subtítulos detectados: ${path.basename(subtitlesFile)}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Procesando capítulos...\n');

  for (const chapter of chapters) {
    const { order, startTime, endTime, name } = chapter;
    const { timeToSeconds, secondsToTime } = require('./helpers');
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    const durationSeconds = endSeconds - startSeconds;

    if (durationSeconds <= 0) {
      console.error(`⚠️  Capítulo ${order}: El tiempo de fin debe ser mayor que el tiempo de inicio`);
      continue;
    }

    const duration = secondsToTime(durationSeconds);
    const outputFile = path.join(OUTPUT_DIR, `${order}_${name}.mp4`);

    try {
      await cutChapter(inputVideo, { start: startTime, duration }, outputFile, order, chapters.length);
      console.log(`✅ Capítulo ${order} procesado: ${outputFile}`);

      // Generar subtítulos para el capítulo
      await generateChapterSRT(chapter, subtitlesFile, outputFile);
    } catch (error) {
      console.error(`❌ Error al procesar el capítulo ${order}:`, error.message);
    }
  }

  console.log('🎉 Procesamiento completado');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
