const Video = require('../../models/Video');
const ShareLink = require('../../models/ShareLink');
const { success, created, notFound, forbidden, badRequest } = require('../../shared/response.helper');

/**
 * POST /sharing/create
 * Create a share link for a video (only creator can share)
 */
exports.createShareLink = async (req, res, next) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return badRequest(res, 'videoId is required');
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return notFound(res, 'Video');
    }

    // Only the video creator can share it
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    // Remove any existing active share links
    await ShareLink.updateMany(
      { videoId, createdBy: req.user._id },
      { isActive: false }
    );

    // Create new share link
    const shareLink = await ShareLink.create({
      videoId,
      createdBy: req.user._id,
    });

    return created(res, {
      token: shareLink.token,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${shareLink.token}`,
      expiresAt: shareLink.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sharing/validate/:token
 * Validate a share token and return video metadata
 * No authentication required
 */
exports.validateShareToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token }).populate('videoId');
    
    if (!shareLink || !shareLink.isValid()) {
      return notFound(res, 'Share link expired or invalid');
    }

    const video = shareLink.videoId;
    if (!video) {
      return notFound(res, 'Video');
    }

    return success(res, {
      videoId: video._id,
      title: video.title,
      description: video.description,
      source: video.source,
      context: video.context,
      createdAt: video.createdAt,
      createdBy: {
        _id: video.userId,
        // Não retorna dados sensíveis do usuário
        username: 'Coach', // Anonymous
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /sharing/:token
 * Revoke a share link (only creator can revoke)
 */
exports.revokeShareLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token });
    if (!shareLink) {
      return notFound(res, 'Share link');
    }

    // Only creator can revoke
    if (shareLink.createdBy.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    await ShareLink.updateOne({ _id: shareLink._id }, { isActive: false });

    return success(res, { message: 'Share link revoked' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /sharing/token
 * Get current share link for a video (if exists and is active)
 */
exports.getShareLink = async (req, res, next) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return badRequest(res, 'videoId is required');
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return notFound(res, 'Video');
    }

    // Only the video creator can see its share link
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    const shareLink = await ShareLink.findOne({
      videoId,
      createdBy: req.user._id,
      isActive: true,
    });

    if (!shareLink || !shareLink.isValid()) {
      return success(res, null);
    }

    return success(res, {
      token: shareLink.token,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${shareLink.token}`,
      expiresAt: shareLink.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};
