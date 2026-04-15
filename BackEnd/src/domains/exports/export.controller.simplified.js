/**
 * NOVO CONTROLLER DE EXPORTS - SIMPLIFICADO E CONFIÁVEL
 * Usa apenas FFmpeg, sem yt-dlp ou fallbacks complexos
 */

const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const Event = require('../../models/Event');
const Video = require('../../models/Video');
const { success, notFound } = require('../../shared/response.helper');

const FFMPEG_TIMEOUT_MS = 3600000; // 1h para videos longos
const EXPORT_QUEUE_MAX = 10;
const EXPORT_JOBS = new Map();
const EXPORT_QUEUE = [];
let RUNNING_WORKERS = 0;
const MAX_WORKERS = 1;

// ============================================================================
// COMMAND UTILITIES
// ============================================================================

const runFFmpeg = (args, options = {}) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';
    let output = { stderr: '' };

    const onProgress = options.onProgress;
    let stderrBuffer = '';

    ffmpeg.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      stderrBuffer += text;

      // ParseFFmpeg progress lines
      const lines = stderrBuffer.split('\n');
      stderrBuffer = lines.pop() || '';
      
      lines.forEach(line => {
        if (line.includes('time=') && onProgress) {
          onProgress(line);
        }
      });
      output.stderr = stderr;
    });

    const timeoutHandle = setTimeout(() => {
      ffmpeg.kill('SIGKILL');
      reject(new Error(`FFmpeg timeout after ${FFMPEG_TIMEOUT_MS}ms`));
    }, FFMPEG_TIMEOUT_MS);

    ffmpeg.on('error', (err) => {
      clearTimeout(timeoutHandle);
      reject(err);
    });

    ffmpeg.on('close', (code) => {
      clearTimeout(timeoutHandle);
      if (code === 0) {
        resolve(output);
      } else {
        const errorMsg = stderr || `FFmpeg exited with code ${code}`;
        reject(new Error(errorMsg));
      }
    });
  });
};

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

const createJob = (jobId, userId) => {
  const job = {
    jobId,
    userId,
    status: 'queued',
    stage: 'queued',
    progress: 0,
    message: 'Aguardando processamento...',
    createdAt: Date.now(),
  };
  EXPORT_JOBS.set(jobId, job);
  return job;
};

const updateJob = (jobId, updates) => {
  const job = EXPORT_JOBS.get(jobId);
  if (job) {
    Object.assign(job, updates, { updatedAt: Date.now() });
  }
};

const getJob = (jobId) => EXPORT_JOBS.get(jobId);

// ============================================================================
// EXPORT LOGIC
// ============================================================================

const processExportQueue = async () => {
  if (RUNNING_WORKERS >= MAX_WORKERS || EXPORT_QUEUE.length === 0) {
    return;
  }

  RUNNING_WORKERS++;
  const queued = EXPORT_QUEUE.shift();

  try {
    await runExportJob(queued);
  } finally {
    RUNNING_WORKERS--;
    if (EXPORT_QUEUE.length > 0) {
      setImmediate(processExportQueue);
    }
  }
};

