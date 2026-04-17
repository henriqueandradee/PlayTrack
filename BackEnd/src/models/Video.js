const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- Core metadata ---
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // --- Video source (optional — partidas presenciais não precisam de vídeo) ---
    source: {
      type: {
        type: String,
        enum: ['youtube', 'live'],
        default: 'live',
      },
      // YouTube: videoId extracted from URL (e.g. "dQw4w9WgXcQ")
      // Drive: fileId extracted from URL
      // url: raw URL
      // live: análise presencial ao vivo (sem vídeo)
      videoId: { type: String },
      url: { type: String },
      thumbnailUrl: { type: String },
      durationSeconds: { type: Number, min: 0 },
    },

    // --- Sport context ---
    context: {
      sport: { type: String, default: 'basketball' },
      analysisType: {
        type: String,
        enum: ['estatística', 'tática', 'ambos'],
        required: true,
      },
      scope: {
        type: String,
        enum: ['meu_time', 'outro_time', /* compat */ 'eu', 'outro atleta', 'multi atleta', 'time'],
        required: true,
      },
      gameType: {
        type: String,
        enum: ['jogo', 'estudo'],
        required: true,
      },
      analysisMode: {
        type: String,
        enum: ['presencial', 'YouTube'],
        required: true,
      },
      eventType: {
        type: String,
        enum: ['game', 'training', 'study', 'other'],
        default: 'game',
      },
      athletes: [
        {
          id: { type: String, trim: true },
          name: { type: String, trim: true },
        },
      ],
      opponent: { type: String, trim: true },
      location: { type: String, trim: true },
    },

    // --- Analysis status ---
    analysisStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },

    // --- Soft delete ---
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // --- Denormalized event counter (freemium guard + stats cache invalidation) ---
    eventCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

// --- Indexes (critical for performance) ---
videoSchema.index({ userId: 1, createdAt: -1 });        // list videos by user
videoSchema.index({ userId: 1, analysisStatus: 1 });    // filter by status
videoSchema.index({ 'source.type': 1 });                // filter by source

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;
