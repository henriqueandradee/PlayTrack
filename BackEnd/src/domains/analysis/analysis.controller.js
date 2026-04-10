const Event = require('../../models/Event');
const Video = require('../../models/Video');
const { success, created, notFound, forbidden } = require('../../shared/response.helper');

const VALID_STAT_TYPES = Event.STAT_ACTION_TYPES;

/**
 * POST /analysis/events
 * Register a new event linked to a video timestamp.
 * planGuard('canCreateEvent') runs before this and attaches req.video
 */
exports.createEvent = async (req, res, next) => {
  try {
    const {
      videoId,
      videoTimestampSeconds,
      category = 'stat',
      actionType,
      value = 1,
      note,
      meta,
      athleteId,
      athleteName,
    } = req.body;

    const video = req.video || (await Video.findById(videoId));
    if (!video) {
      return notFound(res, 'Video');
    }

    let resolvedAthleteId = athleteId ? String(athleteId).trim() : '';
    let resolvedAthleteName = athleteName ? String(athleteName).trim() : '';

    if (video?.context?.scope === 'multi atleta') {
      const athletes = Array.isArray(video.context.athletes) ? video.context.athletes : [];
      const matchedAthlete = athletes.find((athlete) =>
        (resolvedAthleteId && athlete.id === resolvedAthleteId) ||
        (resolvedAthleteName && athlete.name.toLowerCase() === resolvedAthleteName.toLowerCase())
      );

      if (!matchedAthlete) {
        return res.status(422).json({
          success: false,
          message: 'É obrigatório selecionar um atleta válido para análise multi atleta.',
          code: 'ATHLETE_REQUIRED',
        });
      }

      resolvedAthleteId = matchedAthlete.id;
      resolvedAthleteName = matchedAthlete.name;
    }

    // Validate actionType for stat events
    if (category === 'stat' && !VALID_STAT_TYPES.includes(actionType)) {
      return res.status(422).json({
        success: false,
        message: `Invalid actionType for stat. Valid values: ${VALID_STAT_TYPES.join(', ')}`,
        code: 'INVALID_ACTION_TYPE',
      });
    }

    const event = await Event.create({
      videoId,
      userId: req.user._id,
      videoTimestampSeconds,
      category,
      actionType,
      value,
      note,
      meta,
      athleteId: resolvedAthleteId || undefined,
      athleteName: resolvedAthleteName || undefined,
    });

    // Increment the denormalized event counter on the Video document
    // req.video is attached by planGuard('canCreateEvent') — no extra DB call
    await Video.updateOne({ _id: videoId }, { $inc: { eventCount: 1 } });

    return created(res, event);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /analysis/events/:eventId
 * Soft-delete an event (preserves data, allows undo).
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return notFound(res, 'Event');
    if (event.deletedAt) return notFound(res, 'Event'); // already deleted

    // Auth check via event's userId (no extra query needed)
    if (event.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    // Soft delete
    event.deletedAt = new Date();
    await event.save();

    // Decrement video event counter
    await Video.updateOne({ _id: event.videoId }, { $inc: { eventCount: -1 } });

    return success(res, { message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /analysis/events?videoId=xxx
 * Get all (non-deleted) events for a video, sorted by video timestamp.
 * This is used for the player timeline view.
 */
exports.getVideoEvents = async (req, res, next) => {
  try {
    const { videoId, from, to, category } = req.query;

    // Verify video ownership
    const video = await Video.findById(videoId);
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    const filter = { videoId, deletedAt: null };
    if (category) filter.category = category;

    // Optional time-window filtering (for player scrubbing)
    if (from !== undefined || to !== undefined) {
      filter.videoTimestampSeconds = {};
      if (from !== undefined) filter.videoTimestampSeconds.$gte = parseFloat(from);
      if (to !== undefined) filter.videoTimestampSeconds.$lte = parseFloat(to);
    }

    const events = await Event.find(filter).sort({ videoTimestampSeconds: 1 });

    return success(res, events);
  } catch (err) {
    next(err);
  }
};
