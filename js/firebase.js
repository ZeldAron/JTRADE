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
// TEMP : init désactivée car reCAPTCHA Enterprise retourne 401 (config à débugger
// dans Google Cloud Console). Tant que c'est cassé, le SDK ne doit PAS essayer
// de récupérer un token sinon ça injecte des erreurs sur tous les appels Firebase.
// À RÉACTIVER une fois la clé reCAPTCHA Enterprise réparée :
//   1. Console GCP > Security > reCAPTCHA Enterprise > vérifier type "Score-based"
//   2. Console Firebase > App Check > Apps > vérifier provider = reCAPTCHA Enterprise + même site key
//   3. IAM > service-{projectNumber}@gcp-sa-firebase-appcheck → rôle "reCAPTCHA Enterprise Agent"
//
// try {
//   if (firebase.appCheck) {
//     firebase.appCheck().activate(
//       new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lfm-N0sAAAAAIV7h-9K6eFnZI7pgy5ynHsvS0-v'),
//       true
//     );
//   }
// } catch (e) { console.warn('[Firebase] App Check init failed:', e); }

const _fbAuth      = firebase.auth();
const _fbDb        = firebase.firestore();
const _fbFunctions = firebase.functions ? firebase.app().functions('europe-west1') : null;
const _fbStorage   = firebase.storage ? firebase.storage() : null;
