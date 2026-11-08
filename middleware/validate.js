// middleware/validate.js
const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize text input and block prompt injection attacks
 * Specifically tuned for Google Gemini API patterns
 */
function sanitizeAndGuard(value) {
  if (typeof value !== 'string') return value;

  let cleaned = value;

  // 1. Block known prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior|preceding)\s+(instructions?|prompts?|rules?|guidelines?)/gi,
    /you\s+are\s+now\s+(a|an)\s+/gi,
    /disregard\s+(all\s+)?(previous|prior|above)/gi,
    /new\s+instructions?\s*:/gi,
    /system\s*(prompt|message|instruction)\s*:/gi,
    /\[INST\]|\[\/INST\]/g,
    /<\|im_start\|>|<\|im_end\|>/g,
    /###\s*(system|instruction|assistant)\s*:/gi,
    /forget\s+(everything|all|your)\s+(instructions?|rules?|prompt)/gi,
    /override\s+(your|the)\s+(instructions?|rules?|guidelines?)/gi,
  ];

  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[BLOCKED]');
  }

  // 2. HTML/XSS sanitization
  cleaned = DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'blockquote'],
    ALLOWED_ATTR: ['class', 'href'],
  });

  return cleaned;
}

// Validation chains
const chatValidation = [
  body('message')
    .optional()
    .trim()
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 4000 }).withMessage('Message must be under 4000 characters')
    .customSanitizer(sanitizeAndGuard),
  body('prompt')
    .optional()
    .trim()
    .notEmpty().withMessage('Prompt cannot be empty')
    .isLength({ max: 4000 }).withMessage('Prompt must be under 4000 characters')
    .customSanitizer(sanitizeAndGuard),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 10000 }).withMessage('Context too large')
    .customSanitizer(sanitizeAndGuard),
];

const courseValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters')
    .customSanitizer(sanitizeAndGuard),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be under 5000 characters')
    .customSanitizer(sanitizeAndGuard),
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Subject required')
    .customSanitizer(sanitizeAndGuard),
  body('content.*.text')
    .optional()
    .customSanitizer(sanitizeAndGuard),
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { chatValidation, courseValidation, handleValidation, sanitizeAndGuard, sanitizeInput: sanitizeAndGuard };
