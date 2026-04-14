const Video = require('../../models/Video');
const User = require('../../models/User');
const VideoStats = require('../../models/VideoStats');
const Event = require('../../models/Event');
const { success, created, notFound, forbidden } = require('../../shared/response.helper');

// --- Helpers ---

/**
 * Extract YouTube video ID from various URL formats.
 * Supports:
 *  - youtu.be/VIDEO_ID
 *  - youtu.be/VIDEO_ID?si=...
 *  - youtube.com/watch?v=VIDEO_ID
 *  - youtube.com/watch?v=VIDEO_ID&...
 *  - youtube.com/embed/VIDEO_ID
 */
const extractYouTubeId = (url) => {
  const patterns = [
    // Standard URL: youtube.com/watch?v=VIDEO_ID (with or without additional params)
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short share URL: youtu.be/VIDEO_ID (with or without ?si= or other params)
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Extract Google Drive file ID from share URL.
 * Supports: drive.google.com/file/d/FILE_ID/...
 */
const extractDriveId = (url) => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

/**
 * Build embed URL and thumbnail based on source type.
 */
const buildSourceMeta = (type, rawUrl) => {
  if (type === 'youtube') {
    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) throw Object.assign(new Error('Invalid YouTube URL'), { statusCode: 422 });
    return {
      videoId,
      url: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  if (type === 'google_drive') {
    const fileId = extractDriveId(rawUrl);
    if (!fileId) throw Object.assign(new Error('Invalid Google Drive URL'), { statusCode: 422 });
    return {
      videoId: fileId,
      url: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnailUrl: null,
    };
  }

  if (type === 'url') {
    return { videoId: null, url: rawUrl, thumbnailUrl: null };
  }

  // type === 'live' (análise presencial sem vídeo)
  return { videoId: null, url: null, thumbnailUrl: null };
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * POST /videos
 */
exports.createVideo = async (req, res, next) => {
  try {
    const { title, description, sourceType, sourceUrl, context, tags } = req.body;
    const analysisMode = context?.analysisMode || (sourceType === 'youtube' ? 'YouTube' : 'presencial');
    const gameType = context?.gameType;
    const scope = context?.scope;
    const analysisType = context?.analysisType;
    const athletes = Array.isArray(context?.athletes)
      ? context.athletes
          .map((athlete) => ({
            id: String(athlete?.id || '').trim(),
            name: String(athlete?.name || '').trim(),
          }))
          .filter((athlete) => athlete.id || athlete.name)
      : [];

    // 'live' ou sem sourceType = análise presencial (sem vídeo)
    const resolvedType = sourceType || 'live';
    const isLive = resolvedType === 'live';

    // Valida URL apenas quando não for análise presencial
    if (!isLive && !sourceUrl) {
      return res.status(422).json({
        success: false,
        message: 'sourceUrl é obrigatório para fontes de vídeo.',
        code: 'URL_REQUIRED',
      });
    }

    if (!analysisType || !scope || !gameType || !analysisMode) {
      return res.status(422).json({
        success: false,
        message: 'Campos obrigatórios da partida não foram informados.',
        code: 'MATCH_FIELDS_REQUIRED',
      });
    }

    if (scope === 'multi atleta' && athletes.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Adicione pelo menos 1 atleta para análise multi atleta.',
        code: 'ATHLETES_REQUIRED',
      });
    }

    const sourceMeta = buildSourceMeta(resolvedType, sourceUrl);

    const video = await Video.create({
      userId: req.user._id,
      title,
      description,
      source: {
        type: resolvedType,
        ...sourceMeta,
      },
      context: {
        sport: context?.sport || 'basketball',
        analysisType,
        scope,
        gameType,
        analysisMode,
        eventType: gameType === 'jogo' ? 'game' : 'study',
        athletes,
        opponent: context?.opponent,
        location: context?.location,
      },
      tags,
    });

    // Increment usage counter (keeps freemium guard accurate)
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'usage.videoCount': 1 } }
    );

    return created(res, video);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /videos
 */
exports.getVideos = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user._id, deletedAt: null };
    if (status) filter.analysisStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Video.countDocuments(filter),
    ]);

    return success(res, videos, 200, {
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /videos/:videoId
 */
exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    // Fetch events (non-deleted, ordered by timestamp for player sync)
    const events = await Event.find({
      videoId: video._id,
      deletedAt: null,
    }).sort({ videoTimestampSeconds: 1 });

    return success(res, { video, events });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /videos/:videoId
 */
exports.updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    const allowedFields = ['title', 'description', 'context', 'tags', 'analysisStatus'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) video[field] = req.body[field];
    });

    await video.save();
    return success(res, video);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /videos/:videoId - Hard delete
 * Remove video and all related records to free database space.
 */
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({ _id: req.params.videoId, deletedAt: null });
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    await Promise.all([
      Video.deleteOne({ _id: video._id }),
      Event.deleteMany({ videoId: video._id }),
      VideoStats.deleteMany({ videoId: video._id }),
    ]);

    // Decrement usage counter
    await User.updateOne(
      { _id: req.user._id },
      [
        {
          $set: {
            'usage.videoCount': {
              $cond: [
                { $gt: ['$usage.videoCount', 0] },
                { $subtract: ['$usage.videoCount', 1] },
                0,
              ],
            },
          },
        },
      ]
    );

    return success(res, { message: 'Video and related data permanently deleted' });
  } catch (err) {
    next(err);
  }
};
