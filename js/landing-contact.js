// ─── LANDING CONTACT FORM (v0.9.172) ──────────────────────────────────────────
// Form contact anonyme sur la landing page. Appelle la CF `sendContactMessage`
// en mode non-authentifié (juste pseudo + message). Pas de captcha, pas d'email.
// Throttle 60s côté client + 60s/IP côté serveur.

(function () {
  // Init Firebase (clé API publique — sécurité via Firestore rules + CFs)
  firebase.initializeApp({
    apiKey:            'AIzaSyCX5AWqdFyunxpYV9LgaacHU1osXQDbEss',
    authDomain:        'zeldtrade.firebaseapp.com',
    projectId:         'zeldtrade',
    storageBucket:     'zeldtrade.firebasestorage.app',
    messagingSenderId: '356908373821',
    appId:             '1:356908373821:web:4af7d3be51018b56ef1754',
  });
  const fn = firebase.app().functions('europe-west1');

  const form    = document.getElementById('lcForm');
  const success = document.getElementById('lcSuccess');
  const nameEl  = document.getElementById('lcName');
  const msgEl   = document.getElementById('lcMessage');
  const honey   = document.getElementById('lcWebsite');
  const errEl   = document.getElementById('lcError');
  const btn     = document.getElementById('lcSend');

  if (!btn) {
    console.warn('[landing-contact] DOM elements missing — section #contact absente ?');
    return;
  }

  let _lastSubmit = 0;

  async function submit() {
    errEl.textContent = '';
    const name    = (nameEl.value || '').trim().replace(/[\r\n]/g, '').slice(0, 100);
    const message = (msgEl.value  || '').trim().slice(0, 5000);

    // Honeypot
    if (honey && honey.value) {
      _lastSubmit = Date.now();
      form.style.display    = 'none';
      success.style.display = 'block';
      return;
    }
    if (Date.now() - _lastSubmit < 60000) {
      errEl.textContent = 'Merci de patienter 60 secondes avant de renvoyer un message.';
      return;
    }
    if (name.length < 2)    { errEl.textContent = 'Pseudo trop court (min 2 caractères).'; return; }
    if (message.length < 5) { errEl.textContent = 'Message trop court (min 5 caractères).'; return; }

    btn.disabled    = true;
    btn.textContent = 'Envoi…';
    try {
      const callable = fn.httpsCallable('sendContactMessage');
      const res      = await callable({ name, message });
      if (res.data && res.data.ok) {
        _lastSubmit = Date.now();
        form.style.display    = 'none';
        success.style.display = 'block';
      } else {
        throw new Error('Échec d\'envoi');
      }
    } catch (e) {
      console.error('[landing-contact] submit error', e);
      const code = e.code || '';
      const msg  = e.message || '';
      if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
        errEl.textContent = msg;
      } else if (code === 'functions/invalid-argument' || code === 'invalid-argument') {
        errEl.textContent = msg || 'Données invalides.';
      } else {
        errEl.textContent = 'Erreur d\'envoi — réessaie dans un instant.';
      }
      btn.disabled    = false;
      btn.textContent = 'Envoyer →';
    }
  }

  btn.addEventListener('click', submit);
  msgEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  });
})();
