const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'REQUEST_CREATED',
        'EMAIL_SENT',
        'EMAIL_FAILED',
        'TOKEN_CONFIRMED',
        'REQUEST_CONFIRMED',
        'DATA_DELIVERED',
        'REQUEST_EXPIRED',
      ],
    },
    at: {
      type: Date,
      default: Date.now,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const gdprAccessRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    requestTokenHash: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['PENDING_CONFIRMATION', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING_CONFIRMATION',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    requestedFromIp: {
      type: String,
      default: null,
    },
    requestedUserAgent: {
      type: String,
      default: null,
    },
    auditTrail: {
      type: [auditEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

gdprAccessRequestSchema.index({ userId: 1, requestedAt: -1 });
gdprAccessRequestSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('GDPRAccessRequest', gdprAccessRequestSchema);
