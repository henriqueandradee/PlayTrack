const express = require('express');
const router = express.Router();
const subscriptionController = require('./subscription.controller');
const { protect } = require('../../middlewares/authMiddleware');

router.use(protect);

// GET /subscriptions/status
router.get('/status', subscriptionController.getStatus);

// TODO (Fase 5): POST /subscriptions/checkout — create Stripe checkout session
// TODO (Fase 5): POST /subscriptions/cancel
// TODO (Fase 5): POST /webhooks/stripe — handle Stripe events

module.exports = router;
