// ─── DASHBOARD ────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);
  const t = k => i18n.t(k);

  let dashFilter = null;
  let pnlChart   = null;

  function tradesForFilter(filter) {
    const all = Store.getTrades();
    if (!filter || filter === 'all') return all;
    if (filter.startsWith('acc:')) {
      const name = filter.slice(4);
      return all.filter(t => t.apex === name);
    }
    if (filter.startsWith('grp:')) {
      const grp = Store.getGroupById(filter.slice(4));
      if (!grp) return [];
      const names = (grp.accountIds || [])
        .map(id => Store.getMyAccountById(id))
        .filter(Boolean)
        .map(a => a.name);
      return all.filter(t => names.includes(t.apex));
    }
    return all;
  }

  function progressBar(pct, color, label, sub) {
    const clamped = Math.min(100, Math.max(0, pct));
    const barColor = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : color;
    return `<div class="dash-progress">
      <div class="dp-header"><span>${label}</span><span style="color:${barColor}">${sub}</span></div>
      <div class="dp-track"><div class="dp-fill" style="width:${clamped}%;background:${barColor}"></div></div>
    </div>`;
  }

  function accountCard(acc, trades) {
    const s         = UI.statsForTrades(trades);
    const today     = new Date().toISOString().split('T')[0];
    const todayLoss = trades
      .filter(tr => tr.date.startsWith(today) && tr.outcome === 'loss')
      .reduce((sum, tr) => sum + Math.abs(Calc.trade(tr).netPnl || 0), 0);

    const ddPct     = acc.maxDrawdown    ? Math.min(100, (Math.abs(Math.min(0, s.totalPnL)) / acc.maxDrawdown) * 100) : 0;
    const dailyPct  = acc.dailyLossLimit ? Math.min(100, (todayLoss / acc.dailyLossLimit) * 100) : 0;
    const targetPct = acc.profitTarget   ? Math.min(100, (Math.max(0, s.totalPnL) / acc.profitTarget) * 100) : 0;
    const STATUS_LABEL = { evaluation:'EVAL', funded:'PA' };
    const STATUS_C     = { evaluation:'var(--amber)', funded:'var(--green)' };
    const badge = STATUS_LABEL[acc.status] || '?';
    const bclr  = STATUS_C[acc.status]  || 'var(--muted)';

    return `<div class="dash-acc-card">
      <div class="dac-header">
        <div>
          <span class="dac-badge" style="color:${bclr};border-color:${bclr}">${badge}</span>
          <span class="dac-name">${UI.escHtml(acc.name)}</span>
        </div>
        <span class="dac-pnl" style="color:${s.totalPnL >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${s.totalPnL >= 0 ? '+' : '-'}$${Math.abs(s.totalPnL).toFixed(0)}
        </span>
      </div>
      <div class="dac-kpis">
        <div class="dac-kpi"><div class="dac-kpi-val">${s.winRate !== null ? s.winRate.toFixed(0) + '%' : '—'}</div><div class="dac-kpi-lbl">${t('dash.win.rate')}</div></div>
        <div class="dac-kpi"><div class="dac-kpi-val">${s.avgRR.toFixed(2)}R</div><div class="dac-kpi-lbl">${t('dash.avg.rr')}</div></div>
        <div class="dac-kpi"><div class="dac-kpi-val">${s.total}</div><div class="dac-kpi-lbl">${t('dash.trades')}</div></div>
        <div class="dac-kpi"><div class="dac-kpi-val">${s.open}</div><div class="dac-kpi-lbl">${t('dash.open')}</div></div>
      </div>
      ${acc.profitTarget   ? progressBar(targetPct, 'var(--green)', t('dash.profit.target'), '+$' + Math.max(0, s.totalPnL).toFixed(0) + ' / $' + acc.profitTarget) : ''}
      ${acc.maxDrawdown    ? progressBar(ddPct,      'var(--amber)', t('dash.drawdown.used'), '$' + Math.abs(Math.min(0, s.totalPnL)).toFixed(0) + ' / $' + acc.maxDrawdown) : ''}
      ${acc.dailyLossLimit ? progressBar(dailyPct,   'var(--red)',   t('dash.daily.loss'),   '$' + todayLoss.toFixed(0) + ' / $' + acc.dailyLossLimit) : ''}
    </div>`;
  }

  function renderPnlChart(containerId, trades) {
    const canvas = $(containerId);
    if (!canvas) return;

    const byDay = {};
    trades.forEach(tr => {
      const d = UI.localDay(tr.date);
      byDay[d] = (byDay[d] || 0) + (Calc.trade(tr).netPnl || 0);
    });
    const days = Object.keys(byDay).sort();
    if (!days.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';

    const startDate = new Date(days[0] + 'T12:00:00');
    startDate.setDate(startDate.getDate() - 1);
    const startDay = UI.localDay(startDate.toISOString());

    let cum = 0;
    const cumPnL = [
      { d: startDay, v: 0 },
      ...days.map(d => { cum += byDay[d]; return { d, v: cum }; }),
    ];

    if (cumPnL.length === 2) {
      const nextDate = new Date(days[days.length - 1] + 'T12:00:00');
      nextDate.setDate(nextDate.getDate() + 1);
      cumPnL.push({ d: UI.localDay(nextDate.toISOString()), v: cumPnL[cumPnL.length - 1].v });
    }

    const isPositive = cumPnL[cumPnL.length - 1].v >= 0;
    const lineColor  = isPositive ? '#00e5a0' : '#ff5767';
    const fillStart  = isPositive ? 'rgba(45,212,160,0.18)' : 'rgba(240,82,79,0.15)';

    if (pnlChart) { pnlChart.destroy(); pnlChart = null; }
    const ctx = canvas.getContext('2d');
    pnlChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels:   cumPnL.map(p => p.d),
        datasets: [{
          data:                 cumPnL.map(p => p.v),
          borderColor:          lineColor,
          borderWidth:          2.5,
          pointRadius:          cumPnL.map((_, i) => (i === 0 || i === cumPnL.length - 1) ? 0 : 3),
          pointBackgroundColor: lineColor,
          tension:              0.35,
          fill:                 true,
          backgroundColor: ctx2 => {
            const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height);
            g.addColorStop(0, fillStart);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            return g;
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f1f26',
            borderColor:     'rgba(255,255,255,0.1)',
            borderWidth:     1,
            padding:         10,
            callbacks: { label: c => ' P&L : ' + Calc.formatPnL(c.parsed.y) },
          },
        },
        scales: {
          x: {
            ticks:  { color:'#55556a', font:{ size:10, family:"'Geist Mono',monospace" }, maxTicksLimit:8, maxRotation:0 },
            grid:   { display:false },
            border: { display:false },
          },
          y: {
            ticks:  { color:'#55556a', font:{ size:10, family:"'Geist Mono',monospace" }, callback: v => '$'+v.toFixed(0) },
            grid:   { color:'rgba(255,255,255,0.05)' },
            border: { display:false },
          },
        },
      },
    });
  }

  function kpiCard(label, value, sub, color) {
    return `<div class="kpi-card">
      <div class="kpi-val" style="color:${color}">${value}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-sub">${sub}</div>
    </div>`;
  }

  UI.renderDashboard = function () {
    const el     = $('dashContent');
    const all    = Store.getTrades();
    const accs   = Store.getMyAccounts();
    const grps   = Store.getGroups();
    const trades = tradesForFilter(dashFilter);
    const s      = UI.statsForTrades(trades);

    const currentVal = dashFilter || 'all';
    let opts = `<option value="all"${currentVal==='all'?' selected':''}>${t('dash.all.accounts')}</option>`;
    if (accs.length) {
      opts += `<optgroup label="${t('dash.accounts.grp')}">`;
      opts += accs.map(a => {
        const v = 'acc:' + a.name;
        return `<option value="${UI.escHtml(v)}"${currentVal===v?' selected':''}>${UI.escHtml(a.name)}</option>`;
      }).join('');
      opts += `</optgroup>`;
    }
    if (grps.length) {
      opts += `<optgroup label="${t('dash.groups.grp')}">`;
      opts += grps.map(g => {
        const v = 'grp:' + g.id;
        return `<option value="${UI.escHtml(v)}"${currentVal===v?' selected':''}>${UI.escHtml(g.name)}</option>`;
      }).join('');
      opts += `</optgroup>`;
    }
    const filterBar = `<div class="dash-selector-row">
      <select class="dash-account-select" id="dashAccountSelect">${opts}</select>
    </div>`;

    let body = '';

    if (dashFilter && dashFilter.startsWith('acc:')) {
      const accName = dashFilter.slice(4);
      const acc     = accs.find(a => a.name === accName);
      if (acc) body = accountCard(acc, trades);
      body += `<div class="chart-card"><h3>${t('dash.pnl.curve')}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div></div>`;
    } else if (dashFilter && dashFilter.startsWith('grp:')) {
      const grp  = Store.getGroupById(dashFilter.slice(4));
      const kpis = `<div class="kpi-grid">
        ${kpiCard(t('ui.pnl.net'), (s.totalPnL>=0?'+':'-')+'$'+Math.abs(s.totalPnL).toFixed(0), s.total+' trades', s.totalPnL>=0?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.win.rate'), s.winRate!==null ? s.winRate.toFixed(0)+'%' : '—', s.wins+'W · '+s.losses+'L', (s.winRate||0)>=50?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.avg.rr'), s.avgRR.toFixed(2)+'R', t('dash.group'), s.avgRR>=1.5?'var(--green)':'var(--amber)')}
        ${kpiCard(t('dash.open'), s.open.toString(), t('dash.in.progress'), 'var(--blue)')}
      </div>`;
      body = kpis;
      body += `<div class="chart-card"><h3>${t('dash.pnl.group', { name: UI.escHtml(grp?.name || '') })}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div></div>`;
      if (grp && grp.accountIds && grp.accountIds.length) {
        body += `<div class="dash-group-accounts">`;
        grp.accountIds.forEach(accId => {
          const acc = Store.getMyAccountById(accId);
          if (!acc) return;
          body += accountCard(acc, trades.filter(tr => tr.apex === acc.name));
        });
        body += `</div>`;
      }
    } else {
      const kpis = `<div class="kpi-grid">
        ${kpiCard(t('ui.pnl.net'), (s.totalPnL>=0?'+':'-')+'$'+Math.abs(s.totalPnL).toFixed(0), s.total+' trades', s.totalPnL>=0?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.win.rate'), s.winRate!==null ? s.winRate.toFixed(0)+'%' : '—', s.wins+'W · '+s.losses+'L', (s.winRate||0)>=50?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.avg.rr'), s.avgRR.toFixed(2)+'R', t('dash.all.trades'), s.avgRR>=1.5?'var(--green)':'var(--amber)')}
        ${kpiCard(t('dash.open'), s.open.toString(), t('dash.in.progress'), 'var(--blue)')}
      </div>`;
      body = kpis;
      body += `<div class="chart-card"><h3>${t('dash.pnl.cumul')}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div></div>`;
      if (accs.length) {
        body += `<div class="dash-group-accounts">`;
        accs.forEach(acc => {
          body += accountCard(acc, all.filter(tr => tr.apex === acc.name));
        });
        body += `</div>`;
      }
    }

    if (trades.length) {
      body += `<div class="chart-card"><h3>${t('dash.recent.trades')}</h3><div id="recentRows">` +
        trades.slice(0, 6).map(tr => {
          const c    = Calc.trade(tr);
          const date = new Date(tr.date).toLocaleDateString(i18n.locale(), { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
          const safeDir = tr.direction === 'long' ? 'long' : 'short';
          const dirC = safeDir === 'long' ? 'var(--green)' : 'var(--red)';
          return `<div class="recent-row">
            <div class="recent-bar" style="background:${dirC}"></div>
            <span class="recent-instr">${UI.escHtml(tr.instrument)}</span>
            <span class="recent-dir" style="color:${dirC}">${safeDir.toUpperCase()}</span>
            ${tr.apex ? `<span class="recent-date" style="color:var(--muted)">${UI.escHtml(tr.apex)}</span>` : ''}
            <span class="recent-date">${date}</span>
            <span class="recent-rr" style="color:${Calc.rrColor(c.rr)}">${c.rr.toFixed(2)}R</span>
            ${c.pnl!==null ? `<span class="recent-pnl" style="color:${Calc.pnlColor(c.pnl)}">${Calc.formatPnL(c.pnl)}</span>` : ''}
          </div>`;
        }).join('') + `</div></div>`;
    }

    const titleRow = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div class="page-title" style="margin-bottom:0">Dashboard</div>
      ${filterBar.replace('<div class="dash-selector-row">', '<div class="dash-selector-row" style="margin-bottom:0">')}
    </div>`;
    el.innerHTML = titleRow + body;

    const sel = $('dashAccountSelect');
    if (sel) sel.addEventListener('change', () => {
      dashFilter = sel.value === 'all' ? null : sel.value;
      UI.renderDashboard();
    });

    try { renderPnlChart('pnlChart', trades); } catch(e) { console.warn('[Chart]', e); }
  };
})();
