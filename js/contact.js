// ─── WIDGET CONTACT (app, user connecté) ─────────────────────────────────────
// v0.9.172 : refonte ultra-simple. Pseudo récupéré côté serveur depuis
// userEmails/{uid}.username (renseigné à la création du compte). Pas d'email
// demandé, pas de captcha (throttle 60s/uid côté serveur suffit). L'utilisateur
// tape juste son message, click envoyer → Discord webhook côté serveur.

const Contact = (() => {
  let _lastSubmit = 0;

  function init() {
    const bubble = document.getElementById('contactBubble');
    const panel  = document.getElementById('contactPanel');
    const close  = document.getElementById('contactClose');
    const send   = document.getElementById('cSend');

    bubble.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);
      bubble.classList.toggle('active', !isOpen);
    });

    close.addEventListener('click', () => {
      panel.classList.remove('open');
      bubble.classList.remove('active');
    });

    send.addEventListener('click', submitForm);

    document.getElementById('cMessage').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitForm();
    });
  }

  async function submitForm() {
    const message = document.getElementById('cMessage').value.trim().slice(0, 5000);
    const honey   = document.getElementById('cWebsite');
    const error   = document.getElementById('cError');
    const btn     = document.getElementById('cSend');
    const label   = document.getElementById('cSendLabel');

    error.textContent = '';
    // Honeypot — si rempli, c'est un bot. Faux succès sans envoyer.
    if (honey && honey.value) {
      _lastSubmit = Date.now();
      document.getElementById('contactForm').style.display    = 'none';
      document.getElementById('contactSuccess').style.display = 'flex';
      return;
    }
    if (Date.now() - _lastSubmit < 60_000) {
      error.textContent = i18n.t('contact.err.wait') || 'Merci de patienter 60 secondes avant de renvoyer un message.';
      return;
    }
    if (!message || message.length < 5) {
      error.textContent = i18n.t('contact.err.msg') || 'Message trop court (min 5 caractères).';
      return;
    }

    btn.disabled      = true;
    label.textContent = i18n.t('contact.sending') || 'Envoi…';

    try {
      if (!_fbAuth || !_fbAuth.currentUser) {
        error.textContent = 'Connecte-toi pour envoyer un message.';
        btn.disabled      = false;
        label.textContent = i18n.t('contact.send') || 'Envoyer';
        return;
      }
      if (!_fbFunctions) {
        error.textContent = 'Service indisponible — recharge la page.';
        btn.disabled      = false;
        label.textContent = i18n.t('contact.send') || 'Envoyer';
        return;
      }
      const callable = _fbFunctions.httpsCallable('sendContactMessage');
      const result   = await callable({ message });
      if (result.data?.ok) {
        _lastSubmit = Date.now();
        document.getElementById('contactForm').style.display    = 'none';
        document.getElementById('contactSuccess').style.display = 'flex';
      } else {
        throw new Error('Échec d\'envoi');
      }
    } catch (e) {
      const code = e.code || '';
      const msg  = e.message || '';
      if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
        error.textContent = msg;
      } else if (code === 'functions/invalid-argument' || code === 'invalid-argument') {
        error.textContent = msg || 'Message invalide.';
      } else if (code === 'functions/failed-precondition' || code === 'failed-precondition') {
        error.textContent = msg || 'Vérifie ton email avant d\'envoyer un message.';
      } else {
        error.textContent = i18n.t('contact.err.send') || 'Erreur d\'envoi — réessaie.';
      }
      btn.disabled      = false;
      label.textContent = i18n.t('contact.send') || 'Envoyer';
    }
  }

  return { init };
})();
