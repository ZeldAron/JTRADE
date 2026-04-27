// ─── WIDGET CONTACT ───────────────────────────────────────────────────────────

const Contact = (() => {
  const WEB3FORMS_KEY = '6586bd2e-5bce-45ff-9c4f-92730958a80c';

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
    const name    = document.getElementById('cName').value.trim();
    const email   = document.getElementById('cEmail').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    const error   = document.getElementById('cError');
    const btn     = document.getElementById('cSend');
    const label   = document.getElementById('cSendLabel');

    error.textContent = '';
    if (!name)                         { error.textContent = i18n.t('contact.err.name');  return; }
    if (!email || !email.includes('@')) { error.textContent = i18n.t('contact.err.email'); return; }
    if (!message)                      { error.textContent = i18n.t('contact.err.msg');   return; }

    btn.disabled      = true;
    label.textContent = i18n.t('contact.sending');

    try {
      const plan = (() => { try { return Store.isPro() ? 'Pro' : 'Basic'; } catch { return '?'; } })();
      const res  = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject:    `[JTRADE] Message de ${name}`,
          from_name:  name,
          email,
          message,
          plan,
        }),
      });
      const data = await res.json();
      if (data.success) {
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
