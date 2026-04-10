const express = require('express');
const { body } = require('express-validator');
const complianceController = require('./compliance.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');
const { dmcaLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

// DMCA notice
router.post(
  '/dmca-report',
  dmcaLimiter,
  [
    body('reporterName').notEmpty().trim().withMessage('Reporter name is required'),
    body('reporterEmail').isEmail().normalizeEmail().withMessage('Valid reporter email is required'),
    body('rightsOwner').notEmpty().trim().withMessage('Rights owner is required'),
    body('infringingUrl').isURL().withMessage('Valid infringing URL is required'),
    body('originalWorkDescription').notEmpty().trim().withMessage('Original work description is required'),
    body('statementGoodFaith')
      .customSanitizer((value) => value === true || value === 'true')
      .custom((value) => value === true)
      .withMessage('Good faith statement must be accepted'),
    body('statementAccuracy')
      .customSanitizer((value) => value === true || value === 'true')
      .custom((value) => value === true)
      .withMessage('Accuracy statement must be accepted'),
    body('digitalSignature').notEmpty().trim().withMessage('Digital signature is required'),
  ],
  validate,
  complianceController.createDmcaReport
);

router.get('/fraud-alerts', protect, complianceController.getMyFraudAlerts);

module.exports = router;
