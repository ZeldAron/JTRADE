// ─── MICRO-ENTREPRENEUR ───────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);

  let microEurUsd     = null;
  let microEurUsdDate = null;

  async function fetchEurUsd() {
    try {
      const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
      const data = await res.json();
      microEurUsd     = data.rates.EUR;
      microEurUsdDate = data.date;
      return microEurUsd;
    } catch { return null; }
  }

  function getMicroRevUsd(source) {
    const trades = Store.getTrades();
    const month  = new Date().toISOString().slice(0, 7);
    const list   = source === 'month' ? trades.filter(t => t.date.startsWith(month)) : trades;
    return list.reduce((sum, t) => {
      const c = Calc.trade(t);
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

    const res = $('microResults');
    if (!res) return;

    res.innerHTML = `
      <div class="mrg-row mrg-header">
        <span>Revenus bruts (USD)</span>
        <span class="mrg-mono">$${revenueUsd.toFixed(2)}</span>
      </div>
      <div class="mrg-row mrg-sub">
        <span>Conversion (1 USD = ${fxRate.toFixed(4)} €)</span>
        <span class="mrg-mono">€${revEur.toFixed(2)}</span>
      </div>
      <div class="mrg-sep"></div>
      <div class="mrg-row">
        <span>Cotisations URSSAF · ${r.label} — ${cotisRate.toFixed(1)}%${acre ? ' <span class="mrg-tag">ACRE</span>' : ''}</span>
        <span class="mrg-mono mrg-ded">−€${cotis.toFixed(2)}</span>
      </div>
      <div class="mrg-row">
        <span>Formation professionnelle (CFP) — ${r.cfp}%</span>
        <span class="mrg-mono mrg-ded">−€${cfp.toFixed(2)}</span>
      </div>
      ${vl ? `<div class="mrg-row">
        <span>Versement libératoire IR — ${r.vl}%</span>
        <span class="mrg-mono mrg-ded">−€${vlAmt.toFixed(2)}</span>
      </div>` : ''}
      <div class="mrg-sep"></div>
      <div class="mrg-row mrg-net-row">
        <span>Net estimé${vl ? ' (IR inclus)' : ''}</span>
        <span class="mrg-mono mrg-net" style="color:${netEur>=0?'var(--green)':'var(--red)'}">€${netEur.toFixed(2)}</span>
      </div>
      ${!vl ? `<div class="mrg-note">
        ⚠ IR non inclus. Barème progressif après abattement de ${r.abat}% sur le CA.
        Imposable ≈ €${(revEur * (1 - r.abat/100)).toFixed(0)}
      </div>` : ''}
    `;
  }

  UI.renderMicro = function () {
    const el = $('microContent');
    if (!el) return;

    const MONTHS_FR   = UI.MONTHS_FR;
    const today       = new Date().toISOString().split('T')[0];
    const month       = today.slice(0, 7);
    const monthLabel  = MONTHS_FR[parseInt(month.split('-')[1]) - 1] + ' ' + month.split('-')[0];
    const monthUsd    = getMicroRevUsd('month');
    const totalUsd    = getMicroRevUsd('all');
    const fxDisplay   = microEurUsd
      ? `1 USD = <strong>${microEurUsd.toFixed(4)}</strong> EUR · ECB ${microEurUsdDate}`
      : 'Chargement du taux…';

    el.innerHTML = `
      <div class="page-title">Micro-Entrepreneur</div>
      <div class="micro-layout">

        <div class="micro-form">

          <div class="micro-section">
            <div class="micro-sect-title">Taux EUR/USD</div>
            <div class="micro-fx-row">
              <span class="micro-fx-info" id="microFxInfo">${fxDisplay}</span>
              <button class="btn-ghost micro-fx-btn" id="microFxRefresh">🔄 Actualiser</button>
            </div>
            <div class="micro-input-row">
              <label>Taux manuel</label>
              <input type="number" class="form-input mono" id="microFxRate" step="0.0001"
                value="${(microEurUsd||0.92).toFixed(4)}" style="width:110px">
            </div>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">Source des revenus (P&L net USD)</div>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="month" checked>
              <span>Ce mois — <em>${monthLabel}</em></span>
              <span class="micro-radio-amt">$${monthUsd.toFixed(0)}</span>
            </label>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="all">
              <span>Total du journal</span>
              <span class="micro-radio-amt">$${totalUsd.toFixed(0)}</span>
            </label>
            <label class="micro-radio-row">
              <input type="radio" name="microSource" value="manual">
              <span>Montant manuel ($)</span>
              <input type="number" class="form-input mono" id="microManualAmt" placeholder="0.00"
                step="0.01" style="width:90px;padding:3px 8px;font-size:12px">
            </label>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">Type d'activité</div>
            <select class="form-input" id="microType">
              <option value="bnc">BNC — Profession libérale (24.6%)</option>
              <option value="bic_services">BIC Services — Prestations (21.2%)</option>
              <option value="bic_vente">BIC Vente — Achat-revente (12.3%)</option>
            </select>
          </div>

          <div class="micro-section">
            <div class="micro-sect-title">Options</div>
            <label class="micro-check-row">
              <input type="checkbox" id="microAcre">
              <div>
                <div class="mc-name">ACRE — Exonération partielle 1ère année</div>
                <div class="mc-sub">−50 % sur les cotisations URSSAF · jusqu'à fin du T3 suivant le début d'activité</div>
              </div>
            </label>
            <label class="micro-check-row">
              <input type="checkbox" id="microVL">
              <div>
                <div class="mc-name">Versement libératoire de l'impôt sur le revenu</div>
                <div class="mc-sub">IR intégré au taux · BNC +2.2 % · BIC serv. +1.7 % · BIC vente +1 %<br>Condition : RFR N−2 ≤ 28 797 €/part</div>
              </div>
            </label>
          </div>
        </div>

        <div class="micro-results-col">
          <div class="micro-sect-title">Décomposition</div>
          <div class="micro-result-box" id="microResults"></div>
        </div>
      </div>
    `;

    updateMicroResults();

    $('microFxRefresh').addEventListener('click', async () => {
      const btn = $('microFxRefresh');
      btn.textContent = '⏳'; btn.disabled = true;
      const rate = await fetchEurUsd();
      btn.textContent = '🔄 Actualiser'; btn.disabled = false;
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
