require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  db: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    apiPublicUrl: process.env.API_PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT, 10) || 3000}`,
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '0', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@playtrack.local',
  },

  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    proPriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },

  plans: {
    free: {
      maxVideos: parseInt(process.env.FREE_MAX_VIDEOS, 10) || 3,
      maxEventsPerVideo: parseInt(process.env.FREE_MAX_EVENTS_PER_VIDEO, 10) || Infinity,
    },
    pro: {
      maxVideos: Infinity,
      maxEventsPerVideo: Infinity,
    },
  },
};

module.exports = config;
