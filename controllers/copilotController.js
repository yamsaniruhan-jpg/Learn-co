const copilotService = require('../services/copilotService');

exports.chat = async (req, res) => {
  try {
    const { message, prompt, mode } = req.body;
    const userMessage = message || prompt;
    const uid = req.user?.uid || req.user?.id || 'guest-user';

    const result = await copilotService.chat(uid, userMessage, mode);

    if (!result.success) {
      return res.status(503).json(result);
    }

    res.json({ response: result.data, reply: result.data, model: result.model });
  } catch (error) {
    console.error('Copilot controller error:', error);
    res.status(500).json({ error: 'Internal error.' });
  }
};

exports.feedback = async (req, res) => {
  try {
    const { interactionId, rating } = req.body; // rating: 'up' | 'down'
    const uid = req.user?.uid || req.user?.id || 'guest-user';

    const admin = require('../server/services/firebaseAdminCompat.cjs');
    if (admin.apps.length) {
      await admin.firestore()
        .collection('users').doc(uid)
        .collection('copilotHistory').doc(interactionId)
        .update({ feedback: rating });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback.' });
  }
};

exports.history = async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id || 'guest-user';
    const admin = require('../server/services/firebaseAdminCompat.cjs');

    if (admin.apps.length) {
      const snap = await admin.firestore()
        .collection('users').doc(uid)
        .collection('copilotHistory')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ history });
    }

    res.json({ history: [] });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
};
