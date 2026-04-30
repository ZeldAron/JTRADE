// ─── ANALYTICS ────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);
  const t = k => i18n.t(k);

  UI.renderAnalytics = function () {
    const el  = $('analyticsContent');
    const all = Store.getTrades();

    if (!all.length) {
      el.innerHTML = `<div class="page-title">${t('page.analytics')}</div><p style="color:var(--muted)">${t('analytics.no.data')}</p>`;
      return;
    }

    const setups = {};
    const instrs = {};

    all.forEach(tr => {
      const c      = Calc.trade(tr);
      const netPnl = c.netPnl !== null ? c.netPnl : 0;

      if (tr.setup) {
        if (!setups[tr.setup]) setups[tr.setup] = { wins:0, total:0, pnl:0 };
        setups[tr.setup].total++;
        if (tr.outcome === 'win') setups[tr.setup].wins++;
        setups[tr.setup].pnl += netPnl;
      }

      if (!instrs[tr.instrument]) instrs[tr.instrument] = { wins:0, total:0, pnl:0 };
      instrs[tr.instrument].total++;
      if (tr.outcome === 'win') instrs[tr.instrument].wins++;
      instrs[tr.instrument].pnl += netPnl;
    });

    const setupRows = Object.entries(setups)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, v]) => {
        const wr = v.total ? v.wins / v.total * 100 : 0;
        return `<tr>
          <td>${UI.escHtml(name)}</td>
          <td>${v.total}</td>
          <td>
            <div class="wr-bar-wrap">
              <div class="wr-bar-bg">
                <div class="wr-bar-fill" style="width:${wr}%;background:${wr >= 50 ? 'var(--green)' : 'var(--red)'}"></div>
              </div>
              <span style="font-size:11px;font-family:'Geist Mono';color:${wr >= 50 ? 'var(--green)' : 'var(--red)'};width:32px;text-align:right">${wr.toFixed(0)}%</span>
            </div>
          </td>
          <td style="font-family:'Geist Mono';color:${v.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">${Calc.formatPnL(v.pnl)}</td>
        </tr>`;
      }).join('');

    const instrRows = Object.entries(instrs).map(([name, v]) => {
      const wr = v.total ? v.wins / v.total * 100 : 0;
      return `<tr>
        <td>${UI.escHtml(name)}</td><td>${v.total}</td>
        <td style="color:${wr >= 50 ? 'var(--green)' : 'var(--red)'}">${wr.toFixed(0)}%</td>
        <td style="font-family:'Geist Mono';color:${v.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">${Calc.formatPnL(v.pnl)}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="page-title">${t('page.analytics')}</div>
      <div class="two-col">
        <div class="chart-card">
          <h3>${t('analytics.setup.perf')}</h3>
          ${setupRows
            ? `<table class="a-table"><thead><tr><th>${t('analytics.col.setup')}</th><th>${t('analytics.col.total')}</th><th>${t('analytics.col.wr')}</th><th>${t('analytics.col.pnl')}</th></tr></thead><tbody>${setupRows}</tbody></table>`
            : `<p style="color:var(--muted);font-size:12px">${t('analytics.no.setup')}</p>`}
        </div>
        <div class="chart-card">
          <h3>${t('analytics.by.instrument')}</h3>
          <table class="a-table">
            <thead><tr><th>${t('analytics.col.instr')}</th><th>${t('analytics.col.total')}</th><th>${t('analytics.col.wrs')}</th><th>${t('analytics.col.pnl')}</th></tr></thead>
            <tbody>${instrRows}</tbody>
          </table>
        </div>
      </div>`;
  };
})();
