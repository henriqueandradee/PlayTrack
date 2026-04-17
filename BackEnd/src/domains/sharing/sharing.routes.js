const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const sharingController = require('./sharing.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');

// POST /sharing/create — criar novo link (autenticado)
router.post(
  '/create',
  protect,
  [
    body('videoId').notEmpty().isMongoId().withMessage('videoId must be a valid id'),
  ],
  validate,
  sharingController.createShareLink
);

// GET /sharing/token — obter link compartilhado existente (autenticado)
router.get(
  '/token',
  protect,
  [
    query('videoId').notEmpty().isMongoId().withMessage('videoId must be a valid id'),
  ],
  validate,
  sharingController.getShareLink
);

// DELETE /sharing/:token — revogar link (autenticado)
router.delete(
  '/:token',
  protect,
  [
    param('token').notEmpty().withMessage('token is required'),
  ],
  validate,
  sharingController.revokeShareLink
);

// GET /sharing/validate/:token — validar token (SEM autenticação, qualquer um pode acessar)
router.get(
  '/validate/:token',
  [
    param('token').notEmpty().withMessage('token is required'),
  ],
  validate,
  sharingController.validateShareToken
);

module.exports = router;
