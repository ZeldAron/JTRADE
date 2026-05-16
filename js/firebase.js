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
// v0.9.154 : init robuste avec retry — fix race condition Safari où
// `firebase.appCheck` n'est pas encore défini au 1er passage (script
// firebase-app-check-compat.js pas encore évalué malgré le chargement sync).
//
// Config GCP : clé reCAPTCHA Enterprise 6Lfm-N0sAAAAAIV7h-9K6eFnZI7pgy5ynHsvS0-v
// (domaines zeldtrade.com + zeldtrade.web.app + zeldaron.github.io) + IAM
// service-356908373821@gcp-sa-firebaseappcheck.iam.gserviceaccount.com
// avec rôle "reCAPTCHA Enterprise Agent".
window._fbAppCheckReady = false;
function _initAppCheck() {
  if (typeof firebase === 'undefined' || !firebase.appCheck || !firebase.appCheck.ReCaptchaEnterpriseProvider) {
    return false;  // SDK pas encore prêt
  }
  try {
    firebase.appCheck().activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6Lfm-N0sAAAAAIV7h-9K6eFnZI7pgy5ynHsvS0-v'),
      true  // isTokenAutoRefreshEnabled
    );
    window._fbAppCheckReady = true;
    console.info('[Firebase] App Check enabled (reCAPTCHA Enterprise)');
    return true;
  } catch (e) {
    console.warn('[Firebase] App Check init failed:', e && e.message);
    return false;
  }
}
// Tente immédiatement
if (!_initAppCheck()) {
  // Retry sur DOMContentLoaded si pas encore ready, sinon polling court
  const _retryAppCheck = () => {
    if (_initAppCheck()) return;
    // Dernier essai : 200ms après pour laisser le SDK finir de s'enregistrer
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
