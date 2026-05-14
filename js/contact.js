// ─── WIDGET CONTACT ───────────────────────────────────────────────────────────
// Envoi via Cloud Function vers Discord webhook (depuis v0.9.123, jamais exposé client)

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
    const name    = document.getElementById('cName').value.trim().replace(/[\r\n]/g, '').slice(0, 100);
    const email   = document.getElementById('cEmail').value.trim().replace(/[\r\n]/g, '').slice(0, 254);
    const message = document.getElementById('cMessage').value.trim().slice(0, 5000);
    const honey   = document.getElementById('cWebsite');
    const error   = document.getElementById('cError');
    const btn     = document.getElementById('cSend');
    const label   = document.getElementById('cSendLabel');

    error.textContent = '';
    // Honeypot — si rempli, c'est un bot. On feint le succès sans envoyer.
    if (honey && honey.value) {
      _lastSubmit = Date.now();
      document.getElementById('contactForm').style.display    = 'none';
      document.getElementById('contactSuccess').style.display = 'flex';
      return;
    }
    if (Date.now() - _lastSubmit < 60_000)                          { error.textContent = i18n.t('contact.err.wait') || 'Merci de patienter 60 secondes avant de renvoyer un message.'; return; }
    if (!name || name.length < 2)                                    { error.textContent = i18n.t('contact.err.name');  return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))    { error.textContent = i18n.t('contact.err.email'); return; }
    if (!message || message.length < 5)                              { error.textContent = i18n.t('contact.err.msg');   return; }

    // hCaptcha — récupère le token depuis le widget de cette zone
    const captchaToken = document.querySelector('#contactForm [name="h-captcha-response"]')?.value || '';
    if (!captchaToken) {
      error.textContent = 'Merci de cocher la case anti-bot.';
      return;
    }

    btn.disabled      = true;
    label.textContent = i18n.t('contact.sending');

    try {
      // Vérifie qu'un utilisateur est connecté (la CF exige auth)
      if (!_fbAuth || !_fbAuth.currentUser) {
        error.textContent = 'Connecte-toi pour envoyer un message.';
        btn.disabled      = false;
        label.textContent = i18n.t('contact.send');
        return;
      }

      const plan = (() => { try { return Store.isPro() ? 'Pro' : 'Basic'; } catch { return '?'; } })();
      if (!_fbFunctions) {
        error.textContent = 'Service indisponible — recharge la page.';
        btn.disabled      = false;
        label.textContent = i18n.t('contact.send');
        return;
      }
      const callable = _fbFunctions.httpsCallable('sendContactMessage');
      const result   = await callable({ name, email, message, plan, captchaToken });
      if (result.data?.ok) {
        _lastSubmit = Date.now();
        document.getElementById('contactForm').style.display    = 'none';
        document.getElementById('contactSuccess').style.display = 'flex';
      } else {
        throw new Error('Échec d\'envoi');
      }
    } catch (e) {
      // Reset hCaptcha pour permettre un nouvel essai
      try {
        const widget = document.querySelector('#contactForm .h-captcha');
        if (widget && typeof hcaptcha !== 'undefined' && widget.dataset.hcaptchaWidgetId !== undefined) {
          hcaptcha.reset(widget.dataset.hcaptchaWidgetId);
        }
      } catch {}
      const code = e.code || '';
      const msg  = e.message || '';
      if (code === 'functions/resource-exhausted' || code === 'resource-exhausted') {
        error.textContent = msg;
      } else if (code === 'functions/invalid-argument' || code === 'invalid-argument') {
        error.textContent = 'Champ invalide : ' + msg;
      } else {
        error.textContent = i18n.t('contact.err.send');
      }
      btn.disabled      = false;
      label.textContent = i18n.t('contact.send');
    }
  }

  return { init };
})();
