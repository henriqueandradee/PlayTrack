const mongoose = require('mongoose');

// Stat action types (basketball)
const STAT_ACTION_TYPES = [
  '1PT_MADE', '1PT_MISS',
  '2PT_MADE', '2PT_MISS',
  '3PT_MADE', '3PT_MISS',
  'REB', 'ASS', 'RB', 'ERR',
];

const eventSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    // Denormalized for direct user-level queries without joins
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ---- CORE: video timestamp in seconds (float) ----
    // This is the HEART of PlayTrack v2 — syncs with the video player
    // e.g. 342.7 means the event happened at 5m42.7s in the video
    videoTimestampSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    // --- Event category ---
    category: {
      type: String,
      enum: ['stat', 'annotation', 'tactic', 'custom'],
      default: 'stat',
    },

    // --- For stat events (basketball) ---
    actionType: {
      type: String,
      // Validated at the service layer, not as a strict enum here
      // to allow future flexibility and custom types
    },
    athleteId: {
      type: String,
      trim: true,
    },
    athleteName: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
      default: 1,
    },

    // --- For annotation / tactic events ---
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // --- Arbitrary extra data ---
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },

    // --- Soft delete (allows undo in the UI without permanent data loss) ---
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --- Indexes (critical for video player sync performance) ---
eventSchema.index({ videoId: 1, videoTimestampSeconds: 1 }); // time-range queries
eventSchema.index({ videoId: 1, category: 1 });              // filter by type
eventSchema.index({ videoId: 1, deletedAt: 1 });             // exclude soft-deleted
eventSchema.index({ userId: 1, createdAt: -1 });             // user history
eventSchema.index({ videoId: 1, athleteId: 1 });              // multi-athlete lookups

// --- Statics ---
eventSchema.statics.STAT_ACTION_TYPES = STAT_ACTION_TYPES;

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
