const mongoose = require('mongoose');

const dmcaNoticeSchema = new mongoose.Schema(
  {
    reporterName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    reporterEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
      index: true,
    },
    rightsOwner: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    infringingUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    originalWorkDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    statementGoodFaith: {
      type: Boolean,
      required: true,
      default: false,
    },
    statementAccuracy: {
      type: Boolean,
      required: true,
      default: false,
    },
    digitalSignature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'REJECTED'],
      default: 'RECEIVED',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DmcaNotice', dmcaNoticeSchema);
