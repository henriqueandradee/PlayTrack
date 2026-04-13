/**
 * GDPR Routes
 * Endpoints para exercer direitos LGPD
 */

const express = require('express');
const router = express.Router();
const gdprController = require('./gdpr.controller');
const { protect } = require('../../middlewares/authMiddleware');
const { body } = require('express-validator');
const validate = require('../../middlewares/validate');
const { gdprAccessLimiter } = require('../../middlewares/rateLimiter');

/**
 * POST /gdpr/access-request
 * Usuário solicita uma cópia de seus dados (LGPD Art. 18)
 * Flow:
 *   1. Usuário clica "Baixar meus dados"
 *   2. API valida a sessão autenticada
 *   3. API responde com o arquivo JSON para download imediato
 */
router.post(
  '/access-request',
  protect,
  gdprAccessLimiter,
  validate,
  gdprController.initiateAccessRequest
);

/**
 * POST /gdpr/access-request/confirm
 * Confirma uma solicitação de acesso autenticada e devolve o arquivo
 */
router.post(
  '/access-request/confirm',
  protect,
  gdprAccessLimiter,
  [
    body('requestId')
      .isMongoId()
      .withMessage('requestId inválido'),
  ],
  validate,
  gdprController.confirmAccessRequest
);

/**
 * GET /gdpr/portability-request
 * Exportar dados em formato portável (LGPD Art. 20)
 * Query params:
 *   - format: 'json' ou 'csv'
 * Requires auth: Será implementado como protegido
 */
router.get(
  '/portability-request',
  protect,
  gdprAccessLimiter,
  gdprController.getPortabilityData
);

/**
 * GET /gdpr/consents
 * Retorna preferências atuais de consentimento
 */
router.get('/consents', protect, gdprController.getConsentPreferences);

/**
 * PATCH /gdpr/consents
 * Atualiza consentimento opcional (oposição a marketing)
 */
router.patch(
  '/consents',
  protect,
  [
    body('marketingConsent')
      .isBoolean()
      .withMessage('marketingConsent must be boolean'),
  ],
  validate,
  gdprController.updateConsentPreferences
);

module.exports = router;
