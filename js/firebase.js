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
// v0.9.158 : App Check ABANDONNÉ. Bug fondamental Firebase x Safari ITP
// (issue firebase/firebase-js-sdk #9135, ouverte mars 2025, non fixée).
// Remplacé par Cloudflare Turnstile (cf. modal.js + functions/index.js).
// Plus de dépendance reCAPTCHA Enterprise → pas d'init côté client.

const _fbAuth      = firebase.auth();
const _fbDb        = firebase.firestore();
const _fbFunctions = firebase.functions ? firebase.app().functions('europe-west1') : null;
const _fbStorage   = firebase.storage ? firebase.storage() : null;
