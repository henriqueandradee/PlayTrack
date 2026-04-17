const Video = require('../../models/Video');
const Event = require('../../models/Event');
const VideoStats = require('../../models/VideoStats');
const { computeFromEvents, safeDiv } = require('./stats.calculator');
const { success, notFound, forbidden } = require('../../shared/response.helper');

/**
 * GET /stats/videos/:videoId
 * Returns computed stats for a single video.
 * Uses lazy-compute with cache invalidation via eventCountSnapshot.
 */
exports.getVideoStats = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return notFound(res, 'Video');
    if (video.userId.toString() !== req.user._id.toString()) {
      return forbidden(res);
    }

    let statsDoc = await VideoStats.findOne({ videoId: video._id });

    // Cache hit: snapshot is still valid
    if (statsDoc && statsDoc.eventCountSnapshot === video.eventCount) {
      return success(res, statsDoc);
    }

    // Cache miss: recompute from raw events
    const events = await Event.find({ videoId: video._id, deletedAt: null });
    const { aggregates, computed } = computeFromEvents(events);

    statsDoc = await VideoStats.findOneAndUpdate(
      { videoId: video._id },
      {
        $set: {
          userId: req.user._id,
          aggregates,
          computed,
          eventCountSnapshot: video.eventCount,
          computedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return success(res, statsDoc);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /stats/career
 * Aggregates stats across all of the user's completed videos.
 * Pro-oriented endpoint (still accessible on free for now).
 */
exports.getCareerStats = async (req, res, next) => {
  try {
    const pipeline = [
      { $match: { userId: req.user._id, deletedAt: null } },
      {
        $lookup: {
          from: 'videos',
          localField: 'videoId',
          foreignField: '_id',
          as: 'video'
        }
      },
      { $unwind: '$video' },
      {
        $match: {
          'video.deletedAt': null,
          'video.analysisStatus': 'completed',
          'video.context.scope': { $in: ['meu_time', /* compat */ 'eu', 'multi atleta', 'time'] },
        },
      },
      {
        $group: {
          _id: null,
          videosAnalyzed: { $sum: 1 },
          pts:  { $sum: '$aggregates.pts'  },
          fgm:  { $sum: '$aggregates.fgm'  },
          fga:  { $sum: '$aggregates.fga'  },
          ftm:  { $sum: '$aggregates.ftm'  },
          fta:  { $sum: '$aggregates.fta'  },
          '2ptm': { $sum: '$aggregates.2ptm' },
          '2pta': { $sum: '$aggregates.2pta' },
          '3ptm': { $sum: '$aggregates.3ptm' },
          '3pta': { $sum: '$aggregates.3pta' },
          reb: { $sum: '$aggregates.reb' },
          ass: { $sum: '$aggregates.ass' },
          rb:  { $sum: '$aggregates.rb' },
          err: { $sum: '$aggregates.err' },
        },
      },
    ];

    const result = await VideoStats.aggregate(pipeline);

    if (!result || result.length === 0) {
      return success(res, null, 200);
    }

    const data = result[0];
    const videosAnalyzed = data.videosAnalyzed;

    delete data._id;
    delete data.videosAnalyzed;

    const aggregates = data;
    const computed = {
      fg_pct:       safeDiv(aggregates.fgm, aggregates.fga),
      two_pt_pct:   safeDiv(aggregates['2ptm'], aggregates['2pta']),
      three_pt_pct: safeDiv(aggregates['3ptm'], aggregates['3pta']),
      ft_pct:       safeDiv(aggregates.ftm, aggregates.fta),
      eff:          (aggregates.pts + aggregates.reb + aggregates.ass + aggregates.rb) - ((aggregates.fga - aggregates.fgm) + (aggregates.fta - aggregates.ftm) + aggregates.err),
    };

    return success(res, { aggregates, computed, videosAnalyzed });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /stats/career/athletes
 * Returns career stats grouped by athleteId (for per-athlete view).
 */
exports.getCareerStatsByAthlete = async (req, res, next) => {
  try {
    const pipeline = [
      // Get all stat events from the user
      {
        $match: {
          userId: req.user._id,
          deletedAt: null,
          category: 'stat',
          athleteId: { $ne: null },
        },
      },
      // Join with videos to filter only meu_time + completed
      {
        $lookup: {
          from: 'videos',
          localField: 'videoId',
          foreignField: '_id',
          as: 'video',
        },
      },
      { $unwind: '$video' },
      {
        $match: {
          'video.deletedAt': null,
          'video.analysisStatus': 'completed',
          'video.context.scope': { $in: ['meu_time', 'eu', 'multi atleta', 'time'] },
        },
      },
      // Group by athlete
      {
        $group: {
          _id: { athleteId: '$athleteId', athleteName: '$athleteName' },
          gamesPlayed: { $addToSet: '$videoId' },
          events: { $push: '$$ROOT' },
        },
      },
    ];

    const Event = require('../../models/Event');
    const results = await Event.aggregate(pipeline);

    const athleteStats = results.map((item) => {
      const { aggregates, computed } = computeFromEvents(item.events);
      return {
        athleteId: item._id.athleteId,
        athleteName: item._id.athleteName,
        gamesPlayed: item.gamesPlayed.length,
        aggregates,
        computed,
      };
    });

    // Sort by points descending
    athleteStats.sort((a, b) => b.aggregates.pts - a.aggregates.pts);

    return success(res, athleteStats);
  } catch (err) {
    next(err);
  }
};
