// controllers/aiController.js
const { GoogleGenAI } = require('@google/genai');

let aiClient = null;
function getGemini() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const aiController = {
  copilotChat: async (req, res) => {
    try {
      const prompt = req.body.prompt || req.body.message;
      const { mode = 'socratic_hint', context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const ai = getGemini();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${context ? `[Context]: ${context}\n\n` : ''}[Query]: ${prompt}`,
            config: {
              systemInstruction: 'You are the Learn.co Socratic Copilot. Guide the learner with reasoning and diagnostic hints.',
              temperature: 0.3,
            },
          });
          if (response.text) {
            return res.json({ reply: response.text.trim(), mode, context });
          }
        } catch (err) {
          console.warn('AI copilot Gemini call failed, using fallback:', err.message);
        }
      }

      res.json({
        reply: `### Socratic Diagnostic Guidance\n\nRegarding: "${prompt.slice(0, 100)}"\n\n1. What fundamental invariant applies here?\n2. What is the boundary state?`,
        mode,
        context,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Copilot chat failed.' });
    }
  },

  generateCourse: async (req, res) => {
    try {
      const { topic, subject = 'STEM' } = req.body;
      res.json({
        success: true,
        course: {
          title: topic || 'Synthesized STEM Course',
          subject,
          modules: [
            { title: 'Module 1: Ground-Truth Foundations', content: 'Core definitions and first principles.' },
            { title: 'Module 2: Advanced Applications & Derivations', content: 'Step-by-step mathematical proofs.' },
          ],
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Course generation failed.' });
    }
  },

  generateQuiz: async (req, res) => {
    try {
      const { subject = 'Math', topic = 'Calculus', difficulty = 'medium', count = 3 } = req.body;
      const questions = Array.from({ length: Math.min(count || 3, 5) }).map((_, i) => ({
        id: `quiz-${Date.now()}-${i + 1}`,
        questionText: `Practice question #${i + 1} on ${topic} (${difficulty})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: `Explanation for question #${i + 1} based on first principles.`,
      }));
      res.json({ success: true, subject, topic, questions });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Quiz generation failed.' });
    }
  },
};

module.exports = aiController;
