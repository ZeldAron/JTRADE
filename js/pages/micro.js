// ─── MICRO-ENTREPRENEUR ───────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);
  const t = (k, v) => i18n.t(k, v);

  let microEurUsd     = null;
  let microEurUsdDate = null;

  async function fetchEurUsd() {
    try {
      const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
      const data = await res.json();
      const rate = data?.rates?.EUR;
      const date = data?.date;
      if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) return null;
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))  return null;
      microEurUsd     = rate;
      microEurUsdDate = date;
      return microEurUsd;
    } catch { return null; }
  }

  function getMicroRevUsd(source) {
    const trades = Store.getTrades();
    const month  = new Date().toISOString().slice(0, 7);
    const list   = source === 'month' ? trades.filter(tr => tr.date.startsWith(month)) : trades;
    return list.reduce((sum, tr) => {
      const c = Calc.trade(tr);
      return c.estimated ? sum : sum + Math.max(0, c.netPnl || 0);
    }, 0);
  }

  function updateMicroResults() {
    const MICRO_RATES = UI.MICRO_RATES;
    const source      = document.querySelector('input[name="microSource"]:checked')?.value || 'month';
    const type        = $('microType')?.value    || 'bnc';
    const acre        = $('microAcre')?.checked  || false;
    const vl          = $('microVL')?.checked    || false;
    const fxRate      = parseFloat($('microFxRate')?.value) || microEurUsd || 0.92;
    const revenueUsd  = source === 'manual'
      ? Math.max(0, parseFloat($('microManualAmt')?.value) || 0)
      : getMicroRevUsd(source);

    const r         = MICRO_RATES[type] || MICRO_RATES.bnc;
    const revEur    = revenueUsd * fxRate;
    const cotisRate = acre ? r.cotis / 2 : r.cotis;
    const cotis     = revEur * cotisRate / 100;
    const cfp       = revEur * r.cfp / 100;
    const vlAmt     = vl ? revEur * r.vl / 100 : 0;
    const netEur    = revEur - cotis - cfp - vlAmt;
    const rLabel    = t(r.labelKey);

    const res = $('microResults');
    if (!res) return;

    res.innerHTML = `
      <div class="mrg-row mrg-header">
        <span>${t('micro.result.gross')}</span>
        <span class="mrg-mono">$${revenueUsd.toFixed(2)}</span>
      </div>
      <div class="mrg-row mrg-sub">
        <span>${t('micro.result.convert', { rate: fxRate.toFixed(4) })}</span>
        <span class="mrg-mono">€${revEur.toFixed(2)}</span>
      </div>
      <div class="mrg-sep"></div>
      <div class="mrg-row">
        <span>${t('micro.result.urssaf', { label: rLabel, rate: cotisRate.toFixed(1) })}${acre ? ' <span class="mrg-tag">ACRE</span>' : ''}</span>
        <span class="mrg-mono mrg-ded">−€${cotis.toFixed(2)}</span>
      </div>
      <div class="mrg-row">
        <span>${t('micro.result.cfp', { rate: r.cfp })}</span>
        <span class="mrg-mono mrg-ded">−€${cfp.toFixed(2)}</span>
      </div>
      ${vl ? `<div class="mrg-row">
        <span>${t('micro.result.vl', { rate: r.vl })}</span>
        <span class="mrg-mono mrg-ded">−€${vlAmt.toFixed(2)}</span>
      </div>` : ''}
      <div class="mrg-sep"></div>
      <div class="mrg-row mrg-net-row">
        <span>${vl ? t('micro.result.net.vl') : t('micro.result.net')}</span>
        <span class="mrg-mono mrg-net" style="color:${netEur>=0?'var(--green)':'var(--red)'}">€${netEur.toFixed(2)}</span>
      </div>
      ${!vl ? `<div class="mrg-note">
        ${t('micro.result.tax.note', { abat: r.abat, amount: (revEur * (1 - r.abat/100)).toFixed(0) })}
      </div>` : ''}
    `;
  }

  UI.renderMicro = function () {
    const el = $('microContent');
    if (!el) return;

    const today       = new Date().toISOString().split('T')[0];
    const month       = today.slice(0, 7);
    const months      = t('cal.months').split(',');
    const monthLabel  = months[parseInt(month.split('-')[1]) - 1] + ' ' + month.split('-')[0];
    const monthUsd    = getMicroRevUsd('month');
    const totalUsd    = getMicroRevUsd('all');
    const fxDisplay   = microEurUsd
      ? `1 USD = <strong>${microEurUsd.toFixed(4)}</strong> EUR · ECB ${microEurUsdDate}`
      : t('micro.fx.loading');

    el.innerHTML = `
      <div class="page-title">${t('page.micro')}</div>
      <div class="micro-layout">

        <div class="micro-form">

          <div class="micro-section">
            <div class="micro-sect-title">${t('micro.fx.title')}</div>
            <div class="micro-fx-row">
              <span class="micro-fx-info" id="microFxInfo">${fxDisplay}</span>
              <button class="btn-ghost micro-fx-btn" id="microFxRefresh">${t('micro.fx.refresh')}</button>
            </div>
            <div class="micro-input-row">
              <label>${t('micro.fx.manual')}</label>
              <input type="number" class="form-input mono" id="microFxRate" step="0.0001"
                value="${(microEurUsd||0.92).toFixed(4)}" style="width:110px">
            </div>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">${t('micro.source.title')}</div>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="month" checked>
              <span>${t('micro.source.month')} <em>${monthLabel}</em></span>
              <span class="micro-radio-amt">$${monthUsd.toFixed(0)}</span>
            </label>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="all">
              <span>${t('micro.source.total')}</span>
              <span class="micro-radio-amt">$${totalUsd.toFixed(0)}</span>
            </label>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="manual">
              <span>${t('micro.source.manual')}</span>
              <input type="number" class="form-input mono" id="microManualAmt" placeholder="0.00"
                step="0.01" style="width:90px;padding:3px 8px;font-size:12px">
            </label>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">${t('micro.type.title')}</div>
            <select class="form-input" id="microType">
              <option value="bnc">${t('micro.bnc')}</option>
              <option value="bic_services">${t('micro.bic.services')}</option>
              <option value="bic_vente">${t('micro.bic.vente')}</option>
            </select>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">${t('micro.options.title')}</div>
            <label class="micro-check-row">
              <input type="checkbox" id="microAcre">
              <div>
                <div class="mc-name">${t('micro.acre.name')}</div>
                <div class="mc-sub">${t('micro.acre.sub')}</div>
              </div>
            </label>
            <label class="micro-check-row">
              <input type="checkbox" id="microVL">
              <div>
                <div class="mc-name">${t('micro.vl.name')}</div>
                <div class="mc-sub">${t('micro.vl.sub')}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="micro-results-col">
          <div class="micro-sect-title">${t('micro.breakdown.title')}</div>
          <div class="micro-result-box" id="microResults"></div>
        </div>
      </div>
    `;

    updateMicroResults();

    $('microFxRefresh').addEventListener('click', async () => {
      const btn = $('microFxRefresh');
      btn.textContent = '⏳'; btn.disabled = true;
      const rate = await fetchEurUsd();
      btn.textContent = t('micro.fx.refresh'); btn.disabled = false;
      if (rate) {
        $('microFxRate').value = rate.toFixed(4);
        $('microFxInfo').innerHTML = `1 USD = <strong>${rate.toFixed(4)}</strong> EUR · ECB ${microEurUsdDate}`;
      }
      updateMicroResults();
    });

    ['microFxRate','microType','microAcre','microVL','microManualAmt'].forEach(id => {
      const el = $(id); if (!el) return;
      el.addEventListener('input',  updateMicroResults);
      el.addEventListener('change', updateMicroResults);
    });
    el.querySelectorAll('input[name="microSource"]').forEach(r =>
      r.addEventListener('change', updateMicroResults)
    );

    if (!microEurUsd) {
      fetchEurUsd().then(rate => {
        if (!rate || !$('microFxRate')) return;
        $('microFxRate').value = rate.toFixed(4);
        $('microFxInfo').innerHTML = `1 USD = <strong>${rate.toFixed(4)}</strong> EUR · ECB ${microEurUsdDate}`;
        updateMicroResults();
      });
    }
  };
})();
