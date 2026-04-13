// Derive a safe test DB URI from MONGODB_URI by replacing the DB name with PlayTrack_test
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

if (process.env.MONGODB_URI) {
  // Replace the database name in the Atlas URI: .../PlayTrack? → .../PlayTrack_test?
  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(
    /(mongodb(?:\+srv)?:\/\/[^/]+\/)([^?]+)(\??.*)/,
    (_, prefix, dbName, suffix) => `${prefix}PlayTrack_test${suffix}`
  );
}
