const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const analysisController = require('./analysis.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');
const { planGuard } = require('../../middlewares/planMiddleware');

router.use(protect);

// GET /analysis/events?videoId=xxx&from=0&to=60&category=stat
router.get(
  '/events',
  [
    query('videoId').notEmpty().isMongoId().withMessage('videoId must be a valid id'),
    query('from').optional().isFloat({ min: 0 }),
    query('to').optional().isFloat({ min: 0 }),
    query('category').optional().isIn(['stat', 'annotation', 'tactic', 'custom']),
  ],
  validate,
  analysisController.getVideoEvents
);

// POST /analysis/events — freemium guard checks event limit per video
router.post(
  '/events',
  planGuard('canCreateEvent'),
  [
    body('videoId').notEmpty().isMongoId().withMessage('videoId must be a valid id'),
    body('videoTimestampSeconds')
      .isFloat({ min: 0 })
      .withMessage('videoTimestampSeconds must be a non-negative number'),
    body('category')
      .optional()
      .isIn(['stat', 'annotation', 'tactic', 'custom']),
    body('actionType').optional().isString(),
    body('value').optional().isNumeric(),
    body('note').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  analysisController.createEvent
);

// DELETE /analysis/events/:eventId
router.delete(
  '/events/:eventId',
  [param('eventId').isMongoId().withMessage('eventId must be a valid id')],
  validate,
  analysisController.deleteEvent
);

module.exports = router;
