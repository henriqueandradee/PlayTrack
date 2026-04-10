const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const { success } = require('../../shared/response.helper');

/**
 * GET /subscriptions/status
 * Returns the current user's plan and usage limits.
 */
exports.getStatus = async (req, res, next) => {
  try {
    const user = req.user;
    const limits = user.getPlanLimits();

    const subscription = await Subscription.findOne({ userId: user._id });

    return success(res, {
      plan: {
        type: user.plan.type,
        isPro: user.isPro(),
        expiresAt: user.plan.expiresAt,
      },
      usage: {
        videoCount: user.usage.videoCount,
        maxVideos: limits.maxVideos === Infinity ? null : limits.maxVideos,
        maxEventsPerVideo: limits.maxEventsPerVideo === Infinity ? null : limits.maxEventsPerVideo,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            canceledAt: subscription.canceledAt,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};
