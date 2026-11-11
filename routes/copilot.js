const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const { bruteForceLimiter, aiTierLimiter } = require('../middleware/aiRateLimit');
const { chatValidation, handleValidation } = require('../middleware/validate');
const copilotController = require('../controllers/copilotController');

router.post('/chat',
  verifyFirebaseAuth, bruteForceLimiter, aiTierLimiter,
  chatValidation, handleValidation,
  copilotController.chat
);

router.post('/feedback', verifyFirebaseAuth, copilotController.feedback);
router.get('/history', verifyFirebaseAuth, copilotController.history);

module.exports = router;
