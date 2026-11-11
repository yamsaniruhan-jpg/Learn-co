const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || 'demo-key');

const MODELS = {
  fast: 'gemini-2.0-flash',
  balanced: 'gemini-2.0-flash',
  powerful: 'gemini-2.5-pro-preview-05-06',
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function callGemini({
  prompt,
  modelTier = 'balanced',
  maxRetries = 3,
  temperature = 0.7,
  maxOutputTokens = 2048,
  systemInstruction = null,
}) {
  let lastError = null;
  const modelOrder = [MODELS[modelTier] || MODELS.balanced];

  if (modelTier === 'powerful') {
    modelOrder.push(MODELS.balanced, MODELS.fast);
  } else if (modelTier === 'balanced') {
    modelOrder.push(MODELS.fast);
  }

  for (const modelName of modelOrder) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          safetySettings: SAFETY_SETTINGS,
          ...(systemInstruction && { systemInstruction }),
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens, topP: 0.95, topK: 40 },
        });

        const response = result.response;

        if (response.promptFeedback?.blockReason) {
          return { success: false, error: 'Content blocked by safety filters.', code: 'SAFETY_BLOCK' };
        }

        const text = response.text();
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from model');
        }

        return { success: true, data: text, model: modelName, usage: response.usageMetadata || null, attempts: attempt };

      } catch (error) {
        lastError = error;
        console.warn(`Gemini attempt ${attempt}/${maxRetries} failed (${modelName}):`, error.message);

        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('PERMISSION_DENIED')) {
          return { success: false, error: 'AI service configuration error.', code: 'CONFIG_ERROR' };
        }

        if (error.message?.includes('QUOTA_EXCEEDED') || error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 500 + Math.random() * 250;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  return { success: false, error: 'AI service temporarily unavailable.', code: 'SERVICE_UNAVAILABLE', details: lastError?.message };
}

async function* streamGemini({ prompt, modelTier = 'fast', systemInstruction = null }) {
  try {
    const model = genAI.getGenerativeModel({
      model: MODELS[modelTier] || MODELS.fast,
      safetySettings: SAFETY_SETTINGS,
      ...(systemInstruction && { systemInstruction }),
    });

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    console.error('Stream error:', error);
    yield '\n\n[Error: Response interrupted. Please try again.]';
  }
}

module.exports = { callGemini, streamGemini, MODELS };
