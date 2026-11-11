const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const { bruteForceLimiter, aiTierLimiter } = require('../middleware/aiRateLimit');
const { chatValidation, handleValidation } = require('../middleware/validate');
const aiController = require('../controllers/aiController');

router.post('/copilot/chat',
  verifyFirebaseAuth, bruteForceLimiter, aiTierLimiter,
  chatValidation, handleValidation,
  aiController.copilotChat
);

router.post('/generate-course',
  verifyFirebaseAuth, bruteForceLimiter, aiTierLimiter,
  aiController.generateCourse
);

router.post('/generate-quiz',
  verifyFirebaseAuth, bruteForceLimiter, aiTierLimiter,
  aiController.generateQuiz
);

module.exports = router;
