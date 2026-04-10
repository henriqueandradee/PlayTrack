const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('[DB] MongoDB reconnected');
});

module.exports = { connectDB };
