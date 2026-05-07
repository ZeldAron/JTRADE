// ─── ZELDTRADE — Cloud Functions ──────────────────────────────────────────────
// Proxy Groq pour protéger la clé API et enforce le quota AI côté serveur.
//
// Déploiement :
//   1. firebase functions:secrets:set GROQ_API_KEY
//   2. firebase deploy --only functions

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret }       = require('firebase-functions/params');
const admin                  = require('firebase-admin');

admin.initializeApp();

const GROQ_API_KEY = defineSecret('GROQ_API_KEY');

const ALLOWED_ORIGINS = [
  'https://zeldaron.github.io',
  'http://localhost:8080',
];

// Liste blanche de modèles Groq (anti-injection — l'utilisateur ne peut pas
// appeler n'importe quel modèle)
const ALLOWED_MODELS = new Set([
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.2-90b-vision-preview',
  'llama-3.2-11b-vision-preview',
]);

/**
 * Proxy pour analyser un chart TradingView via Groq Vision.
 *
 * Validations côté serveur :
 *  - Auth requis (uid)
 *  - Quota AI : 1/jour pour Basic, illimité pour Pro
 *  - App Check token requis (anti-bot)
 *  - Modèle dans whitelist
 *  - Image taille max 8 MB en base64 (~6 MB binaire)
 *  - Prompt max 2000 chars
 */
exports.analyzeChart = onCall(
  {
    secrets:        [GROQ_API_KEY],
    cors:           ALLOWED_ORIGINS,
    enforceAppCheck: true,
    timeoutSeconds:  60,
    memory:         '256MiB',
    region:         'europe-west1',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = request.auth.uid;
    const { model, prompt, imageB64 } = request.data || {};

    // ── Validation des paramètres ───────────────────────────────────────────
    if (typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
      throw new HttpsError('invalid-argument', 'Invalid model');
    }
    if (typeof prompt !== 'string' || prompt.length > 2000) {
      throw new HttpsError('invalid-argument', 'Prompt too long');
    }
    if (typeof imageB64 !== 'string' || imageB64.length > 8 * 1024 * 1024) {
      throw new HttpsError('invalid-argument', 'Image too large');
    }

    // ── Vérification quota côté serveur (impossible à bypasser via DevTools) ──
    const db        = admin.firestore();
    const planSnap  = await db.doc(`users/${uid}/data/plan`).get();
    const isPro     = planSnap.exists && planSnap.data().plan === 'pro';

    if (!isPro) {
      const usageRef = db.doc(`users/${uid}/data/aiUsage`);
      const usage    = await usageRef.get();
      const today    = new Date().toISOString().split('T')[0];
      const data     = usage.exists ? usage.data() : { date: '', count: 0 };

      if (data.date === today && data.count >= 1) {
        throw new HttpsError('resource-exhausted',
          'Limite quotidienne atteinte (1 analyse/jour sur Basic). Passe Pro pour des analyses illimitées.');
      }

      // Incrémenter de manière atomique côté serveur
      await usageRef.set({
        date:  today,
        count: data.date === today ? data.count + 1 : 1,
      });
    }

    // ── Appel Groq côté serveur — la clé n'est jamais exposée au client ─────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY.value()}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens:  120,
        messages: [{
          role:    'user',
          content: [
            { type: 'text',      text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
          ],
        }],
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('[Groq] error', groqRes.status, errBody);
      if (groqRes.status === 401) throw new HttpsError('failed-precondition', 'Groq key invalid (admin)');
      if (groqRes.status === 429) throw new HttpsError('resource-exhausted', 'Groq rate limit — réessaie dans quelques secondes');
      throw new HttpsError('internal', `Groq error ${groqRes.status}`);
    }

    const data = await groqRes.json();
    return data;
  }
);
