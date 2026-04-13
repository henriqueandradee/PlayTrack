/**
 * Migration Script: Match → Video (PlayTrack v1 → v2)
 *
 * What this does:
 *   1. Reads all existing Match documents from MongoDB
 *   2. Creates a corresponding Video document for each Match
 *   3. Migrates EventLog → Event (adds videoTimestampSeconds = 0 placeholder)
 *   4. Migrates BoxScore → VideoStats
 *   5. Does NOT delete v1 collections (safe rollback possible)
 *
 * Run: npm run migrate:v2
 * Safe to run multiple times (idempotent via sentinel videoId).
 */

require('dotenv').config();
const mongoose = require('mongoose');

// --- v1 schemas defined inline (source files removed in v2 cleanup) ---
const Match = mongoose.model('Match', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  dateStart: Date,
  dateEnd: Date,
  boxscoreSaved: { type: Boolean, default: false },
}, { timestamps: true }));

const EventLog = mongoose.model('EventLog', new mongoose.Schema({
  matchId: mongoose.Schema.Types.ObjectId,
  actionType: String,
  value: { type: Number, default: 1 },
  timestamp: Date,
  meta: mongoose.Schema.Types.Mixed,
}));

const BoxScore = mongoose.model('BoxScore', new mongoose.Schema({
  matchId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  aggregates: mongoose.Schema.Types.Mixed,
  computedAt: Date,
}));

// --- v2 models ---
const Video      = require('../src/models/Video');
const Event      = require('../src/models/Event');
const VideoStats = require('../src/models/VideoStats');
const User       = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Migration] Connected to MongoDB\n');

  const matches = await Match.find({});
  console.log(`[Migration] Found ${matches.length} Match documents to migrate`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const match of matches) {
    try {
      // Check if already migrated (idempotent)
      const existing = await Video.findOne({ 'source.videoId': `legacy_match_${match._id}` });
      if (existing) {
        console.log(`  [SKIP] Match ${match._id} already migrated → Video ${existing._id}`);
        skipped++;
        continue;
      }

      // 1. Create Video from Match
      const video = await Video.create({
        userId: match.userId,
        title: match.name || 'Jogo sem título',
        description: '',
        source: {
          type: 'url',
          videoId: `legacy_match_${match._id}`, // sentinel to detect re-runs
          url: '',             // no video URL existed in v1
          thumbnailUrl: null,
          durationSeconds: 0,
        },
        context: {
          sport: 'basketball',
          eventType: 'game',
        },
        analysisStatus: match.boxscoreSaved ? 'completed' : 'pending',
        eventCount: 0, // will be updated below
        createdAt: match.createdAt || match.dateStart,
        updatedAt: match.updatedAt || match.dateEnd || match.dateStart,
      });

      // 2. Migrate EventLog → Event
      const oldEvents = await EventLog.find({ matchId: match._id });
      let eventCount = 0;

      for (const oldEvent of oldEvents) {
        // Check if already created
        const existingEvent = await Event.findOne({
          videoId: video._id,
          meta: { legacyEventId: oldEvent._id.toString() },
        });
        if (existingEvent) continue;

        await Event.create({
          videoId: video._id,
          userId: match.userId,
          videoTimestampSeconds: 0, // v1 had no video timestamps — placeholder
          category: 'stat',
          actionType: oldEvent.actionType,
          value: oldEvent.value || 1,
          meta: {
            legacyEventId: oldEvent._id.toString(),
            originalTimestamp: oldEvent.timestamp,
          },
          createdAt: oldEvent.timestamp || new Date(),
        });
        eventCount++;
      }

      // Update event count on video
      await Video.updateOne({ _id: video._id }, { $set: { eventCount } });

      // 3. Migrate BoxScore → VideoStats
      const boxScore = await BoxScore.findOne({ matchId: match._id });
      if (boxScore && boxScore.aggregates) {
        const agg = boxScore.aggregates;
        const safeDiv = (n, d) => (d === 0 ? 0 : parseFloat((n / d).toFixed(4)));

        await VideoStats.findOneAndUpdate(
          { videoId: video._id },
          {
            $set: {
              userId: match.userId,
              aggregates: agg,
              computed: {
                fg_pct:       safeDiv(agg.fgm, agg.fga),
                two_pt_pct:   safeDiv(agg['2ptm'], agg['2pta']),
                three_pt_pct: safeDiv(agg['3ptm'], agg['3pta']),
                ft_pct:       safeDiv(agg.ftm, agg.fta),
                reb:          (agg.oreb || 0) + (agg.dreb || 0),
              },
              eventCountSnapshot: eventCount,
              computedAt: boxScore.computedAt || new Date(),
            },
          },
          { upsert: true }
        );
      }

      // 4. Update user usage counter
      await User.updateOne(
        { _id: match.userId },
        { $inc: { 'usage.videoCount': 1 } }
      );

      console.log(`  [OK] Match "${match.name}" → Video ${video._id} (${eventCount} events)`);
      migrated++;
    } catch (err) {
      console.error(`  [ERROR] Match ${match._id}:`, err.message);
      errors++;
    }
  }

  console.log(`
[Migration] Complete
  Migrated : ${migrated}
  Skipped  : ${skipped}
  Errors   : ${errors}
  `);

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
