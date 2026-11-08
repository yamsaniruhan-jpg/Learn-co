// routes/ai.js
const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const { bruteForceLimiter, aiTierLimiter } = require('../middleware/aiRateLimit');
const { chatValidation, handleValidation } = require('../middleware/validate');

// ALL AI routes get: auth → brute force → tier limit → validation
router.post('/copilot/chat',
  verifyFirebaseAuth,
  bruteForceLimiter,
  aiTierLimiter,
  chatValidation,
  handleValidation,
  require('../controllers/aiController').copilotChat
);

router.post('/generate-course',
  verifyFirebaseAuth,
  bruteForceLimiter,
  aiTierLimiter,
  require('../controllers/aiController').generateCourse
);

router.post('/generate-quiz',
  verifyFirebaseAuth,
  bruteForceLimiter,
  aiTierLimiter,
  require('../controllers/aiController').generateQuiz
);

module.exports = router;
