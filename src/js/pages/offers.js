// ─── PAGE OFFRES ──────────────────────────────────────────────────────────────

UI.renderOffers = function () {
  const el = document.getElementById('offersContent');
  const plan = Store.getPlanInfo();
  const isPro = plan.plan === 'pro';
  const t = k => i18n.t(k);

  el.innerHTML = `
    <div class="offers-wrap">
      <div class="offers-header">
        <h1>${t('off.title')}</h1>
        <p>${t('off.sub')}</p>
      </div>

      <div class="offers-cards">

        <!-- BASIC -->
        <div class="offer-card ${!isPro ? 'offer-current' : ''}">
          <div class="offer-badge-current" style="opacity:${!isPro ? 1 : 0}">${t('off.current')}</div>
          <div class="offer-name">Basic</div>
          <div class="offer-price">${t('off.free')}</div>
          <div class="offer-price-sub">${t('off.forever')}</div>
          <ul class="offer-features">
            <li class="ok">${t('off.basic.f1')}</li>
            <li class="ok">${t('off.basic.f2')}</li>
            <li class="ok">${t('off.basic.f3')}</li>
            <li class="ok">${t('off.basic.f4')}</li>
            <li class="ok">${t('off.basic.f5')}</li>
            <li class="ok">${t('off.basic.f6')}</li>
            <li class="limit">${t('off.basic.f7')}</li>
            <li class="limit">${t('off.basic.f8')}</li>
            <li class="no">${t('off.basic.f9')}</li>
          </ul>
          ${!isPro ? `<div class="offer-cta offer-cta-current">${t('off.cta.cur')}</div>` : ''}
        </div>

        <!-- PRO -->
        <div class="offer-card offer-pro ${isPro ? 'offer-current' : ''}">
          <div class="offer-badge-pro">PRO</div>
          <div class="offer-badge-current" style="opacity:${isPro ? 1 : 0}">${t('off.current')}</div>
          <div class="offer-name">Pro</div>
          <div class="offer-price">${isPro ? t('off.active') : t('off.code')}</div>
          <div class="offer-price-sub">${isPro ? t('off.activated') + new Date(plan.activatedAt).toLocaleDateString(i18n.locale()) : t('off.code.hint')}</div>
          <ul class="offer-features">
            <li class="ok">${t('off.pro.f1')}</li>
            <li class="ok"><strong>${t('off.pro.f2')}</strong></li>
            <li class="ok"><strong>${t('off.pro.f3')}</strong></li>
            <li class="ok"><strong>${t('off.pro.f4')}</strong></li>
            <li class="ok">${t('off.pro.f5')}</li>
            <li class="ok">${t('off.pro.f6')}</li>
          </ul>

          ${isPro
            ? `<div class="offer-cta offer-cta-current">${t('off.cta.act')}</div>`
            : `<div class="offer-activate">
                <input type="text" id="proCodeInput" class="pro-code-input"
                  placeholder="${t('off.ph')}" autocomplete="off" spellcheck="false" />
                <button class="offer-cta offer-cta-pro" id="btnActivatePro">${t('off.activate')}</button>
                <div class="pro-code-error" id="proCodeError"></div>
              </div>`
          }
        </div>

      </div>

      <div class="offers-faq">
        <h3>${t('off.faq.title')}</h3>
        <div class="faq-item"><b>${t('off.faq.1q')}</b><p>${t('off.faq.1a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.2q')}</b><p>${t('off.faq.2a')}</p></div>
        <div class="faq-item"><b>${t('off.faq.3q')}</b><p>${t('off.faq.3a')}</p></div>
      </div>
    </div>
  `;

  if (!isPro) {
    document.getElementById('btnActivatePro').addEventListener('click', () => {
      const code  = document.getElementById('proCodeInput').value;
      const error = document.getElementById('proCodeError');
      if (!code.trim()) { error.textContent = i18n.t('off.err.empty'); return; }
      const ok = Store.activatePro(code);
      if (ok) {
        UI.toast(i18n.t('off.ok'));
        setTimeout(() => location.reload(), 1200);
      } else {
        error.textContent = i18n.t('off.err.inv');
      }
    });

    document.getElementById('proCodeInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btnActivatePro').click();
    });
  }
};