const runExportJob = async ({ jobId, userId, video, eventIds, beforeSeconds, afterSeconds, outputFileName }) => {
  const job = getJob(jobId);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'playtrack-export-'));

  try {
    updateJob(jobId, {
      status: 'running',
      stage: 'preparing',
      progress: 5,
      message: 'Validando eventos...',
    });

    // Validar eventos
    const events = await Event.find({
      _id: { $in: eventIds },
      videoId: video._id,
      deletedAt: null,
    });

    if (events.length === 0) {
      throw new Error('Nenhum evento válido encontrado');
    }

    // Ordenar conforme seleção do usuário
    const eventsById = new Map(events.map(e => [String(e._id), e]));
    const orderedEvents = eventIds.map(id => eventsById.get(String(id))).filter(Boolean);

    const ranges = orderedEvents.map(event => ({
      start: Math.max(0, event.videoTimestampSeconds - Number(beforeSeconds)),
      end: event.videoTimestampSeconds + Number(afterSeconds),
    }));

    const totalDuration = ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
    if (totalDuration > 30 * 60) {
      throw new Error('Limite: máximo 30 minutos por exportação');
    }

    // NOVA ABORDAGEM: Use FFmpeg direto na URL do YouTube
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.source.videoId}`;

    updateJob(jobId, {
      stage: 'exporting',
      progress: 10,
      message: 'Exportando clipes...',
    });

    // Para 1 clipe: usar -ss/-to (nativo, rápido)
    if (ranges.length === 1) {
      const range = ranges[0];
      const outputPath = path.join(tempDir, 'output.mp4');

      const args = [
        '-y',
        '-ss', String(range.start),
        '-to', String(range.end),
        '-i', youtubeUrl,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
        outputPath,
      ];

      await runFFmpeg(args, {
        onProgress: (line) => {
          if (line.includes('time=')) {
            updateJob(jobId, {
              progress: Math.min(85, 10 + Math.random() * 75),
              message: 'Extraindo clipe...',
            });
          }
        },
      });

      // Retornar arquivo
      const fileBuffer = await fs.readFile(outputPath);
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Concluído!',
        fileSize: fileBuffer.length,
      });
      
      return fileBuffer;
    }

    // Para múltiplos clipes: concatenar
    const clipFiles = [];

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

      await runFFmpeg(args, {
        onProgress: () => {
          const clipProgress = (i / ranges.length) * 70;
          updateJob(jobId, {
            progress: 10 + clipProgress,
            message: `Extraindo clipe ${i + 1}/${ranges.length}...`,
          });
        },
      });

      clipFiles.push(clipPath);
    }

    // Concatenar com FFmpeg
    const concatFile = path.join(tempDir, 'concat.txt');
    const concatContent = clipFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(concatFile, concatContent);

    const outputPath = path.join(tempDir, 'output.mp4');
    const concatArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFile,
      '-c', 'copy',
      outputPath,
    ];

    await runFFmpeg(concatArgs, {
      onProgress: () => {
        updateJob(jobId, {
          progress: 85,
          message: 'Concatenando clipes...',
        });
      },
    });

    // Retornar arquivo
    const fileBuffer = await fs.readFile(outputPath);
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Concluído!',
      fileSize: fileBuffer.length,
    });

    return fileBuffer;
  } catch (err) {
    updateJob(jobId, {
      status: 'failed',
      progress: job.progress,
      message: err.message,
      error: err.message,
    });
    throw err;
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

const createExport = async (req, res) => {
  try {
    const { videoId, eventIds, beforeSeconds = 5, afterSeconds = 5 } = req.body;
    const userId = req.user.id;

    const video = await Video.findById(videoId);
    if (!video) return notFound(res, 'Vídeo não encontrado');

    if (EXPORT_QUEUE.length >= EXPORT_QUEUE_MAX) {
      return res.status(429).json({
        error: 'Fila de exportação cheia. Tente novamente em breve.',
      });
    }

    const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    createJob(jobId, userId);

    EXPORT_QUEUE.push({
      jobId,
      userId,
      video,
      eventIds,
      beforeSeconds,
      afterSeconds,
      outputFileName: `export-${Date.now()}.mp4`,
    });

    setImmediate(processExportQueue);

    return success(res, { jobId, status: 'queued' });
  } catch (err) {
    console.error('Export create error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getExportStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job) {
      return notFound(res, 'Job não encontrado');
    }

    return success(res, job);
  } catch (err) {
    console.error('Export status error:', err);
    res.status(500).json({ error: err.message });
  }
};

const downloadExport = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJob(jobId);

    if (!job || job.status !== 'completed') {
      return notFound(res, 'Exportação não disponível');
    }

    // Nota: Em produção real, você armazenaria o arquivo e serviria daqui
    // Por agora, retornar status apenas
    return success(res, {
      message: 'Arquivo pronto para download',
      fileSize: job.fileSize,
    });
  } catch (err) {
    console.error('Export download error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createExport,
  getExportStatus,
  downloadExport,
  // Internals (for testing)
  runExportJob,
  processExportQueue,
  getJob,
};
