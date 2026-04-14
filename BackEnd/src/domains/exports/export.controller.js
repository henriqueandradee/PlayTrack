const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const Event = require('../../models/Event');
const Video = require('../../models/Video');
const { notFound, forbidden, success } = require('../../shared/response.helper');

const BINARY_CANDIDATES = {
  'yt-dlp': [
    process.env.YTDLP_PATH,
    process.env.YT_DLP_PATH,
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    'yt-dlp',
  ],
  ffmpeg: [
    process.env.FFMPEG_PATH,
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    'ffmpeg',
  ],
};

const EXPORT_JOB_RETENTION_MS = 30 * 60 * 1000;
const YT_DLP_TIMEOUT_MS = parseInt(process.env.EXPORT_YTDLP_TIMEOUT_MS || '600000', 10);
const FFMPEG_TIMEOUT_MS = parseInt(process.env.EXPORT_FFMPEG_TIMEOUT_MS || '900000', 10);
const EXPORT_MAX_CONCURRENT_JOBS = Math.max(1, parseInt(process.env.EXPORT_MAX_CONCURRENT_JOBS || '1', 10));
const exportJobs = new Map();
const exportQueue = [];
let runningExportWorkers = 0;

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    let stderr = '';
    let stdout = '';
    let timeoutHandle = null;

    const onStdoutLine = typeof options.onStdoutLine === 'function' ? options.onStdoutLine : null;
    const onStderrLine = typeof options.onStderrLine === 'function' ? options.onStderrLine : null;
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const flushLines = (input, bufferRef, callback) => {
      if (!callback) return bufferRef;
      let buffer = bufferRef + input;
      let lineBreakIndex = buffer.indexOf('\n');
      while (lineBreakIndex !== -1) {
        const line = buffer.slice(0, lineBreakIndex).trim();
        if (line) callback(line);
        buffer = buffer.slice(lineBreakIndex + 1);
        lineBreakIndex = buffer.indexOf('\n');
      }
      return buffer;
    };

    if (options.timeoutMs && options.timeoutMs > 0) {
      timeoutHandle = setTimeout(() => {
        process.kill('SIGKILL');
        const timeoutError = new Error(`${command} timeout after ${options.timeoutMs}ms`);
        timeoutError.code = 'PROCESS_TIMEOUT';
        reject(timeoutError);
      }, options.timeoutMs);
    }

    process.stderr.on('data', (chunk) => {
      const value = chunk.toString();
      stderr += value;
      stderrBuffer = flushLines(value, stderrBuffer, onStderrLine);
    });

    process.stdout.on('data', (chunk) => {
      const value = chunk.toString();
      stdout += value;
      stdoutBuffer = flushLines(value, stdoutBuffer, onStdoutLine);
    });

    process.on('error', (error) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      reject(error);
    });

    process.on('close', (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (onStdoutLine && stdoutBuffer.trim()) onStdoutLine(stdoutBuffer.trim());
      if (onStderrLine && stderrBuffer.trim()) onStderrLine(stderrBuffer.trim());

      if (code !== 0) {
        reject(new Error(stderr || stdout || `${command} failed with code ${code}`));
        return;
      }
      resolve();
    });
  });
};

const checkCommandAvailable = async (command) => {
  const candidates = (BINARY_CANDIDATES[command] || [command])
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  const versionArgs = command === 'ffmpeg' ? ['-version'] : ['--version'];

  for (const candidate of candidates) {
    if (candidate.includes('/') && !fsSync.existsSync(candidate)) {
      continue;
    }

    try {
      await runCommand(candidate, versionArgs);
      return candidate;
    } catch {
      // keep trying the next candidate
    }
  }

  throw new Error(`Missing binary for ${command}`);
};

const toTimestamp = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const sanitizeFileName = (value) => {
  const base = String(value || 'playtrack-highlights')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, '')
    .replace(/\s+/g, '-');

  const normalized = base || 'playtrack-highlights';
  return normalized.endsWith('.mp4') ? normalized : `${normalized}.mp4`;
};

const mergeRanges = (ranges) => {
  const sorted = ranges.slice().sort((a, b) => a.start - b.start);
  const merged = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
    } else {
      last.end = Math.max(last.end, range.end);
    }
  }

  return merged;
};

