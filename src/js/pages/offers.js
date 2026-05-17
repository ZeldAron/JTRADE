// ─── PAGE OFFRES ──────────────────────────────────────────────────────────────
// v0.9.197 : refonte 3 offres distinctes — Trader (gratuit) / Funded (14.99€/mois) / Elite (29.99€/mois)

UI.renderOffers = function () {
  const el   = document.getElementById('offersContent');
  const plan = Store.getPlanInfo();
  const pro  = plan.plan === 'pro';
  const t    = k => i18n.t(k);
  const tv   = (k, v) => i18n.t(k, v);
  const isEn = i18n.getLang() === 'en';

  const activatedDate = pro && plan.activatedAt
    ? new Date(plan.activatedAt).toLocaleDateString(i18n.locale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Status banner ──────────────────────────────────────────────────────────
  const statusBanner = pro
    ? `<div class="pro-active-banner">
        <div class="pro-active-icon">✦</div>
        <div>
          <div class="pro-active-title">${t('off.pro.active.title')}</div>
          <div class="pro-active-sub">${tv('off.pro.active.sub', { date: activatedDate })}</div>
        </div>
      </div>`
    : '';

  // ── Card : TRADER (gratuit) ───────────────────────────────────────────────
  const cardTrader = `
    <div class="offer-card ${!pro ? 'offer-current' : ''}">
      <div class="offer-badge-basic">TRADER</div>
      <div class="offer-badge-current" style="opacity:${!pro ? 1 : 0}">${t('off.current')}</div>
      <div class="offer-name">Trader</div>
      <div class="offer-price-hidden" style="color:var(--green)">✓ 0 € — ${t('off.forever')}</div>
      <ul class="offer-features">
        <li class="ok">${t('off.trader.f1')}</li>
        <li class="ok">${t('off.trader.f2')}</li>
        <li class="ok">${t('off.trader.f3')}</li>
        <li class="ok">${t('off.trader.f4')}</li>
        <li class="ok">${t('off.trader.f5')}</li>
        <li class="limit">${t('off.trader.f6')}</li>
        <li class="limit">${t('off.trader.f7')}</li>
        <li class="no">${t('off.trader.f8')}</li>
        <li class="no">${t('off.trader.f9')}</li>
      </ul>
      <div class="offer-cta offer-cta-current">${!pro ? t('off.cta.cur') : 'Trader'}</div>
    </div>`;

  // ── Card : FUNDED (14.99 €/mois — featured) ──────────────────────────────
  const cardFunded = `
    <div class="offer-card offer-pro ${pro ? 'offer-current' : ''}">
      <div class="offer-badge-pro">${t('off.popular')}</div>
      <div class="offer-badge-current" style="opacity:${pro ? 1 : 0};color:#a78bfa">${t('off.current')}</div>
      <div class="offer-name" style="color:#a78bfa">Funded</div>
      <div class="offer-price-hidden">14.99 €<span style="color:var(--muted);font-size:13px;font-weight:500">/${isEn ? 'month' : 'mois'}</span></div>
      <ul class="offer-features">
        <li class="ok">${t('off.funded.f1')}</li>
        <li class="ok"><strong>${t('off.funded.f2')}</strong></li>
        <li class="ok"><strong>${t('off.funded.f3')}</strong></li>
        <li class="ok"><strong>${t('off.funded.f4')}</strong></li>
        <li class="ok">${t('off.funded.f5')}</li>
        <li class="ok">${t('off.funded.f6')}</li>
        <li class="ok">${t('off.funded.f7')}</li>
      </ul>
      ${pro
        ? `<div class="offer-cta offer-cta-current">${t('off.cta.act')}</div>`
        : `<a href="/payment" target="_blank" rel="noopener noreferrer" class="offer-cta offer-cta-link offer-cta-pro">${t('off.cta.funded.btn')}</a>`}
    </div>`;

  // ── Card : ELITE (29.99 €/mois) ───────────────────────────────────────────
  const cardElite = `
    <div class="offer-card offer-elite">
      <div class="offer-badge-elite">ELITE</div>
      <div class="offer-badge-current" style="opacity:0">${t('off.current')}</div>
      <div class="offer-name" style="color:#f59e0b">Elite</div>
      <div class="offer-price-hidden">29.99 €<span style="color:var(--muted);font-size:13px;font-weight:500">/${isEn ? 'month' : 'mois'}</span></div>
      <ul class="offer-features">
        <li class="ok">${t('off.elite.f1')}</li>
        <li class="ok"><strong>${t('off.elite.f2')}</strong></li>
        <li class="ok"><strong>${t('off.elite.f3')}</strong></li>
        <li class="ok">${t('off.elite.f4')}</li>
        <li class="ok">${t('off.elite.f5')}</li>
        <li class="soon">${t('off.elite.f6')}</li>
      </ul>
      <a href="/payment" target="_blank" rel="noopener noreferrer" class="offer-cta offer-cta-link offer-cta-elite">${t('off.cta.elite.btn')}</a>
    </div>`;

  // ── Comparison table ──────────────────────────────────────────────────────
  const perDay = isEn ? '/day' : '/jour';
  const rows = [
    { f: t('off.row.journal'),       tr: '✓',          fu: '✓',     el: '✓' },
    { f: t('off.row.dashboard'),     tr: '✓',          fu: '✓',     el: '✓' },
    { f: t('off.row.calendar'),      tr: '✓',          fu: '✓',     el: '✓' },
    { f: t('off.row.goals'),         tr: '✓',          fu: '✓',     el: '✓' },
    { f: t('off.row.calculators'),   tr: '✓',          fu: '✓',     el: '✓' },
    { f: t('off.row.accounts'),      tr: '1',          fu: '10',    el: '100' },
    { f: t('off.row.ai'),            tr: '1' + perDay, fu: '20' + perDay, el: '100' + perDay },
    { f: t('off.row.groups'),        tr: '✗',          fu: '✓',     el: '✓' },
    { f: t('off.row.pdf'),           tr: '✗',          fu: '✓',     el: '✓' },
    { f: t('off.row.support'),       tr: t('off.row.support.std'),  fu: t('off.row.support.prio'), el: t('off.row.support.elite') },
    { f: t('off.row.beta'),          tr: '✗',          fu: '✗',     el: '✓' },
    { f: t('off.row.roadmap'),       tr: '✗',          fu: t('off.row.roadmap.prio'), el: t('off.row.roadmap.decisive') },
  ];

  const colColor = (v, isEl) => {
    if (v === '✓') return isEl ? '#f59e0b' : 'var(--green)';
    if (v === '✗') return 'var(--muted)';
    return 'var(--amber)';
  };

  const compareRows = rows.map(r => `
    <div class="offer-compare-row">
      <span class="offer-compare-feature">${r.f}</span>
      <span class="offer-compare-basic" style="color:${colColor(r.tr, false)}">${r.tr}</span>
      <span class="offer-compare-pro"   style="color:${colColor(r.fu, false)}">${r.fu}</span>
      <span class="offer-compare-lt"    style="color:${colColor(r.el, true)}">${r.el}</span>
    </div>`).join('');

  // ── Promo code section (Founding Members) ────────────────────────────────
  const promoSection = pro
    ? `<div class="offer-promo-section">
        <div class="offer-promo-active">✦ &nbsp;${t('off.pro.active.title')} &nbsp;—&nbsp; ${t('off.cta.act')}</div>
      </div>`
    : `<div class="offer-promo-section">
        <div class="offer-promo-title">${t('off.beta.title')}</div>
        <div class="offer-promo-sub">${t('off.beta.sub')}</div>
        <div class="offer-promo-row">
          <input type="text" id="proCodeInput" class="pro-code-input"
            placeholder="${t('off.ph')}" autocomplete="off" spellcheck="false" />
          <button class="offer-cta offer-cta-link offer-cta-pro" id="btnActivatePro">${t('off.activate')}</button>
        </div>
        <div class="pro-code-error" id="proCodeError"></div>
        <div style="font-size:11px;color:var(--muted);margin-top:10px;text-align:center">
          ${t('off.no.code')}
          <span style="color:#a78bfa;cursor:pointer;font-weight:600" id="btnGoContact">${t('off.contact.us')}</span>
        </div>
      </div>`;

  // ── Render ────────────────────────────────────────────────────────────────
  el.innerHTML = `
    <div class="offers-wrap">
      <div class="offers-header">
        <h1>${t('off.title')}</h1>
        <p>${t('off.sub')}</p>
      </div>

      ${statusBanner}

      <div class="offers-cards">
        ${cardTrader}
        ${cardFunded}
        ${cardElite}
      </div>

      ${promoSection}

      <div class="offer-compare">
        <div class="offer-compare-title">${t('off.compare.full')}</div>
        <div class="offer-compare-row offer-compare-header">
          <span>${t('off.compare.feat')}</span>
          <span class="offer-compare-basic">Trader</span>
          <span class="offer-compare-pro">Funded</span>
          <span class="offer-compare-lt">Elite</span>
        </div>
        ${compareRows}
      </div>

      <div class="offers-faq">
        <h3>${t('off.faq.title')}</h3>
        <div class="faq-item"><b>${t('off.faq.1q')}</b><p>${t('off.faq.1a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.2q')}</b><p>${t('off.faq.2a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.3q')}</b><p>${t('off.faq.3a')}</p></div>
      </div>
    </div>
  `;

  // Activation logic (non-Pro only)
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
        error.textContent = t('off.code.throttled');
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
