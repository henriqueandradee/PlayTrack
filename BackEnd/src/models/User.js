const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { validateAge } = require('../shared/ageValidator');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 12,
      validate: {
        validator: function (v) {
          // Mínimo 12 caracteres
          if (v.length < 12) return false;
          // Pelo menos 1 letra maiúscula
          if (!/[A-Z]/.test(v)) return false;
          // Pelo menos 1 número
          if (!/[0-9]/.test(v)) return false;
          return true;
        },
        message: 'Senha deve ter mínimo 12 caracteres, incluir 1 letra maiúscula e 1 número',
      },
    },

    // --- Subscription / Plan ---
    plan: {
      type: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free',
      },
      startedAt: { type: Date },
      expiresAt: { type: Date, default: null }, // null = no expiry
      stripeCustomerId: { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
    },

    // --- Usage counters (denormalized for fast freemium checks) ---
    usage: {
      videoCount: { type: Number, default: 0, min: 0 },
    },

    // --- Team roster (persistent athlete list for 'Meu Time') ---
    teamRoster: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true, trim: true },
      },
    ],

    // --- LGPD: Age Validation (Art. 14) ---
    dateOfBirth: {
      type: Date,
      required: false,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optional field
          return validateAge(v, 18);
        },
        message: 'Você deve ter 18 anos ou mais',
      },
    },

    // --- LGPD: Soft Delete (Art. 17) ---
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedReason: {
      type: String,
      enum: ['USER_REQUESTED', 'ADMIN_REMOVAL', 'POLICY_VIOLATION', null],
      default: null,
    },

    // Session invalidation version used by JWT claims
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- LGPD: Consentimentos (Art. 7-8, 13) ---
    consents: {
      termsAccepted: { type: Boolean, default: false },
      privacyAccepted: { type: Boolean, default: false },
      marketingConsent: { type: Boolean, default: false },
      acceptedAt: { type: Date, default: null },
      acceptedIp: { type: String, default: null },
      revokedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// --- Indexes ---
// Note: email unique index is already created by `unique: true` in the field definition
userSchema.index({ 'plan.type': 1 });
userSchema.index({ deletedAt: 1 }); // Para find soft-deleted users
userSchema.index({ email: 1, deletedAt: 1 }); // Para login queries

// --- Hooks ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// --- Methods ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPro = function () {
  if (this.plan.type !== 'pro') return false;
  if (this.plan.expiresAt && new Date() > this.plan.expiresAt) return false;
  return true;
};

userSchema.methods.getPlanLimits = function () {
  const config = require('../config');
  return config.plans[this.isPro() ? 'pro' : 'free'];
};

userSchema.methods.isDeleted = function () {
  return this.deletedAt !== null && this.deletedAt !== undefined;
};

userSchema.methods.canLogin = function () {
  return !this.isDeleted();
};

const User = mongoose.model('User', userSchema);
module.exports = User;