const toSecondsFromTimeString = (value) => {
  const match = String(value).match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
};

const buildSinglePassFilter = (ranges, includeAudio = true) => {
  const videoParts = [];
  const audioParts = [];
  const concatInputs = [];

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    videoParts.push(`[0:v]trim=start=${range.start}:end=${range.end},setpts=PTS-STARTPTS[v${index}]`);
    if (includeAudio) {
      audioParts.push(`[0:a]atrim=start=${range.start}:end=${range.end},asetpts=PTS-STARTPTS[a${index}]`);
      concatInputs.push(`[v${index}][a${index}]`);
    } else {
      concatInputs.push(`[v${index}]`);
    }
  }

  const concatLine = includeAudio
    ? `${concatInputs.join('')}concat=n=${ranges.length}:v=1:a=1[vout][aout]`
    : `${concatInputs.join('')}concat=n=${ranges.length}:v=1:a=0[vout]`;
  const filterSegments = [...videoParts, ...audioParts, concatLine];
  return filterSegments.join(';');
};

const updateJob = (jobId, partial) => {
  const current = exportJobs.get(jobId);
  if (!current) return;
  exportJobs.set(jobId, {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  });
};

const refreshQueuePositions = () => {
  exportQueue.forEach((queued, index) => {
    updateJob(queued.jobId, {
      status: 'queued',
      stage: 'queued',
      queuePosition: index + 1,
      message: `Na fila para exportacao (posicao ${index + 1}).`,
    });
  });
};

