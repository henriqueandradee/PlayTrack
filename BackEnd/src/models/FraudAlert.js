const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      default: null,
    },
    ip: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    signalType: {
      type: String,
      required: true,
      enum: ['RAPID_DELETE_RESTORE', 'UNKNOWN'],
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

fraudAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
