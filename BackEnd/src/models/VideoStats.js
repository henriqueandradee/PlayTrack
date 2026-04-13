const mongoose = require('mongoose');

const videoStatsSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- Computed aggregates ---
    aggregates: {
      pts:  { type: Number, default: 0 },
      fgm:  { type: Number, default: 0 },
      fga:  { type: Number, default: 0 },
      ftm:  { type: Number, default: 0 },
      fta:  { type: Number, default: 0 },
      '2ptm': { type: Number, default: 0 },
      '2pta': { type: Number, default: 0 },
      '3ptm': { type: Number, default: 0 },
      '3pta': { type: Number, default: 0 },
      reb:  { type: Number, default: 0 },
      ass:  { type: Number, default: 0 },
      rb:   { type: Number, default: 0 },
      err:  { type: Number, default: 0 },
    },

    // --- Derived percentages (not stored on Event, computed here) ---
    computed: {
      fg_pct:      { type: Number, default: 0 },
      two_pt_pct:  { type: Number, default: 0 },
      three_pt_pct: { type: Number, default: 0 },
      ft_pct:      { type: Number, default: 0 },
      eff:         { type: Number, default: 0 },
    },

    // --- Cache invalidation ---
    // If eventCountSnapshot !== video.eventCount → recalculate
    eventCountSnapshot: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },

    // --- Soft delete ---
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --- Indexes ---
// Note: videoId unique index created by `unique: true` above
videoStatsSchema.index({ userId: 1 });

const VideoStats = mongoose.model('VideoStats', videoStatsSchema);
module.exports = VideoStats;
