const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const statsController = require('./stats.controller');
const { protect } = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validate');
const { statsLimiter } = require('../../middlewares/rateLimiter');

router.use(protect);

// GET /stats/videos/:videoId — stats for one video (lazy compute)
router.get(
	'/videos/:videoId',
	statsLimiter,
	[param('videoId').isMongoId().withMessage('videoId must be a valid id')],
	validate,
	statsController.getVideoStats
);

// GET /stats/career — aggregated stats across all videos
router.get('/career', statsLimiter, statsController.getCareerStats);

// GET /stats/career/athletes — career stats grouped by athlete
router.get('/career/athletes', statsLimiter, statsController.getCareerStatsByAthlete);

module.exports = router;
