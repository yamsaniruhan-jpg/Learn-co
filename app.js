// app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const securityMiddleware = require('./middleware/security');

const app = express();

// ORDER MATTERS — security first
app.use(securityMiddleware);
app.use(cors({
  origin: ['https://learn-co.ai.studio', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));  // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Mount API routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/copilot', require('./routes/copilot'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/marketplace', require('./routes/marketplace'));

module.exports = app;
