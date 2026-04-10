const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ['free', 'pro'],
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
      default: 'active',
    },

    // --- Stripe ---
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },

    // --- Billing period ---
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    canceledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// --- Indexes ---
// Note: userId unique index created by `unique: true` above
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
