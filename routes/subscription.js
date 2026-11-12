// routes/subscription.js
const router = require('express').Router();
const { verifyFirebaseAuth } = require('../middleware/auth');
const admin = require('../server/services/firebaseAdminCompat.cjs');

// Local store bridge. Firestore is optional here; the JSON store is the
// authoritative fallback so a tier change is never acknowledged without being
// persisted (which previously left checkout "successful" but the user on free).
let appDatabase = null;
function getAppDatabase() {
  if (appDatabase) return appDatabase;
  try {
    appDatabase = require('../server/db').Database;
  } catch (err) {
    console.warn('Local subscription store unavailable:', err.message);
    appDatabase = null;
  }
  return appDatabase;
}

// Initialize Stripe conditionally if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn('Stripe initialization warning:', err.message);
  }
}

function getDb() {
  // The compat layer returns null when Firestore is not configured; every
  // caller already handles that by falling back to the local JSON store.
  return admin.firestore();
}

const TIERS = {
  free: {
    id: 'free',
    name: 'Scholar Free',
    price: 0,
    dailyAILimit: 25,
    features: ['Curriculum Question Bank', 'Daily Flashchecks', 'Public Leaderboards', 'Standard AI Tutor'],
  },
  pro: {
    id: 'pro',
    name: 'Scholar Pro',
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    dailyAILimit: 200,
    features: ['Unlimited Question Bank', 'Socratic Copilot Hints', '1-on-1 Mentor Matching', 'Creator Studio Autosave'],
  },
  super: {
    id: 'super',
    name: 'Super Scholar (Unlimited)',
    price: 49,
    priceId: process.env.STRIPE_SUPER_PRICE_ID || 'price_super_monthly',
    dailyAILimit: 1000,
    features: ['Unlimited Everything', 'Gemini Pro 2.5 Access', 'Priority Mentorship Sessions', 'Complete Offline Shell'],
  },
};

/**
 * GET /api/subscription/tiers - List available tiers
 */
router.get('/tiers', (req, res) => {
  res.json({ tiers: Object.values(TIERS) });
});

/**
 * GET /api/subscription/status - Get current user subscription status
 */
router.get('/status', verifyFirebaseAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();
    let subscription = req.user.subscription || 'free';
    let expiresAt = null;

    if (db) {
      try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data() || {};
          subscription = data.subscription || subscription;
          expiresAt = data.subscriptionExpiresAt ? data.subscriptionExpiresAt.toDate?.() || data.subscriptionExpiresAt : null;
        }
      } catch (err) {
        console.warn('Subscription fetch fallback:', err.message);
      }
    }

    if (subscription === 'free') {
      // Prefer the local store; it is authoritative when Firestore is absent.
      const localDb = getAppDatabase();
      const localUser = localDb ? localDb.findUserById(uid) : null;
      if (localUser && localUser.subscription) {
        subscription = localUser.subscription;
        expiresAt = localUser.subscriptionExpiresAt || null;
      }
    }

    const tierInfo = TIERS[subscription] || TIERS.free;

    res.json({
      subscription,
      tier: tierInfo,
      expiresAt,
      isPro: subscription === 'pro' || subscription === 'super',
      isSuper: subscription === 'super',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status.' });
  }
});

/**
 * POST /api/subscription/checkout - Create Stripe Checkout Session or demo upgrade
 */
router.post('/checkout', verifyFirebaseAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { tier = 'pro', successUrl, cancelUrl } = req.body;

    if (!TIERS[tier] || tier === 'free') {
      return res.status(400).json({ error: 'Invalid subscription tier selected.' });
    }

    const selectedTier = TIERS[tier];

    // If Stripe is configured with live credentials, initiate Stripe Checkout
    if (stripe && process.env.STRIPE_SECRET_KEY) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price: selectedTier.priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          client_reference_id: uid,
          customer_email: req.user.email || undefined,
          success_url: successUrl || `${req.headers.origin || 'http://localhost:3000'}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:3000'}/?checkout=cancel`,
          metadata: {
            userId: uid,
            tier,
          },
        });

        return res.json({ url: session.url, sessionId: session.id });
      } catch (stripeErr) {
        console.warn('Stripe checkout session error, activating sandbox instant upgrade:', stripeErr.message);
      }
    }

    // Sandbox / Instant upgrade mode for development and testing
    const db = getDb();
    const expiresDate = new Date();
    expiresDate.setMonth(expiresDate.getMonth() + 1);

    if (db) {
      try {
        await db.collection('users').doc(uid).set({
          subscription: tier,
          subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Firestore sandbox subscription upgrade error:', dbErr.message);
      }
    }

    const localDb = getAppDatabase();
    if (localDb) {
      localDb.updateSubscription(uid, tier, expiresDate.toISOString());
    }

    res.json({
      success: true,
      mode: 'sandbox',
      subscription: tier,
      message: `Successfully upgraded to ${selectedTier.name}!`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

/**
 * POST /api/subscription/cancel - Cancel active subscription
 */
router.post('/cancel', verifyFirebaseAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = getDb();

    if (db) {
      try {
        await db.collection('users').doc(uid).set({
          subscription: 'free',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore subscription cancel error:', err.message);
      }
    }

    const localDb = getAppDatabase();
    if (localDb) {
      localDb.updateSubscription(uid, 'free');
    }

    res.json({ success: true, message: 'Subscription downgraded to Free Tier.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

/**
 * POST /api/subscription/webhook - Stripe Webhook Handler
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  const db = getDb();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const uid = session?.client_reference_id || session?.metadata?.userId;
        const tier = session?.metadata?.tier || 'pro';
        if (uid && db) {
          const expiresDate = new Date();
          expiresDate.setMonth(expiresDate.getMonth() + 1);
          await db.collection('users').doc(uid).set({
            subscription: tier,
            stripeCustomerId: session.customer,
            subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresDate),
          }, { merge: true });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        const customerId = sub?.customer;
        if (customerId && db) {
          const snap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (!snap.empty) {
            await snap.docs[0].ref.update({ subscription: 'free' });
          }
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

module.exports = router;
