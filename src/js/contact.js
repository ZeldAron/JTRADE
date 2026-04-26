// ─── WIDGET CONTACT ───────────────────────────────────────────────────────────
// Bulle de contact flottante (bas droite)
// Envoi via Web3Forms (gratuit, sans serveur) — clé configurée dans Réglages

const Contact = (() => {
  const WEB3FORMS_KEY = 'fad3c1d4-8c0a-4d93-8e0c-a2b6e1c5f7d2'; // clé publique Web3Forms

  function init() {
    // Injecte le HTML du widget dans le body
    const wrap = document.createElement('div');
    wrap.id = 'contactWidget';
    wrap.innerHTML = `
      <button class="contact-bubble" id="contactBubble" title="Nous contacter">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="contact-bubble-dot"></span>
      </button>

      <div class="contact-panel" id="contactPanel">
        <div class="contact-panel-header">
          <div class="contact-panel-title">
            <div class="contact-avatar">J</div>
            <div>
              <div class="contact-name">JTRADE Support</div>
              <div class="contact-status"><span class="contact-online-dot"></span> En ligne</div>
            </div>
          </div>
          <button class="contact-close" id="contactClose">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="contact-body">
          <div class="contact-intro">
            Bonjour 👋 Une question ? Un bug ? On vous répond rapidement.
          </div>
          <div class="contact-form" id="contactForm">
            <div class="contact-field">
              <label>Votre nom</label>
              <input type="text" id="cName" placeholder="Aaron" autocomplete="name" />
            </div>
            <div class="contact-field">
              <label>Votre email</label>
              <input type="email" id="cEmail" placeholder="vous@email.com" autocomplete="email" />
            </div>
            <div class="contact-field">
              <label>Message</label>
              <textarea id="cMessage" rows="4" placeholder="Décrivez votre question ou problème…"></textarea>
            </div>
            <div class="contact-error" id="cError"></div>
            <button class="contact-send" id="cSend">
              <span id="cSendLabel">Envoyer</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div class="contact-success" id="contactSuccess" style="display:none">
            <div class="contact-success-icon">✓</div>
            <div class="contact-success-title">Message envoyé !</div>
            <div class="contact-success-sub">On vous répond dans les plus brefs délais.</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    bindEvents();
  }

  function bindEvents() {
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

    send.addEventListener('click', () => submitForm());

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

    if (!name)    { error.textContent = 'Entrez votre nom.'; return; }
    if (!email || !email.includes('@')) { error.textContent = 'Email invalide.'; return; }
    if (!message) { error.textContent = 'Le message est vide.'; return; }

    // Récupère la clé Web3Forms depuis les réglages (configurée par l'admin)
    let apiKey = WEB3FORMS_KEY;
    try {
      const s = Store.getSettings();
      if (s.web3formsKey) apiKey = s.web3formsKey;
    } catch {}

    btn.disabled = true;
    label.textContent = 'Envoi…';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: apiKey,
          subject: `[JTRADE] Message de ${name}`,
          from_name: name,
          email: email,
          message: message,
          plan: (() => { try { return Store.isPro() ? 'Pro' : 'Basic'; } catch { return '?'; } })(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('contactForm').style.display = 'none';
        document.getElementById('contactSuccess').style.display = 'flex';
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }
    } catch (e) {
      error.textContent = 'Envoi échoué : ' + e.message;
      btn.disabled = false;
      label.textContent = 'Envoyer';
    }
  }

  return { init };
})();
