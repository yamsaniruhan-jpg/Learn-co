const { callGemini } = require('./geminiService');
const admin = require('firebase-admin');

let db = null;
try {
  if (admin.apps.length) {
    db = admin.firestore();
  }
} catch {
  db = null;
}

function getDb() {
  if (!db && admin.apps.length) {
    try {
      db = admin.firestore();
    } catch {
      db = null;
    }
  }
  return db;
}

const MEMORY_LIMIT = 20;

/**
 * Fetch user's learning context from Firestore
 */
async function buildUserContext(uid) {
  const firestore = getDb();
  if (!firestore) return 'No context available.';

  try {
    const [coursesSnap, progressSnap, profileSnap] = await Promise.all([
      firestore.collection('users').doc(uid).collection('courses').limit(5).get().catch(() => ({ docs: [] })),
      firestore.collection('users').doc(uid).collection('progress').limit(10).get().catch(() => ({ docs: [] })),
      firestore.collection('users').doc(uid).get().catch(() => ({ exists: false, data: () => ({}) })),
    ]);

    const courses = coursesSnap.docs?.map(d => d.data().title).filter(Boolean) || [];
    const recentTopics = progressSnap.docs?.map(d => d.data().topic).filter(Boolean) || [];
    const profile = profileSnap.exists ? profileSnap.data() : {};

    let context = `User profile: ${profile.name || 'Learner'}, level: ${profile.level || 'beginner'}, goals: ${profile.goals || 'STEM mastery'}.`;

    if (courses.length > 0) {
      context += ` They are studying: ${courses.join(', ')}.`;
    }
    if (recentTopics.length > 0) {
      context += ` Recent topics: ${recentTopics.join(', ')}.`;
    }

    return context;
  } catch (error) {
    console.warn('Context build warning:', error.message);
    return 'No context available.';
  }
}

/**
 * Fetch recent conversation history for memory
 */
async function getConversationHistory(uid, limit = MEMORY_LIMIT) {
  const firestore = getDb();
  if (!firestore) return [];

  try {
    const historySnap = await firestore
      .collection('users').doc(uid)
      .collection('copilotHistory')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return historySnap.docs
      .map(d => d.data())
      .reverse()
      .map(entry => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content || entry.userMessage || '' }],
      }));
  } catch (error) {
    console.warn('History fetch warning:', error.message);
    return [];
  }
}

/**
 * Save interaction to Firestore
 */
async function saveInteraction(uid, userMessage, aiResponse, model, feedback = null) {
  const firestore = getDb();
  if (!firestore) return;

  try {
    await firestore.collection('users').doc(uid).collection('copilotHistory').add({
      role: 'assistant',
      userMessage,
      content: aiResponse,
      model,
      feedback,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Prune old history (keep last 200)
    const oldDocs = await firestore
      .collection('users').doc(uid)
      .collection('copilotHistory')
      .orderBy('timestamp', 'desc')
      .offset(200)
      .get();

    if (oldDocs.docs && oldDocs.docs.length > 0) {
      const batch = firestore.batch();
      oldDocs.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (error) {
    console.warn('Save interaction warning:', error.message);
  }
}

/**
 * Main chat function with full context + memory
 */
async function chat(uid, message, mode = 'general') {
  const [userContext, history] = await Promise.all([
    buildUserContext(uid),
    getConversationHistory(uid),
  ]);

  const modePrompts = {
    general: 'You are LearnCo\'s Omni Copilot. Help with any educational question.',
    creator: 'You are a course creation expert. Help the user build better educational content.',
    learner: 'You are a patient tutor. Explain concepts clearly with examples.',
    mentor: 'You are a career mentor. Give practical, actionable advice.',
  };

  const systemInstruction = `${modePrompts[mode] || modePrompts.general}
User context: ${userContext}
Rules:
- Be concise but thorough
- Use markdown formatting
- Provide examples when helpful
- If unsure, say so — never fabricate facts
- Reference the user's courses when relevant`;

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const result = await callGeminiWithContext(contents, systemInstruction);

  if (result.success) {
    await saveInteraction(uid, message, result.data, result.model);
  } else {
    // Socratic pedagogical fallback
    result.data = `### Socratic Diagnostic Guidance\n\nRegarding: "${message.slice(0, 100)}"\n\n1. What is the fundamental conservation law or invariant at play?\n2. What boundary conditions limit this state?`;
    result.success = true;
    result.model = 'socratic-fallback';
  }

  return result;
}

/**
 * Call Gemini with full conversation history
 */
async function callGeminiWithContext(contents, systemInstruction) {
  const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'AI key unconfigured.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const chatSession = model.startChat({ history: contents.slice(0, -1) });
    const lastMessage = contents[contents.length - 1].parts[0].text;
    const result = await chatSession.sendMessage(lastMessage);
    const text = result.response.text();

    return { success: true, data: text, model: 'gemini-2.0-flash' };
  } catch (error) {
    console.warn('Context chat warning:', error.message);
    return { success: false, error: 'AI service error.', code: 'CHAT_ERROR' };
  }
}

module.exports = { chat, saveInteraction, buildUserContext };
