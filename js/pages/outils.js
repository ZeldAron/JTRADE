// ─── PAGE OUTILS ──────────────────────────────────────────────────────────────

(function () {
  const $ = id => document.getElementById(id);
  const t = k => i18n.t(k);

  // ── Catalogue instruments pour le calcul de position ──────────────────────
  // vpv = dollars par tick / pip / point par contrat ou lot
  const CALC_INSTRUMENTS = [
    // CME Futures — unité : ticks
    { id:'MES1',   label:'MES  — Micro S&P 500',   group:'futures', unit:'ticks',  vpv:1.25   },
    { id:'ES1',    label:'ES   — S&P 500',          group:'futures', unit:'ticks',  vpv:12.50  },
    { id:'MNQ1',   label:'MNQ  — Micro Nasdaq',     group:'futures', unit:'ticks',  vpv:0.50   },
    { id:'NQ1',    label:'NQ   — Nasdaq 100',       group:'futures', unit:'ticks',  vpv:5.00   },
    { id:'MYM1',   label:'MYM  — Micro Dow',        group:'futures', unit:'ticks',  vpv:0.50   },
    { id:'YM1',    label:'YM   — Dow Jones',        group:'futures', unit:'ticks',  vpv:5.00   },
    { id:'M2K1',   label:'M2K  — Micro Russell',    group:'futures', unit:'ticks',  vpv:0.50   },
    { id:'RTY1',   label:'RTY  — Russell 2000',     group:'futures', unit:'ticks',  vpv:5.00   },
    { id:'MGC1',   label:'MGC  — Micro Gold',       group:'futures', unit:'ticks',  vpv:1.00   },
    { id:'QO1',    label:'QO   — Mini Gold',        group:'futures', unit:'ticks',  vpv:5.00   },
    { id:'GC1',    label:'GC   — Gold',             group:'futures', unit:'ticks',  vpv:10.00  },
    { id:'MCL1',   label:'MCL  — Micro Crude',      group:'futures', unit:'ticks',  vpv:1.00   },
    { id:'CL1',    label:'CL   — Crude Oil',        group:'futures', unit:'ticks',  vpv:10.00  },
    // CFD Indices — unité : points
    { id:'US30',   label:'US30    — Dow Jones',     group:'cfd',     unit:'points', vpv:5.00   },
    { id:'US100',  label:'US100   — Nasdaq',        group:'cfd',     unit:'points', vpv:1.00   },
    { id:'US500',  label:'US500   — S&P 500',       group:'cfd',     unit:'points', vpv:1.00   },
    { id:'GER40',  label:'GER40   — DAX',           group:'cfd',     unit:'points', vpv:1.00   },
    { id:'UK100',  label:'UK100   — FTSE 100',      group:'cfd',     unit:'points', vpv:1.00   },
    { id:'XAUUSD', label:'XAU/USD — Gold',          group:'cfd',     unit:'points', vpv:100.00 },
    { id:'USOIL',  label:'USOIL   — Crude Oil',     group:'cfd',     unit:'points', vpv:10.00  },
    // CFD Forex — unité : pips (0.0001)
    { id:'EURUSD', label:'EUR/USD',                  group:'cfd',     unit:'pips',   vpv:10.00  },
    { id:'GBPUSD', label:'GBP/USD',                  group:'cfd',     unit:'pips',   vpv:10.00  },
    { id:'USDJPY', label:'USD/JPY',                  group:'cfd',     unit:'pips',   vpv:6.50   },
  ];

  const getInstr = id => CALC_INSTRUMENTS.find(i => i.id === id);

  // ── Calcul live ───────────────────────────────────────────────────────────
  function recalc() {
    const capital  = parseFloat($('calcCapital')?.value)   || 0;
    const riskPct  = parseFloat($('calcRiskPct')?.value)   || 0;
    const slDist   = parseFloat($('calcSL')?.value)        || 0;
    const rr       = parseFloat($('calcRR')?.value)        || 0;
    const instr    = getInstr($('calcInstrument')?.value);

    const dollarRisk = capital * riskPct / 100;

    const riskEq = $('calcRiskEq');
    if (riskEq) riskEq.textContent = dollarRisk > 0 ? '= $' + dollarRisk.toFixed(2) : '';

    const panel = $('calcResultPanel');
    if (!panel) return;

    if (!capital || !riskPct || !slDist || !instr) {
      panel.innerHTML = `<div class="calc-placeholder">${t('calc.no.data')}</div>`;
      return;
    }

    const isCFD    = instr.group === 'cfd';
    const rawQty   = dollarRisk / (slDist * instr.vpv);
    const qty      = isCFD
      ? Math.max(0.01, Math.floor(rawQty * 100) / 100)
      : Math.max(1,    Math.floor(rawQty));

    const actualRisk   = qty * slDist * instr.vpv;
    const actualReward = rr > 0 ? actualRisk * rr : null;
    const qtyLabel     = isCFD
      ? (qty === 1 ? 'lot' : 'lots')
      : (qty === 1 ? t('ui.contract') : t('ui.contracts'));

    // Budget daily restant si compte sélectionné
    let dailyHtml = '';
    const acctName = $('calcAccount')?.value;
    if (acctName) {
      const acct = Store.getMyAccountByName(acctName);
      if (acct && acct.dailyLossLimit) {
        const today       = UI.localToday();
        const todayLoss   = Store.getTrades()
          .filter(tr => tr.apex === acct.name && (tr.date || '').startsWith(today))
          .reduce((s, tr) => s + Math.min(0, Calc.trade(tr).netPnl || 0), 0);
        const remaining   = acct.dailyLossLimit + todayLoss;
        const budgetColor = remaining >= actualRisk ? 'var(--green)' : 'var(--red)';
        dailyHtml = `
          <div class="calc-result-row">
            <span class="calc-result-lbl">${t('calc.result.daily')}</span>
            <span class="calc-result-val" style="color:${budgetColor}">$${Math.max(0, remaining).toFixed(0)}</span>
          </div>`;
      }
    }

    // Avertissement max contrats
    let warnHtml = '';
    const acct2 = acctName ? Store.getMyAccountByName(acctName) : null;
    if (acct2 && acct2.maxContracts && qty > acct2.maxContracts) {
      warnHtml = `<div class="calc-warn">⚠ ${t('calc.result.max')} : ${isCFD ? acct2.maxContracts + ' lots' : acct2.maxContracts + ' ' + t('ui.contracts')}</div>`;
    }

    panel.innerHTML = `
      <div class="calc-result-big">
        <div class="calc-result-contracts">${isCFD ? qty.toFixed(2) : qty}</div>
        <div class="calc-result-unit">${qtyLabel}</div>
        <div class="calc-result-instr">${instr.label.split('—')[0].trim()}</div>
      </div>
      <div class="calc-result-rows">
        <div class="calc-result-row">
          <span class="calc-result-lbl">${t('calc.result.risk')}</span>
          <span class="calc-result-val" style="color:var(--red)">−$${actualRisk.toFixed(2)}</span>
        </div>
        ${actualReward !== null ? `
        <div class="calc-result-row">
          <span class="calc-result-lbl">${t('calc.result.reward')}</span>
          <span class="calc-result-val" style="color:var(--green)">+$${actualReward.toFixed(2)}</span>
        </div>` : ''}
        ${dailyHtml}
      </div>
      ${warnHtml}
    `;
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  let microRendered = false;

  function showTab(tab) {
    ['calc','micro'].forEach(id => {
      const btn   = $('outilsTab-' + id);
      const panel = $('outilsPanel-' + id);
      if (btn)   btn.classList.toggle('active', id === tab);
      if (panel) panel.style.display = id === tab ? '' : 'none';
    });
    if (tab === 'micro' && !microRendered) {
      UI.renderMicro();
      microRendered = true;
    }
    if (tab === 'calc') recalc();
  }

  // ── HTML du calculateur ───────────────────────────────────────────────────
  function calcHtml() {
    const accounts = Store.getMyAccounts();

    const acctOptions = accounts.map(a =>
      `<option value="${UI.escHtml(a.name)}">${UI.escHtml(a.name)} — $${Math.round(a.capital).toLocaleString()}</option>`
    ).join('');

    const instrOptions = ['futures','cfd'].map(grp => {
      const groupLabel = grp === 'futures' ? 'CME Futures' : 'CFD &amp; Forex';
      const opts = CALC_INSTRUMENTS
        .filter(i => i.group === grp)
        .map(i => `<option value="${i.id}">${i.label}</option>`)
        .join('');
      return `<optgroup label="${groupLabel}">${opts}</optgroup>`;
    }).join('');

    return `
      <div class="calc-wrap">
        <div class="calc-inputs">

          <div class="calc-section">
            <div class="calc-sect-title">${t('calc.account.section')}</div>
            ${accounts.length ? `
            <div class="calc-field">
              <label>${t('calc.account')}</label>
              <select class="form-input" id="calcAccount">
                <option value="">${t('calc.manual')}</option>
                ${acctOptions}
              </select>
            </div>` : ''}
            <div class="calc-field">
              <label>${t('calc.capital')}</label>
              <input type="number" class="form-input mono" id="calcCapital"
                placeholder="10000" min="0" step="100">
            </div>
            <div class="calc-field">
              <label>${t('calc.risk.pct')}</label>
              <div class="calc-risk-row">
                <input type="number" class="form-input mono" id="calcRiskPct"
                  placeholder="1" min="0.01" max="100" step="0.1" style="width:90px">
                <span class="calc-eq" id="calcRiskEq"></span>
              </div>
            </div>
          </div>

          <div class="calc-section">
            <div class="calc-sect-title">${t('calc.instr.section')}</div>
            <div class="calc-field">
              <label>${t('calc.instrument')}</label>
              <select class="form-input" id="calcInstrument">
                <option value="">— ${t('calc.instrument')} —</option>
                ${instrOptions}
              </select>
            </div>
            <div class="calc-field">
              <label id="calcSLLabel">${t('calc.sl')}</label>
              <input type="number" class="form-input mono" id="calcSL"
                placeholder="10" min="0.01" step="0.01">
            </div>
            <div class="calc-field">
              <label>${t('calc.rr')}</label>
              <input type="number" class="form-input mono" id="calcRR"
                placeholder="2" min="0" step="0.1" style="width:90px">
            </div>
          </div>

        </div>

        <div class="calc-result-card" id="calcResultPanel">
          <div class="calc-placeholder">${t('calc.no.data')}</div>
        </div>
      </div>
    `;
  }

  // ── Render principal ──────────────────────────────────────────────────────
  UI.renderOutils = function () {
    const el = $('outilsContent');
    if (!el) return;
    microRendered = false;

    el.innerHTML = `
      <div class="outils-tabs-bar">
        <button class="outils-tab active" id="outilsTab-calc">${t('outils.tab.calc')}</button>
        <button class="outils-tab"        id="outilsTab-micro">${t('outils.tab.micro')}</button>
      </div>
      <div id="outilsPanel-calc">${calcHtml()}</div>
      <div id="outilsPanel-micro" style="display:none">
        <div class="dash-page" id="microContent"></div>
      </div>
    `;

    // Tabs
    $('outilsTab-calc').addEventListener('click',  () => showTab('calc'));
    $('outilsTab-micro').addEventListener('click', () => showTab('micro'));

    // Compte → auto-remplit le capital
    const acctSel = $('calcAccount');
    if (acctSel) {
      acctSel.addEventListener('change', () => {
        const acct = Store.getMyAccountByName(acctSel.value);
        if (acct) $('calcCapital').value = acct.capital;
        recalc();
      });
    }

    // Instrument → met à jour le label SL
    $('calcInstrument').addEventListener('change', () => {
      const instr = getInstr($('calcInstrument').value);
      const lbl   = $('calcSLLabel');
      if (lbl) lbl.textContent = instr ? `${t('calc.sl')} (${instr.unit})` : t('calc.sl');
      recalc();
    });

    // Recalc live
    ['calcCapital','calcRiskPct','calcSL','calcRR'].forEach(id => {
      const inp = $(id); if (!inp) return;
      inp.addEventListener('input', recalc);
    });

    recalc();
  };
})();