const cleanupJobFiles = async (job) => {
  if (!job?.tempDir) return;
  try {
    await fs.rm(job.tempDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
};

const scheduleJobCleanup = (jobId) => {
  setTimeout(async () => {
    const job = exportJobs.get(jobId);
    if (!job) return;
    await cleanupJobFiles(job);
    exportJobs.delete(jobId);
  }, EXPORT_JOB_RETENTION_MS);
};

const processExportQueue = () => {
  while (runningExportWorkers < EXPORT_MAX_CONCURRENT_JOBS && exportQueue.length > 0) {
    const queued = exportQueue.shift();
    if (!queued) return;

    runningExportWorkers += 1;
    refreshQueuePositions();

    updateJob(queued.jobId, {
      status: 'running',
      stage: 'running',
      queuePosition: null,
      message: 'Exportacao iniciada no worker.',
    });

    runExportJob(queued.payload)
      .catch(() => {
        // runExportJob already persists error state in job.
      })
      .finally(() => {
        runningExportWorkers = Math.max(0, runningExportWorkers - 1);
        processExportQueue();
      });
  }
};

const enqueueExportJob = (payload) => {
  exportQueue.push({ jobId: payload.jobId, payload });
  refreshQueuePositions();
  processExportQueue();
};

const runExportJob = async ({ jobId, userId, video, eventIds, beforeSeconds, afterSeconds, outputFileName }) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'playtrack-export-'));
  const inputPath = path.join(tempDir, 'source.mp4');
  const outputPath = path.join(tempDir, 'output.mp4');

  updateJob(jobId, {
    status: 'running',
    stage: 'preparing',
    progress: 5,
    message: 'Validando dados da exportacao...',
    tempDir,
    outputPath,
  });

  try {
    const events = await Event.find({
      _id: { $in: eventIds },
      videoId: video._id,
      deletedAt: null,
    });

    if (events.length === 0) {
      throw Object.assign(new Error('Nenhum timestamp valido encontrado para exportacao.'), { code: 'NO_EVENTS_SELECTED' });
    }

    const eventsById = new Map(events.map((event) => [String(event._id), event]));
    const orderedEvents = eventIds
      .map((id) => eventsById.get(String(id)))
      .filter(Boolean);

    if (orderedEvents.length === 0) {
      throw Object.assign(new Error('Nenhum timestamp valido encontrado para exportacao.'), { code: 'NO_EVENTS_SELECTED' });
    }

    // Preserve user-selected clip order from eventIds.
    const ranges = orderedEvents.map((event) => ({
      start: Math.max(0, event.videoTimestampSeconds - Number(beforeSeconds)),
      end: event.videoTimestampSeconds + Number(afterSeconds),
    }));

    const totalDurationSeconds = ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
    if (totalDurationSeconds > 60 * 30) {
      throw Object.assign(new Error('Limite de exportacao: 30 minutos de trechos por video.'), { code: 'EXPORT_DURATION_LIMIT' });
    }

    let ytDlpBinary;
    let ffmpegBinary;
    try {
      ytDlpBinary = await checkCommandAvailable('yt-dlp');
      ffmpegBinary = await checkCommandAvailable('ffmpeg');
    } catch {
      throw Object.assign(new Error('Servidor sem dependencias de video. Instale/configure yt-dlp e ffmpeg (ou YTDLP_PATH e FFMPEG_PATH).'), {
        code: 'VIDEO_TOOLING_MISSING',
      });
    }

    updateJob(jobId, {
      stage: 'downloading',
      progress: 10,
      message: 'Baixando video do YouTube...',
      totalDurationSeconds,
    });

    const youtubeUrl = `https://www.youtube.com/watch?v=${video.source.videoId}`;
    await runCommand(
      ytDlpBinary,
      [
        '--newline',
        '-f',
        'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
        '--merge-output-format',
        'mp4',
        '-o',
        inputPath,
        // Argumentos para lidar com rate limiting e autenticação do YouTube
        '--socket-timeout',
        '30',
        '--sleep-interval',
        '5',
        '--sleep-requests',
        '2',
        '--retries',
        '5',
        '--retry-sleep',
        '10',
        '--user-agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '--extractor-args',
        'youtube:js_runtimes=deno',
        youtubeUrl,
      ],
      {
        timeoutMs: YT_DLP_TIMEOUT_MS,
        onStdoutLine: (line) => {
          const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
          if (!percentMatch) return;
          const percent = Number(percentMatch[1]);
          if (Number.isNaN(percent)) return;
          const progress = Math.min(45, Math.max(10, 10 + (percent * 0.35)));
          updateJob(jobId, {
            stage: 'downloading',
            progress,
            message: `Baixando video do YouTube (${Math.round(percent)}%)...`,
          });
        },
      },
    );

    updateJob(jobId, {
      stage: 'processing',
      progress: 50,
      message: 'Gerando video em etapa unica...',
    });

    const runFfmpegSinglePass = async (includeAudio) => {
      const filterComplex = buildSinglePassFilter(ranges, includeAudio);
      const commandArgs = [
        '-y',
        '-i',
        inputPath,
        '-filter_complex',
        filterComplex,
        '-map',
        '[vout]',
      ];

      if (includeAudio) {
        commandArgs.push('-map', '[aout]');
      }

      commandArgs.push(
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
      );

      if (includeAudio) {
        commandArgs.push('-c:a', 'aac');
      }

      commandArgs.push('-movflags', '+faststart', outputPath);

      await runCommand(ffmpegBinary, commandArgs, {
        timeoutMs: FFMPEG_TIMEOUT_MS,
        onStderrLine: (line) => {
          const timeMatch = line.match(/time=\s*([0-9:.]+)/);
          if (!timeMatch || !totalDurationSeconds) return;
          const seconds = toSecondsFromTimeString(timeMatch[1]);
          const ratio = Math.min(1, Math.max(0, seconds / totalDurationSeconds));
          const progress = Math.min(95, 45 + (ratio * 50));
          updateJob(jobId, {
            stage: 'processing',
            progress,
            message: `Processando video (${Math.round(ratio * 100)}%)...`,
          });
        },
      });
    };

    try {
      await runFfmpegSinglePass(true);
    } catch (ffmpegError) {
      const message = String(ffmpegError?.message || '').toLowerCase();
      const missingAudio = message.includes('matches no streams') || message.includes('stream specifier') || message.includes('0:a');
      if (!missingAudio) {
        throw ffmpegError;
      }

      updateJob(jobId, {
        stage: 'processing',
        progress: 55,
        message: 'Video sem audio detectado, tentando exportacao sem faixa de audio...',
      });
      await runFfmpegSinglePass(false);
    }

    const downloadName = sanitizeFileName(outputFileName || `${video.title}-highlights`);
    updateJob(jobId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      message: 'Exportacao concluida.',
      downloadFileName: downloadName,
    });
    scheduleJobCleanup(jobId);
  } catch (error) {
    const isTimeout = error?.code === 'PROCESS_TIMEOUT';
    updateJob(jobId, {
      status: 'failed',
      stage: 'failed',
      progress: 100,
      error: isTimeout
        ? 'Tempo limite excedido durante a exportacao. Tente menos timestamps ou trechos menores.'
        : (error?.message || 'Falha ao exportar video.'),
      message: isTimeout
        ? 'Tempo limite excedido durante a exportacao.'
        : 'Falha ao exportar video.',
    });
    await cleanupJobFiles(exportJobs.get(jobId));
    scheduleJobCleanup(jobId);
  }
};

