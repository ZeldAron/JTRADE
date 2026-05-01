// ─── WIDGET CONTACT ───────────────────────────────────────────────────────────

const Contact = (() => {
  const WEB3FORMS_KEY = '465a3d27-6989-4226-8bb1-c5e70e9704c5';
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
    const name    = document.getElementById('cName').value.trim().replace(/[\r\n]/g, '');
    const email   = document.getElementById('cEmail').value.trim().replace(/[\r\n]/g, '');
    const message = document.getElementById('cMessage').value.trim();
    const error   = document.getElementById('cError');
    const btn     = document.getElementById('cSend');
    const label   = document.getElementById('cSendLabel');

    error.textContent = '';
    if (Date.now() - _lastSubmit < 60_000)                          { error.textContent = i18n.t('contact.err.wait') || 'Merci de patienter 60 secondes avant de renvoyer un message.'; return; }
    if (!name)                                                       { error.textContent = i18n.t('contact.err.name');  return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))    { error.textContent = i18n.t('contact.err.email'); return; }
    if (!message)                                                    { error.textContent = i18n.t('contact.err.msg');   return; }

    btn.disabled      = true;
    label.textContent = i18n.t('contact.sending');

    try {
      const plan = (() => { try { return Store.isPro() ? 'Pro' : 'Basic'; } catch { return '?'; } })();
      const res  = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject:    `[ZeldTrade] Message de ${name}`,
          from_name:  name,
          email,
          message,
          plan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        _lastSubmit = Date.now();
        document.getElementById('contactForm').style.display    = 'none';
        document.getElementById('contactSuccess').style.display = 'flex';
      } else {
        throw new Error(data.message || i18n.t('contact.err.server'));
      }
    } catch (e) {
      error.textContent = i18n.t('contact.err.send') + e.message;
      btn.disabled      = false;
      label.textContent = i18n.t('contact.send');
    }
  }

  return { init };
})();
