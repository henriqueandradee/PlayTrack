const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const exportController = require('./export.controller');
const { protect } = require('../../middlewares/authMiddleware');
const { planGuard } = require('../../middlewares/planMiddleware');
const validate = require('../../middlewares/validate');
const { exportJobLimiter } = require('../../middlewares/rateLimiter');

router.use(protect);

// GET /export/pdf/:videoId — Pro only
router.get(
	'/pdf/:videoId',
	[param('videoId').isMongoId().withMessage('videoId must be a valid id')],
	validate,
	planGuard('proOnly'),
	exportController.exportVideoPDF
);

// POST /export/video/:videoId — generate highlights from YouTube source
router.post(
	'/video/:videoId',
	planGuard('proOnly'),
	exportJobLimiter,
	[
		param('videoId').isMongoId().withMessage('videoId must be a valid id'),
		body('eventIds').isArray({ min: 1 }).withMessage('eventIds must be a non-empty array'),
		body('eventIds.*').isMongoId().withMessage('Each eventId must be a valid id'),
		body('beforeSeconds').isFloat({ min: 0, max: 30 }).withMessage('beforeSeconds must be between 0 and 30'),
		body('afterSeconds').isFloat({ min: 1, max: 60 }).withMessage('afterSeconds must be between 1 and 60'),
		body('outputFileName').optional().isString().trim().isLength({ min: 1, max: 100 }),
	],
	validate,
	exportController.exportVideoHighlights,
);

router.get(
  '/video/jobs/:jobId',
  [param('jobId').isUUID().withMessage('jobId must be a valid UUID')],
  validate,
  exportController.getVideoExportJobStatus
);

router.get(
  '/video/jobs/:jobId/download',
  [param('jobId').isUUID().withMessage('jobId must be a valid UUID')],
  validate,
  exportController.downloadVideoExportJob
);

module.exports = router;