/**
 * GET /export/pdf/:videoId
 * Pro-only. Generates a PDF report for the analyzed video.
 * Full implementation in Phase 4 (requires puppeteer).
 */
exports.exportVideoPDF = async (req, res, next) => {
  try {
    // planGuard('proOnly') runs before this in the route
    // Full implementation: Phase 4
    return res.status(501).json({
      success: false,
      message: 'PDF export coming soon (Phase 4)',
      code: 'NOT_IMPLEMENTED',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /export/video/:videoId
 * Start asynchronous MP4 highlights generation job.
 */
exports.exportVideoHighlights = async (req, res, next) => {
  try {
    const { eventIds, beforeSeconds, afterSeconds, outputFileName } = req.body;
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    if (video.source.type !== 'youtube' || !video.source.videoId) {
      return res.status(422).json({
        success: false,
        message: 'Este recurso so suporta partidas com origem YouTube.',
        code: 'YOUTUBE_SOURCE_REQUIRED',
      });
    }
    const jobId = crypto.randomUUID();
    exportJobs.set(jobId, {
      id: jobId,
      userId: req.user._id.toString(),
      videoId: video._id.toString(),
      status: 'queued',
      stage: 'queued',
      progress: 0,
      message: 'Exportacao enfileirada.',
      error: null,
      queuePosition: null,
      tempDir: null,
      outputPath: null,
      downloadFileName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    enqueueExportJob({
      jobId,
      userId: req.user._id.toString(),
      video,
      eventIds,
      beforeSeconds,
      afterSeconds,
      outputFileName,
    });

    return res.status(202).json({
      success: true,
      data: {
        jobId,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /export/video/jobs/:jobId
 * Read current export job status and progress.
 */
exports.getVideoExportJobStatus = async (req, res, next) => {
  try {
    const job = exportJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job de exportacao nao encontrado.',
        code: 'EXPORT_JOB_NOT_FOUND',
      });
    }

    if (job.userId !== req.user._id.toString()) {
      return forbidden(res);
    }

    return success(res, {
      id: job.id,
      status: job.status,
      stage: job.stage,
      progress: Math.round(job.progress || 0),
      queuePosition: job.queuePosition,
      message: job.message,
      error: job.error,
      downloadReady: job.status === 'completed',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /export/video/jobs/:jobId/download
 * Download generated file for completed export job.
 */
exports.downloadVideoExportJob = async (req, res, next) => {
  try {
    const job = exportJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job de exportacao nao encontrado.',
        code: 'EXPORT_JOB_NOT_FOUND',
      });
    }

    if (job.userId !== req.user._id.toString()) {
      return forbidden(res);
    }

    if (job.status !== 'completed' || !job.outputPath || !job.downloadFileName) {
      return res.status(409).json({
        success: false,
        message: 'Arquivo ainda nao esta pronto para download.',
        code: 'EXPORT_JOB_NOT_READY',
      });
    }

    if (!fsSync.existsSync(job.outputPath)) {
      return res.status(410).json({
        success: false,
        message: 'Arquivo de exportacao expirou.',
        code: 'EXPORT_FILE_EXPIRED',
      });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${job.downloadFileName}"`);

    const stream = fsSync.createReadStream(job.outputPath);
    const cleanupAfterDownload = async () => {
      await cleanupJobFiles(job);
      exportJobs.delete(job.id);
    };

    stream.on('error', next);
    res.on('finish', () => {
      cleanupAfterDownload().catch(() => {});
    });
    res.on('close', () => {
      cleanupAfterDownload().catch(() => {});
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};
