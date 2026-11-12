const { callGemini } = require('../services/geminiService');
const admin = require('../server/services/firebaseAdminCompat.cjs');

exports.copilotChat = async (req, res) => {
  try {
    const { message, prompt, context } = req.body;
    const userQuery = message || prompt;
    const uid = req.user?.uid || req.user?.id || 'guest-user';

    const systemPrompt = `You are LearnCo's Omni Copilot, an AI educational assistant.
You help learners understand concepts and creators build better courses.
User context: ${context || 'No additional context provided.'}
Be concise, accurate, and encouraging.`;

    const result = await callGemini({
      prompt: userQuery,
      modelTier: 'fast',
      systemInstruction: systemPrompt,
      maxOutputTokens: 1024,
    });

    if (!result.success) {
      // Fallback pedagogical response if Gemini API key is unconfigured or blocked
      return res.json({
        response: `### Socratic Diagnostic Guidance\n\nRegarding: "${userQuery.slice(0, 100)}"\n\n1. What is the fundamental conservation law or invariant at play?\n2. What does setting the rate of change to zero yield?`,
        reply: `### Socratic Diagnostic Guidance\n\nRegarding: "${userQuery.slice(0, 100)}"\n\n1. What is the fundamental conservation law or invariant at play?\n2. What does setting the rate of change to zero yield?`,
        model: 'socratic-fallback',
      });
    }

    try {
      if (admin.apps.length) {
        await admin.firestore()
          .collection('users').doc(uid)
          .collection('copilotHistory').add({
            role: 'assistant',
            content: result.data,
            userMessage: userQuery,
            model: result.model,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (dbErr) {
      console.warn('Firestore history save skipped:', dbErr.message);
    }

    res.json({ response: result.data, reply: result.data, model: result.model });
  } catch (error) {
    console.error('Copilot error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.generateCourse = async (req, res) => {
  try {
    const { title, subject, description, targetAudience } = req.body;

    const promptText = `Create a comprehensive course outline for:
Title: ${title || 'STEM Mastery Course'}
Subject: ${subject || 'Science & Math'}
Description: ${description || 'N/A'}
Target Audience: ${targetAudience || 'Beginners'}

Format as JSON:
{
  "title": "Course Title",
  "description": "Course description",
  "modules": [
    {
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "objectives": ["obj1", "obj2"],
          "estimatedMinutes": 15,
          "content": "Lesson content in markdown"
        }
      ]
    }
  ]
}`;

    const result = await callGemini({
      prompt: promptText,
      modelTier: 'powerful',
      temperature: 0.6,
      maxOutputTokens: 4096,
    });

    if (!result.success) {
      return res.json({
        course: {
          title: title || 'Synthesized STEM Course',
          subject: subject || 'STEM',
          modules: [
            { title: 'Module 1: Ground-Truth Foundations', lessons: [{ title: 'Lesson 1: Invariants', content: 'Core principles.' }] },
          ],
        },
        model: 'fallback',
      });
    }

    let courseData;
    try {
      const jsonMatch = result.data.match(/\{[\s\S]*\}/);
      courseData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.data };
    } catch {
      courseData = { raw: result.data };
    }

    res.json({ course: courseData, model: result.model });
  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({ error: 'Failed to generate course.' });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty, numQuestions, count } = req.body;

    const promptText = `Generate ${numQuestions || count || 5} ${difficulty || 'medium'} difficulty quiz questions about "${topic || 'Calculus'}".
Format as JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}`;

    const result = await callGemini({ prompt: promptText, modelTier: 'balanced', maxOutputTokens: 2048 });

    if (!result.success) {
      const questions = Array.from({ length: Math.min(count || numQuestions || 3, 5) }).map((_, i) => ({
        id: `gen-quiz-${Date.now()}-${i + 1}`,
        question: `Generated practice question #${i + 1} on ${topic || 'STEM'}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Standard derivation explanation.',
      }));
      return res.json({ quiz: { questions } });
    }

    let quizData;
    try {
      const jsonMatch = result.data.match(/\{[\s\S]*\}/);
      quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.data };
    } catch {
      quizData = { raw: result.data };
    }

    res.json({ quiz: quizData });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
};
