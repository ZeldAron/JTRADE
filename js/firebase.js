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

// ─── APP CHECK (reCAPTCHA Enterprise — anti-bot pour toutes les requêtes Firebase) ──
try {
  if (firebase.appCheck) {
    firebase.appCheck().activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lfm-N0sAAAAAIV7h-9K6eFnZI7pgy5ynHsvS0-v'),
      true // auto-refresh tokens
    );
  }
} catch (e) {
  console.warn('[Firebase] App Check init failed:', e);
}

const _fbAuth      = firebase.auth();
const _fbDb        = firebase.firestore();
const _fbFunctions = firebase.functions ? firebase.app().functions('europe-west1') : null;
