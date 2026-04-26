// ─── ANALYTICS ────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);

  UI.renderAnalytics = function () {
    const el  = $('analyticsContent');
    const all = Store.getTrades();

    if (!all.length) {
      el.innerHTML = `<div class="page-title">Analytics</div><p style="color:var(--muted)">Aucune donnée — ajoute des trades.</p>`;
      return;
    }

    const setups = {};
    const instrs = {};

    all.forEach(t => {
      const c      = Calc.trade(t);
      const netPnl = c.netPnl !== null ? c.netPnl : 0;

      if (t.setup) {
        if (!setups[t.setup]) setups[t.setup] = { wins:0, total:0, pnl:0 };
        setups[t.setup].total++;
        if (t.outcome === 'win') setups[t.setup].wins++;
        setups[t.setup].pnl += netPnl;
      }

      if (!instrs[t.instrument]) instrs[t.instrument] = { wins:0, total:0, pnl:0 };
      instrs[t.instrument].total++;
      if (t.outcome === 'win') instrs[t.instrument].wins++;
      instrs[t.instrument].pnl += netPnl;
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
        <td>${name}</td><td>${v.total}</td>
        <td style="color:${wr >= 50 ? 'var(--green)' : 'var(--red)'}">${wr.toFixed(0)}%</td>
        <td style="font-family:'Geist Mono';color:${v.pnl >= 0 ? 'var(--green)' : 'var(--red)'}">${Calc.formatPnL(v.pnl)}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="page-title">Analytics</div>
      <div class="two-col">
        <div class="chart-card">
          <h3>Performance par setup</h3>
          ${setupRows
            ? `<table class="a-table"><thead><tr><th>Setup</th><th>Total</th><th>Win rate</th><th>P&L</th></tr></thead><tbody>${setupRows}</tbody></table>`
            : '<p style="color:var(--muted);font-size:12px">Aucun setup renseigné</p>'}
        </div>
        <div class="chart-card">
          <h3>Par instrument</h3>
          <table class="a-table">
            <thead><tr><th>Instrument</th><th>Trades</th><th>WR</th><th>P&L</th></tr></thead>
            <tbody>${instrRows}</tbody>
          </table>
        </div>
      </div>`;
  };
})();
