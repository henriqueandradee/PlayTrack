const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const videoController = require('./video.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');
const { optionalShareToken } = require('../../middlewares/shareTokenMiddleware');
const { planGuard } = require('../../middlewares/planMiddleware');

// GET /videos/:videoId — permite acesso público com token
router.get(
  '/:videoId',
  optionalShareToken,
  [param('videoId').isMongoId().withMessage('Invalid videoId')],
  validate,
  videoController.getVideo
);

// GET /videos — listar vídeos do usuário (requer autenticação)
router.get(
  '/',
  protect,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'completed']),
  ],
  validate,
  videoController.getVideos
);

// POST /videos — criar novo vídeo (requer autenticação)
router.post(
  '/',
  protect,
  planGuard('canCreateVideo'),
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('context.analysisType').isIn(['estatística', 'tática', 'ambos']),
    body('context.scope').isIn(['eu', 'outro atleta', 'multi atleta', 'time']),
    body('context.gameType').isIn(['jogo', 'estudo']),
    body('context.analysisMode').isIn(['presencial', 'YouTube']),
    body('sourceType')
      .optional()
      .isIn(['youtube', 'live'])
      .withMessage('sourceType must be youtube or live'),
    body('sourceUrl')
      .optional()
      .isURL({ require_protocol: true })
      .withMessage('Valid URL required'),
    body('description').optional().trim(),
    body('tags').optional().isArray(),
    body('context.athletes').optional().isArray(),
  ],
  validate,
  videoController.createVideo
);

// PATCH /videos/:videoId — atualizar vídeo (requer autenticação)
router.patch(
  '/:videoId',
  protect,
  [
    param('videoId').isMongoId().withMessage('Invalid videoId'),
    body('title').optional().notEmpty().trim(),
    body('analysisStatus')
      .optional()
      .isIn(['pending', 'completed']),
    body('tags').optional().isArray(),
  ],
  validate,
  videoController.updateVideo
);

// DELETE /videos/:videoId — deletar vídeo (requer autenticação)
router.delete(
  '/:videoId',
  protect,
  [param('videoId').isMongoId().withMessage('Invalid videoId')],
  validate,
  videoController.deleteVideo
);

module.exports = router;
