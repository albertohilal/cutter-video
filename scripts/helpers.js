const config = require('../config');

/**
 * Convierte un timestamp MM:SS o HH:MM:SS a segundos
 */
function timeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(Number);

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  throw new Error(`Formato de tiempo inválido: ${timeStr}`);
}

/**
 * Convierte segundos a HH:MM:SS
 */
function secondsToTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Sanitiza títulos para nombres de archivo
 */
function sanitizeFilename(title) {
  let name = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // caracteres inválidos
    .replace(/\s+/g, ' ')
    .trim();

  if (config.sanitize.lowercase) {
    name = name.toLowerCase();
  }

  if (config.sanitize.replaceSpaces !== ' ') {
    name = name.replace(/ /g, config.sanitize.replaceSpaces);
  }

  if (name.length > config.sanitize.maxLength) {
    name = name.slice(0, config.sanitize.maxLength);
  }

  return name || 'untitled';
}

/**
 * Genera el nombre final del archivo
 */
function getOutputFilename(index, title) {
  const num = String(index).padStart(2, '0');
  const safeTitle = sanitizeFilename(title);
  const prefix = config.outputPrefix ? `${config.outputPrefix}_` : '';

  return `${prefix}${num} - ${safeTitle}.${config.outputFormat}`;
}

/**
 * Parsea chapters.txt
 */
function parseChapters(content, videoDuration = null) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const raw = lines.map((line, i) => {
    const [time, title] = line.split('|').map(s => s.trim());
    const startSeconds = timeToSeconds(time);

    return {
      title: title || `Capítulo ${i + 1}`,
      start: time,
      startSeconds
    };
  });

  return raw.map((chapter, i) => {
    const next = raw[i + 1];
    let duration = null;

    if (next) {
      duration = secondsToTime(next.startSeconds - chapter.startSeconds);
    } else if (videoDuration) {
      duration = secondsToTime(videoDuration - chapter.startSeconds);
    }

    return {
      ...chapter,
      duration
    };
  });
}

function formatTime(timeStr) {
  return timeStr.split(':').length === 2 ? `00:${timeStr}` : timeStr;
}

/**
 * Parsea un archivo .srt y retorna los subtítulos como array
 * Formato: { startSeconds, endSeconds, text }
 */
function parseSRT(content) {
  const blocks = content.trim().split(/\n\s*\n/);
  const subtitles = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    // Línea de tiempo: 00:00:00,000 --> 00:00:05,000
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (!timeMatch) continue;

    const startSeconds = 
      parseInt(timeMatch[1]) * 3600 + 
      parseInt(timeMatch[2]) * 60 + 
      parseInt(timeMatch[3]) + 
      parseInt(timeMatch[4]) / 1000;

    const endSeconds = 
      parseInt(timeMatch[5]) * 3600 + 
      parseInt(timeMatch[6]) * 60 + 
      parseInt(timeMatch[7]) + 
      parseInt(timeMatch[8]) / 1000;

    const text = lines.slice(2).join(' ');

    subtitles.push({ startSeconds, endSeconds, text });
  }

  return subtitles;
}

/**
 * Convierte subtítulos .srt a estructura de capítulos
 * Cada subtítulo se convierte en un "capítulo" individual
 */
function buildChaptersFromSRT(subtitles) {
  return subtitles.map((sub, i) => {
    const duration = sub.endSeconds - sub.startSeconds;
    
    return {
      title: sub.text,
      start: secondsToTime(sub.startSeconds),
      startSeconds: sub.startSeconds,
      duration: secondsToTime(duration),
      durationSeconds: duration,
      source: 'srt-block'
    };
  });
}

/**
 * Construye capítulos con duraciones precisas basadas en subtítulos agrupados
 * Agrupa subtítulos por capítulo y calcula el final usando el último subtítulo del rango
 */
function buildChapterRangesFromSRT(chapters, subtitles, videoDuration) {
  return chapters.map((chapter, i) => {
    const nextChapter = chapters[i + 1];
    const nextStartSeconds = nextChapter ? nextChapter.startSeconds : Infinity;
    
    // Filtrar subtítulos que pertenecen a este capítulo
    const subsInRange = subtitles.filter(
      sub => sub.startSeconds >= chapter.startSeconds && sub.startSeconds < nextStartSeconds
    );
    
    // Si hay subtítulos en el rango, usar el último para calcular el final
    if (subsInRange.length > 0) {
      const lastSub = subsInRange[subsInRange.length - 1];
      const durationSeconds = lastSub.endSeconds - chapter.startSeconds;
      
      return {
        ...chapter,
        duration: secondsToTime(durationSeconds),
        durationSeconds,
        source: 'chapters+srt',
        subtitlesCount: subsInRange.length
      };
    }
    
    // Fallback: si no hay subtítulos en el rango, mantener duración original
    return {
      ...chapter,
      source: 'chapters-fallback',
      subtitlesCount: 0
    };
  });
}

module.exports = {
  timeToSeconds,
  secondsToTime,
  parseChapters,
  formatTime,
  sanitizeFilename,
  getOutputFilename,
  parseSRT,
  buildChaptersFromSRT,
  buildChapterRangesFromSRT
};
