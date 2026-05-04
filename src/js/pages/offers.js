// ─── PAGE OFFRES ──────────────────────────────────────────────────────────────

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

  // ── Card : GRATUIT ────────────────────────────────────────────────────────
  const cardFree = `
    <div class="offer-card ${!pro ? 'offer-current' : ''}">
      <div class="offer-badge-basic">BASIC</div>
      <div class="offer-badge-current" style="opacity:${!pro ? 1 : 0}">${t('off.current')}</div>
      <div class="offer-name">Basic</div>
      <div class="offer-price-hidden" style="color:var(--green)">✓ ${t('off.free')} — ${t('off.forever')}</div>
      <ul class="offer-features">
        <li class="ok">${t('off.basic.f1')}</li>
        <li class="ok">${t('off.basic.f2')}</li>
        <li class="ok">${t('off.basic.f3')}</li>
        <li class="ok">${t('off.basic.f5')}</li>
        <li class="ok">${t('off.basic.f6')}</li>
        <li class="limit">${t('off.basic.f8')}</li>
        <li class="limit">${t('off.basic.f7')}</li>
        <li class="no">${t('off.pro.f7')}</li>
        <li class="no">${t('off.basic.f9')}</li>
      </ul>
      <div class="offer-cta offer-cta-current">${!pro ? t('off.cta.cur') : 'Basic'}</div>
    </div>`;

  // ── Card : PRO ────────────────────────────────────────────────────────────
  const cardPro = `
    <div class="offer-card offer-pro ${pro ? 'offer-current' : ''}">
      <div class="offer-badge-pro">${t('off.popular')}</div>
      <div class="offer-badge-current" style="opacity:${pro ? 1 : 0};color:#a78bfa">${t('off.current')}</div>
      <div class="offer-name" style="color:#a78bfa">Pro</div>
      <div class="offer-price-hidden">${t('off.price.hidden')}</div>
      <ul class="offer-features">
        <li class="ok">${t('off.pro.f1')}</li>
        <li class="ok"><strong>${t('off.pro.f2')}</strong></li>
        <li class="ok"><strong>${t('off.pro.f3')}</strong></li>
        <li class="ok"><strong>${t('off.pro.f7')}</strong></li>
        <li class="ok">${t('off.pro.f4')}</li>
        <li class="ok">${t('off.pro.f5')}</li>
        <li class="ok">${t('off.pro.f6')}</li>
      </ul>
      ${pro
        ? `<div class="offer-cta offer-cta-current">${t('off.cta.act')}</div>`
        : `<a href="payment.html" target="_blank" class="offer-cta offer-cta-link offer-cta-pro">${t('off.cta.pro.btn')}</a>`}
    </div>`;

  // ── Card : LIFETIME ───────────────────────────────────────────────────────
  const cardLifetime = `
    <div class="offer-card offer-lifetime">
      <div class="offer-badge-lifetime">LIFETIME</div>
      <div class="offer-badge-current" style="opacity:0">${t('off.current')}</div>
      <div class="offer-name" style="color:#f59e0b">${t('off.lifetime')}</div>
      <div class="offer-price-hidden">${t('off.price.hidden')}</div>
      <ul class="offer-features">
        <li class="ok">${t('off.lt.f1')}</li>
        <li class="ok"><strong>${t('off.lt.f2')}</strong></li>
        <li class="ok"><strong>${t('off.lt.f3')}</strong></li>
        <li class="ok">${t('off.lt.f4')}</li>
      </ul>
      <a href="payment.html" target="_blank" class="offer-cta offer-cta-link offer-cta-lifetime">${t('off.cta.lt.btn')}</a>
    </div>`;

  // ── Comparison table ──────────────────────────────────────────────────────
  const perDay = isEn ? '1/day' : '1/jour';
  const rows = [
    { f: t('off.basic.f1'),        free: '✓', pro: '✓', lt: '✓' },
    { f: t('off.basic.f2'),        free: '✓', pro: '✓', lt: '✓' },
    { f: t('off.basic.f3'),        free: '✓', pro: '✓', lt: '✓' },
    { f: t('off.basic.f5'),        free: '✓', pro: '✓', lt: '✓' },
    { f: t('off.basic.f6'),        free: '✓', pro: '✓', lt: '✓' },
    { f: t('off.row.accounts'),    free: '1',     pro: '∞',     lt: '∞' },
    { f: t('off.row.ai'),          free: perDay,  pro: '∞',     lt: '∞' },
    { f: t('off.row.analytics'),   free: '✗', pro: '✓', lt: '✓' },
    { f: t('off.pro.f4'),          free: '✗', pro: '✓', lt: '✓' },
    { f: t('off.pro.f5'),          free: '✗', pro: '✓', lt: '✓' },
    { f: t('off.row.lifetime'),    free: '✗', pro: '✗', lt: '✓' },
  ];

  const colColor = (v, isLt) => {
    if (v === '✓' || v === '∞') return isLt ? '#f59e0b' : (v === '∞' ? '#a78bfa' : 'var(--green)');
    if (v === '✗') return 'var(--muted)';
    return 'var(--amber)';
  };

  const compareRows = rows.map(r => `
    <div class="offer-compare-row">
      <span class="offer-compare-feature">${r.f}</span>
      <span class="offer-compare-basic" style="color:${colColor(r.free, false)}">${r.free}</span>
      <span class="offer-compare-pro"   style="color:${colColor(r.pro, false)}">${r.pro}</span>
      <span class="offer-compare-lt"    style="color:${colColor(r.lt, true)}">${r.lt}</span>
    </div>`).join('');

  // ── Promo code section ────────────────────────────────────────────────────
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
        ${cardFree}
        ${cardPro}
        ${cardLifetime}
      </div>

      ${promoSection}

      <div class="offer-compare">
        <div class="offer-compare-title">${t('off.compare.full')}</div>
        <div class="offer-compare-row offer-compare-header">
          <span>${t('off.compare.feat')}</span>
          <span class="offer-compare-basic">${t('off.compare.free')}</span>
          <span class="offer-compare-pro">Pro</span>
          <span class="offer-compare-lt">${t('off.lifetime')}</span>
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
