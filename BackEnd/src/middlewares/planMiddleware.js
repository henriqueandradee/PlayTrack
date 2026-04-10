const Video = require('../models/Video');
const config = require('../config');
const { planLimitReached, forbidden } = require('../shared/response.helper');

/**
 * Plan guard factory.
 * Usage: router.post('/', protect, planGuard('canCreateVideo'), controller.create)
 *
 * Supported permissions:
 *  - 'canCreateVideo'   → checks user.usage.videoCount vs plan limit
 *  - 'canCreateEvent'   → checks video.eventCount vs plan limit (needs videoId in body or params)
 *  - 'proOnly'          → rejects free users entirely
 */
const planGuard = (permission) => async (req, res, next) => {
  const user = req.user;
  const limits = config.plans[user.isPro() ? 'pro' : 'free'];

  try {
    if (permission === 'canCreateVideo') {
      if (user.usage.videoCount >= limits.maxVideos) {
        return planLimitReached(
          res,
          `Você atingiu o limite de ${limits.maxVideos} vídeos do plano gratuito. Faça upgrade para Pro para vídeos ilimitados.`,
          'VIDEO_LIMIT_REACHED'
        );
      }
    }

    if (permission === 'canCreateEvent') {
      const videoId = req.body.videoId || req.params.videoId;

      if (!videoId) {
        return forbidden(res, 'videoId is required');
      }

      const video = await Video.findById(videoId);
      if (!video) {
        return forbidden(res, 'Video not found');
      }

      // Ensure the video belongs to this user
      if (video.userId.toString() !== user._id.toString()) {
        return forbidden(res, 'Not authorized to register events on this video');
      }

      // Event limit only applies to pro plan restrictions
      if (limits.maxEventsPerVideo !== Infinity && video.eventCount >= limits.maxEventsPerVideo) {
        return planLimitReached(
          res,
          `Você atingiu o limite de ${limits.maxEventsPerVideo} registros por vídeo do plano gratuito. Faça upgrade para Pro.`,
          'EVENT_LIMIT_REACHED'
        );
      }

      // Attach video to request so controller doesn't re-fetch it
      req.video = video;
    }

    if (permission === 'proOnly') {
      if (!user.isPro()) {
        return planLimitReached(
          res,
          'Esta funcionalidade está disponível apenas no plano Pro.',
          'PRO_REQUIRED'
        );
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { planGuard };
