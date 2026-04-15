// SOLUÇÃO DEFINITIVA SIMPLIFICADA PARA EXPORT DE VÍDEO
// Este é o coração que substitui toda a complexidade anterior

const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Solução definitiva: usar FFmpeg direto na URL
 * Sem yt-dlp, sem fallbacks complicados, sem re-encoding
 */

const FFMPEG_TIMEOUT_MS = 3600000; // 1 hora

const checkFFmpeg = async () => {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', ['-version']);
    process.on('error', () => reject(new Error('FFmpeg not found')));
    process.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg error')));
  });
};

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    let stderr = '';
    let stdout = '';

    const onStderrLine = options.onStderrLine;
    let stderrBuffer = '';

    process.stderr.on('data', (chunk) => {
      const value = chunk.toString();
      stderr += value;
      stderrBuffer += value;
      
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop() || '';
      
      lines.forEach(line => {
        if (line.trim() && onStderrLine) onStderrLine(line);
      });
    });

    process.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    const timeoutHandle = setTimeout(() => {
      process.kill('SIGKILL');
      reject(new Error(`${command} timeout after ${FFMPEG_TIMEOUT_MS}ms`));
    }, FFMPEG_TIMEOUT_MS);

    process.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(err);
    });

    process.on('close', (code) => {
      clearTimeout(timeoutHandle);
      if (code !== 0) {
        reject(new Error(stderr || `${command} exited with code ${code}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// EXPORT SIMPLES: use FFmpeg diretamente
const exportVideoSimple = async (youtubeUrl, ranges, outputPath, onProgress) => {
  // Para 1 clipe: usar -ss/-to (nativo FFmpeg, muito rápido)
  if (ranges.length === 1) {
    const range = ranges[0];
    const args = [
      '-y',
      '-ss', String(range.start),
      '-to', String(range.end),
      '-i', youtubeUrl,
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      outputPath,
    ];

    await runCommand('ffmpeg', args, {
      onStderrLine: (line) => {
        const timeMatch = line.match(/time=\s*([0-9:.]+)/);
        if (timeMatch && onProgress) {
          onProgress(line);
        }
      },
    });
    return;
  }

  // Para múltiplos clipes: criar arquivo concat
  const tempDir = path.dirname(outputPath);
  const clipFiles = [];
  
  // Extrair cada clipe
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const clipPath = path.join(tempDir, `clip${i}.mp4`);
    
    const args = [
      '-y',
      '-ss', String(range.start),
      '-to', String(range.end),
      '-i', youtubeUrl,
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      clipPath,
    ];

    await runCommand('ffmpeg', args, {
      onStderrLine: (line) => {
        if (line.match(/time=/) && onProgress) {
          onProgress(`Clipe ${i + 1}/${ranges.length}: ${line}`);
        }
      },
    });
    
    clipFiles.push(clipPath);
  }

  // Concatenar clipes
  const concatFile = path.join(tempDir, 'concat.txt');
  const concatContent = clipFiles.map(f => `file '${f}'`).join('\n');
  await fs.writeFile(concatFile, concatContent);

  const args = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    outputPath,
  ];

  await runCommand('ffmpeg', args, {
    onStderrLine: (line) => {
      if (line.match(/time=/) && onProgress) {
        onProgress(`Concatenando: ${line}`);
      }
    },
  });

  // Limpar temporários
  for (const file of [concatFile, ...clipFiles]) {
    try {
      await fs.unlink(file);
    } catch {}
  }
};

module.exports = {
  checkFFmpeg,
  runCommand,
  exportVideoSimple,
};
