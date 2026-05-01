// ─── PAGE OFFRES ──────────────────────────────────────────────────────────────

UI.renderOffers = function () {
  const el   = document.getElementById('offersContent');
  const plan = Store.getPlanInfo();
  const pro  = plan.plan === 'pro';
  const t    = k => i18n.t(k);
  const isEn = i18n.getLang() === 'en';

  const activatedDate = pro && plan.activatedAt
    ? new Date(plan.activatedAt).toLocaleDateString(i18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Status banner (Pro active) ──────────────────────────────────────────────
  const statusBanner = pro
    ? `<div class="pro-active-banner">
        <div class="pro-active-icon">✦</div>
        <div>
          <div class="pro-active-title">${isEn ? 'Pro plan active' : 'Plan Pro actif'}</div>
          <div class="pro-active-sub">${isEn ? 'Activated on' : 'Activé le'} ${activatedDate} — ${isEn ? 'full access to all features' : 'accès complet à toutes les fonctionnalités'}</div>
        </div>
      </div>`
    : '';

  // ── Feature comparison rows ─────────────────────────────────────────────────
  const compareRows = [
    { feature: isEn ? 'Unlimited trading journal'     : 'Journal de trading illimité',      basic: '✓', proVal: '✓' },
    { feature: isEn ? 'Dashboard & performance stats' : 'Dashboard & stats de performances', basic: '✓', proVal: '✓' },
    { feature: isEn ? 'Prop Firm rules (Apex, FTMO…)' : 'Règles Prop Firm (Apex, FTMO…)',   basic: '✓', proVal: '✓' },
    { feature: isEn ? 'Calendar & tax calculator'     : 'Calendrier & simulateur fiscal',    basic: '✓', proVal: '✓' },
    { feature: isEn ? 'Trading accounts'              : 'Comptes de trading',                basic: '1', proVal: '∞' },
    { feature: isEn ? 'AI analyses (Groq Vision)'     : 'Analyses IA (Groq Vision)',         basic: isEn ? '1/day' : '1/jour', proVal: '∞' },
    { feature: isEn ? 'Analytics by session & hour'   : 'Analytics par session & heure',     basic: '✗', proVal: '✓' },
    { feature: isEn ? 'Account groups'                : 'Groupes de comptes',                basic: '✗', proVal: '✓' },
    { feature: isEn ? 'Priority support'              : 'Support prioritaire',               basic: '✗', proVal: '✓' },
    { feature: isEn ? 'Future features'               : 'Futures fonctionnalités',           basic: '✗', proVal: '✓' },
  ].map(r => {
    const basicColor = r.basic === '✓' ? 'var(--green)' : r.basic === '✗' ? 'var(--muted)' : 'var(--amber)';
    const proColor   = r.proVal === '✓' || r.proVal === '∞' ? '#a78bfa' : 'var(--muted)';
    return `<div class="offer-compare-row">
      <span class="offer-compare-feature">${r.feature}</span>
      <span class="offer-compare-basic" style="color:${basicColor}">${r.basic}</span>
      <span class="offer-compare-pro"   style="color:${proColor}">${r.proVal}</span>
    </div>`;
  }).join('');

  // ── Activation section ─────────────────────────────────────────────────────
  const activateSection = pro
    ? `<div class="offer-cta offer-cta-current">${t('off.cta.act')}</div>`
    : `<div class="offer-activate">
        <input type="text" id="proCodeInput" class="pro-code-input"
          placeholder="${t('off.ph')}" autocomplete="off" spellcheck="false" />
        <button class="offer-cta offer-cta-pro" id="btnActivatePro">${t('off.activate')}</button>
        <div class="pro-code-error" id="proCodeError"></div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;text-align:center">
          ${isEn ? "Don't have a code?" : "Pas encore de code ?"}
          <span style="color:#a78bfa;cursor:pointer;font-weight:600" id="btnGoContact">
            ${isEn ? 'Contact us' : 'Contactez-nous'}
          </span>
        </div>
      </div>`;

  el.innerHTML = `
    <div class="offers-wrap">
      <div class="offers-header">
        <h1>${t('off.title')}</h1>
        <p>${isEn
          ? 'Your data is securely synced to the cloud via Firebase — accessible on all your devices.'
          : 'Vos données sont synchronisées dans le cloud via Firebase — accessibles sur tous vos appareils.'}</p>
      </div>

      ${statusBanner}

      <div class="offers-cards">

        <!-- BASIC -->
        <div class="offer-card ${!pro ? 'offer-current' : ''}">
          <div class="offer-badge-current" style="opacity:${!pro ? 1 : 0}">${t('off.current')}</div>
          <div class="offer-name">Basic</div>
          <div class="offer-price" style="color:var(--text)">${t('off.free')}</div>
          <div class="offer-price-sub">${t('off.forever')}</div>
          <ul class="offer-features">
            <li class="ok">${isEn ? 'Unlimited journal' : 'Journal illimité'}</li>
            <li class="ok">${isEn ? 'Dashboard & analytics' : 'Dashboard & analytics'}</li>
            <li class="ok">${isEn ? '1 prop firm account' : '1 compte prop firm'}</li>
            <li class="ok">${isEn ? 'Calendar & tax simulator' : 'Calendrier & simulateur fiscal'}</li>
            <li class="limit">${isEn ? '1 AI analysis per day' : '1 analyse IA par jour'}</li>
            <li class="no">${isEn ? 'Session & hour analytics' : 'Analytics session & heure'}</li>
            <li class="no">${isEn ? 'Unlimited accounts' : 'Comptes illimités'}</li>
            <li class="no">${isEn ? 'Account groups' : 'Groupes de comptes'}</li>
          </ul>
          ${!pro ? `<div class="offer-cta offer-cta-current">${t('off.cta.cur')}</div>` : ''}
        </div>

        <!-- PRO -->
        <div class="offer-card offer-pro ${pro ? 'offer-current' : ''}">
          <div class="offer-badge-pro">PRO</div>
          <div class="offer-badge-current" style="opacity:${pro ? 1 : 0};color:#a78bfa">${t('off.current')}</div>
          <div class="offer-name">Pro</div>
          <div class="offer-price" style="color:#a78bfa">${pro ? '✦ ' + t('off.active') : t('off.code')}</div>
          <div class="offer-price-sub">${pro ? (isEn ? 'Access for life' : 'Accès à vie') : t('off.code.hint')}</div>
          <ul class="offer-features">
            <li class="ok">${isEn ? 'Everything in Basic' : 'Tout Basic, sans limites'}</li>
            <li class="ok"><strong>${isEn ? 'Unlimited accounts' : 'Comptes illimités'}</strong></li>
            <li class="ok"><strong>${isEn ? 'Session & hour analytics' : 'Analytics session & heure'}</strong></li>
            <li class="ok"><strong>${isEn ? 'Unlimited AI analyses' : 'Analyses IA illimitées'}</strong></li>
            <li class="ok"><strong>${isEn ? 'Account groups' : 'Groupes de comptes'}</strong></li>
            <li class="ok">${isEn ? 'Priority support' : 'Support prioritaire'}</li>
            <li class="ok">${isEn ? 'Future features' : 'Futures fonctionnalités'}</li>
          </ul>
          ${activateSection}
        </div>

      </div>

      <!-- Feature comparison table -->
      <div class="offer-compare">
        <div class="offer-compare-title">${isEn ? 'Full comparison' : 'Comparaison complète'}</div>
        <div class="offer-compare-row offer-compare-header">
          <span>${isEn ? 'Feature' : 'Fonctionnalité'}</span>
          <span class="offer-compare-basic">Basic</span>
          <span class="offer-compare-pro">Pro</span>
        </div>
        ${compareRows}
      </div>

      <!-- FAQ -->
      <div class="offers-faq">
        <h3>${t('off.faq.title')}</h3>
        <div class="faq-item"><b>${t('off.faq.1q')}</b><p>${t('off.faq.1a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.2q')}</b><p>${t('off.faq.2a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.3q')}</b><p>${t('off.faq.3a')}</p></div>
      </div>
    </div>
  `;

  if (!pro) {
    const btn   = document.getElementById('btnActivatePro');
    const input = document.getElementById('proCodeInput');
    const error = document.getElementById('proCodeError');

    btn.addEventListener('click', async () => {
      const code = input.value.trim();
      if (!code) { error.textContent = t('off.err.empty'); return; }
      btn.disabled    = true;
      btn.textContent = '…';
      error.textContent = '';
      const result = await Store.activatePro(code);
      if (result === true) {
        UI.toast(t('off.ok'));
        setTimeout(() => location.reload(), 1200);
      } else if (result === 'throttled') {
        error.textContent = 'Trop de tentatives — réessaie dans 60 secondes.';
        btn.disabled    = false;
        btn.textContent = t('off.activate');
      } else {
        error.textContent = t('off.err.inv');
        btn.disabled    = false;
        btn.textContent = t('off.activate');
      }
    });

    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

    const goContact = document.getElementById('btnGoContact');
    if (goContact) {
      goContact.addEventListener('click', () => {
        const bubble = document.getElementById('contactBubble');
        if (bubble) bubble.click();
      });
    }
  }
};
