#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const INPUT_DIR = path.join(__dirname, '../input');

/**
 * Verifica si yt-dlp está instalado
 */
function checkYtDlp() {
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Descarga video y subtítulos desde URL
 */
function downloadVideo(url) {
  console.log('📥 Iniciando descarga...\n');
  console.log(`🔗 URL: ${url}\n`);

  // Crear carpeta input si no existe
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
  }

  // Comando yt-dlp
  const outputTemplate = path.join(INPUT_DIR, '%(title)s.%(ext)s');
  
  const args = [
    '--format', 'bestvideo+bestaudio/best',
    '--merge-output-format', 'mp4',
    '--write-auto-sub',
    '--write-sub',
    '--sub-lang', 'es',
    '--sub-format', 'srt',
    '--convert-subs', 'srt',
    '--output', outputTemplate,
    url
  ];

  console.log('⚙️  Ejecutando yt-dlp...\n');

  try {
    const result = spawnSync('yt-dlp', args, {
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      throw new Error(`yt-dlp exited with code ${result.status}`);
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log('✅ Descarga completada exitosamente');
    console.log(`📁 Archivos en: ${INPUT_DIR}`);
    console.log('\n💡 Siguiente paso:');
    console.log('   node scripts/cut.js');
  } catch (error) {
    console.error('\n❌ Error durante la descarga');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main
 */
function main() {
  const url = process.argv[2];

  if (!url) {
    console.error('❌ Error: No se proporcionó ninguna URL\n');
    console.error('Uso:');
    console.error('   node scripts/download.js <url>\n');
    console.error('Ejemplo:');
    console.error('   node scripts/download.js https://www.youtube.com/watch?v=VIDEO_ID');
    process.exit(1);
  }

  // Verificar yt-dlp
  if (!checkYtDlp()) {
    console.error('❌ Error: yt-dlp no está instalado\n');
    console.error('Instalación:');
    console.error('   Linux/Mac: brew install yt-dlp');
    console.error('   O visita: https://github.com/yt-dlp/yt-dlp#installation');
    process.exit(1);
  }

  downloadVideo(url);
}

main();
