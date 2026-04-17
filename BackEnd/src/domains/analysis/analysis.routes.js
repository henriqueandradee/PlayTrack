const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const analysisController = require('./analysis.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');
const { optionalShareToken } = require('../../middlewares/shareTokenMiddleware');
const { planGuard } = require('../../middlewares/planMiddleware');

// GET /analysis/events — permite acesso público com token de compartilhamento
router.get(
  '/events',
  optionalShareToken,
  [
    query('videoId').notEmpty().isMongoId().withMessage('videoId must be a valid id'),
    query('from').optional().isFloat({ min: 0 }),
    query('to').optional().isFloat({ min: 0 }),
    query('category').optional().isIn(['stat', 'annotation', 'tactic', 'custom']),
  ],
  validate,
  analysisController.getVideoEvents
);

// POST /analysis/events — criar eventos (requer autenticação)
router.post(
  '/events',
  protect,
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

// DELETE /analysis/events/:eventId — deletar eventos (requer autenticação)
router.delete(
  '/events/:eventId',
  protect,
  [param('eventId').isMongoId().withMessage('eventId must be a valid id')],
  validate,
  analysisController.deleteEvent
);

module.exports = router;
