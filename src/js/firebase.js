// ─── FIREBASE INIT ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyCX5AWqdFyunxpYV9LgaacHU1osXQDbEss',
  authDomain:        'zeldtrade.firebaseapp.com',
  projectId:         'zeldtrade',
  storageBucket:     'zeldtrade.firebasestorage.app',
  messagingSenderId: '356908373821',
  appId:             '1:356908373821:web:4af7d3be51018b56ef1754',
};

const _fbApp = firebase.initializeApp(firebaseConfig);

// ─── APP CHECK ────────────────────────────────────────────────────────────────
// v0.9.151 : tentative de réactivation → bug `r.render is not a function` dans
// recaptcha.ts:146 sur Safari → App Check token KO → Firestore "access control
// checks" + login bloqué. ROLLBACK le 2026-05-16, à re-investiguer côté SDK.
//
// Hypothèses de la cause :
//   - Conflit hCaptcha (signup form) ↔ reCAPTCHA Enterprise (App Check) qui
//     loadent leur grecaptcha script en parallèle
//   - Safari Intelligent Tracking Prevention bloque le widget invisible
//   - Firebase SDK v9 compat layer + ReCaptchaEnterpriseProvider incompatibilité
//
// La config GCP est en place (clé reCAPTCHA Enterprise + domaines + IAM role) —
// rien à refaire côté console quand on retentera. Juste fixer le code client.
//
// try {
//   if (firebase.appCheck) {
//     firebase.appCheck().activate(
//       new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lfm-N0sAAAAAIV7h-9K6eFnZI7pgy5ynHsvS0-v'),
//       true
//     );
//     console.info('[Firebase] App Check enabled (reCAPTCHA Enterprise)');
//   }
// } catch (e) { console.warn('[Firebase] App Check init failed:', e); }

const _fbAuth      = firebase.auth();
const _fbDb        = firebase.firestore();
const _fbFunctions = firebase.functions ? firebase.app().functions('europe-west1') : null;
const _fbStorage   = firebase.storage ? firebase.storage() : null;
