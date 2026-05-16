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
// v0.9.155 : MIGRATION reCAPTCHA Enterprise → reCAPTCHA v3.
//
// Pourquoi : reCAPTCHA Enterprise + Safari ITP = `appCheck/recaptcha-error`
// systématique (issue firebase/firebase-js-sdk#9135 ouverte mars 2025, non
// fixée). reCAPTCHA v3 est plus mature, compatible Safari/Firefox/Chrome,
// largement suffisant pour notre cas d'usage (anti-bot CFs).
//
// Config Firebase Console > App Check > Apps : zeldtrade-web a maintenant
// 2 providers enregistrés (reCAPTCHA v3 + Enterprise). Le client utilise V3.
//
// Site key reCAPTCHA v3 : 6Lf2Ou0sAAAAAA7xSOr8E6xHHXnDFfBxIVG-P7-E
// (créée sur https://www.google.com/recaptcha/admin/create, domaines
// zeldtrade.com + zeldtrade.web.app + zeldaron.github.io)
//
// Retry logic conservée pour gérer la race condition où firebase.appCheck
// n'est pas encore disponible au 1er passage (script chargé sync mais
// évalué async sur Safari).

window._fbAppCheckReady = false;

function _initAppCheck() {
  if (typeof firebase === 'undefined' || !firebase.appCheck || !firebase.appCheck.ReCaptchaV3Provider) {
    return false;  // SDK pas encore prêt
  }
  try {
    firebase.appCheck().activate(
      new firebase.appCheck.ReCaptchaV3Provider('6Lf2Ou0sAAAAAA7xSOr8E6xHHXnDFfBxIVG-P7-E'),
      true  // isTokenAutoRefreshEnabled
    );
    window._fbAppCheckReady = true;
    console.info('[Firebase] App Check enabled (reCAPTCHA v3)');
    return true;
  } catch (e) {
    console.warn('[Firebase] App Check init failed:', e && e.message);
    return false;
  }
}

// Tente immédiatement
if (!_initAppCheck()) {
  const _retryAppCheck = () => {
    if (_initAppCheck()) return;
    setTimeout(_initAppCheck, 200);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _retryAppCheck, { once: true });
  } else {
    setTimeout(_retryAppCheck, 50);
  }
}

const _fbAuth      = firebase.auth();
const _fbDb        = firebase.firestore();
const _fbFunctions = firebase.functions ? firebase.app().functions('europe-west1') : null;
const _fbStorage   = firebase.storage ? firebase.storage() : null;
