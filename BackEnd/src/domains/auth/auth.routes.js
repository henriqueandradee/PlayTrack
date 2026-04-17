const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { protect } = require('../../middlewares/authMiddleware');
const {
  loginLimiter,
  registerLimiter,
  deleteAccountLimiter,
  undeleteAccountLimiter,
} = require('../../middlewares/rateLimiter');

// POST /auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('username').notEmpty().trim().withMessage('Username is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  validate,
  authController.register
);

// POST /auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// GET /auth/me
router.get('/me', protect, authController.getMe);

// POST /auth/logout
router.post('/logout', protect, authController.logout);

/**
 * ✅ LGPD Art. 17: Direito ao Esquecimento (Soft Delete)
 */
// POST /auth/delete-account
router.post(
  '/delete-account',
  protect,
  deleteAccountLimiter,
  [
    body('password').notEmpty().withMessage('Password is required'),
    body('confirmEmail').isEmail().normalizeEmail().withMessage('Valid email confirmation required'),
    body('reason')
      .optional()
      .isIn(['USER_REQUESTED', 'ADMIN_REMOVAL', 'POLICY_VIOLATION'])
      .withMessage('Invalid reason'),
  ],
  validate,
  authController.deleteAccount
);

/**
 * ✅ LGPD Art. 17: Recuperar conta (dentro de 30 dias)
 */
// POST /auth/undelete-account
router.post(
  '/undelete-account',
  undeleteAccountLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.undeleteAccount
);

// GET /auth/roster — persistent team athletes
router.get('/roster', protect, authController.getRoster);

// PUT /auth/roster — update team athletes
router.put('/roster', protect, authController.updateRoster);

module.exports = router;
