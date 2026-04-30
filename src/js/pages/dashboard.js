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

  function computeEquityStats(trades) {
    const closed = trades
      .filter(tr => tr.outcome !== 'open')
      .map(tr => ({ tr, pnl: Calc.trade(tr).netPnl || 0 }))
      .sort((a, b) => (a.tr.date || '') < (b.tr.date || '') ? -1 : 1);

    if (!closed.length) return null;

    let cum = 0, peak = 0, maxDD = 0, sumWins = 0, sumLosses = 0;
    let best = -Infinity, worst = Infinity;

    closed.forEach(({ pnl }) => {
      cum += pnl;
      if (cum > peak) peak = cum;
      const dd = peak - cum;
      if (dd > maxDD) maxDD = dd;
      if (pnl > 0) sumWins += pnl;
      if (pnl < 0) sumLosses += Math.abs(pnl);
      if (pnl > best)  best  = pnl;
      if (pnl < worst) worst = pnl;
    });

    const pf = sumLosses > 0 ? sumWins / sumLosses : (sumWins > 0 ? Infinity : 0);
    const expectancy = closed.length ? cum / closed.length : 0;

    let streak = 0, streakType = null;
    for (let i = closed.length - 1; i >= 0; i--) {
      const o = closed[i].tr.outcome;
      if (o !== 'win' && o !== 'loss') { if (streak === 0) continue; break; }
      if (streakType === null) streakType = o;
      if (o === streakType) streak++;
      else break;
    }

    return {
      maxDD,
      pf,
      expectancy,
      best:  best  === -Infinity ? 0 : best,
      worst: worst ===  Infinity ? 0 : worst,
      streak,
      streakType,
    };
  }

  function renderPnlChart(containerId, trades) {
    const canvas = $(containerId);
    if (!canvas) return;

    const sorted = trades
      .slice()
      .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);

    if (!sorted.length) { canvas.style.display = 'none'; return; }
    canvas.style.display = '';

    let cum = 0;
    const labels = [''];
    const values = [0];
    const tradePnls = [0];
    sorted.forEach(tr => {
      const pnl = Calc.trade(tr).netPnl || 0;
      cum += pnl;
      labels.push(tr.date ? tr.date.slice(0, 10) : '');
      values.push(cum);
      tradePnls.push(pnl);
    });

    const isPositive = values[values.length - 1] >= 0;
    const lineColor  = isPositive ? '#00e5a0' : '#ff5767';
    const fillStart  = isPositive ? 'rgba(45,212,160,0.18)' : 'rgba(240,82,79,0.15)';

    if (pnlChart) { pnlChart.destroy(); pnlChart = null; }
    const ctx = canvas.getContext('2d');

    pnlChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data:                 values,
          borderColor:          lineColor,
          borderWidth:          2.5,
          pointRadius:          values.map((_, i) => (i === 0 || i === values.length - 1) ? 0 : 4),
          pointBackgroundColor: ['#636366', ...sorted.map(tr =>
            tr.outcome === 'win' ? '#30d158' : tr.outcome === 'loss' ? '#ff5767' : '#636366'
          )],
          tension:              0.35,
          fill:                 true,
          backgroundColor:      fillStart,
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
            callbacks: {
              label: c => {
                const i   = c.dataIndex;
                const cum = Calc.formatPnL(c.parsed.y);
                if (i === 0) return ' Départ : $0';
                const tr  = sorted[i - 1];
                const dir = tr.direction === 'long' ? '↑' : '↓';
                const pnlSign = tradePnls[i] >= 0 ? '+' : '';
                return ` ${tr.instrument} ${dir}  ${pnlSign}${Calc.formatPnL(tradePnls[i])}   ∑ ${cum}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks:  { color:'#55556a', font:{ size:10, family:"'Geist Mono',monospace" }, maxTicksLimit:8, maxRotation:0 },
            grid:   { display: false },
            border: { display: false },
          },
          y: {
            ticks:  { color:'#55556a', font:{ size:10, family:"'Geist Mono',monospace" }, callback: v => '$'+v.toFixed(0) },
            grid:   { color: 'rgba(255,255,255,0.05)' },
            border: { display: false },
          },
        },
      },
    });

    // Stats strip
    const stats   = computeEquityStats(trades);
    const statsEl = $('pnlStats');
    if (!stats || !statsEl) return;

    const isEn  = i18n.getLang() === 'en';
    const pfStr = stats.pf === Infinity ? '∞' : stats.pf.toFixed(2);
    const pfCol = stats.pf >= 1.5 ? 'var(--green)' : stats.pf >= 1 ? 'var(--amber)' : 'var(--red)';
    const streakVal = stats.streak > 0
      ? `${stats.streakType === 'win' ? '🔥' : '❄️'} ${stats.streak}`
      : '–';
    const streakLbl = stats.streakType === 'win'
      ? (isEn ? 'consec. wins' : 'W consécutifs')
      : stats.streakType === 'loss'
        ? (isEn ? 'consec. losses' : 'L consécutives')
        : (isEn ? 'Streak' : 'Série');

    statsEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:600;font-family:'Geist Mono';color:var(--red)">${stats.maxDD > 0 ? '-$' + stats.maxDD.toFixed(0) : '–'}</div>
          <div style="font-size:10px;color:var(--muted)">Max Drawdown</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:600;font-family:'Geist Mono';color:${pfCol}">${pfStr}</div>
          <div style="font-size:10px;color:var(--muted)">Profit Factor</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:600;font-family:'Geist Mono';color:${stats.expectancy >= 0 ? 'var(--green)' : 'var(--red)'}">${Calc.formatPnL(stats.expectancy)}</div>
          <div style="font-size:10px;color:var(--muted)">${isEn ? 'Expectancy' : 'Espérance/trade'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:600;font-family:'Geist Mono';color:var(--green)">${Calc.formatPnL(stats.best)}</div>
          <div style="font-size:10px;color:var(--muted)">${isEn ? 'Best trade' : 'Meilleur trade'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:13px;font-weight:600;font-family:'Geist Mono';color:var(--red)">${Calc.formatPnL(stats.worst)}</div>
          <div style="font-size:10px;color:var(--muted)">${isEn ? 'Worst trade' : 'Pire trade'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:14px;font-weight:600">${streakVal}</div>
          <div style="font-size:10px;color:var(--muted)">${streakLbl}</div>
        </div>
      </div>`;
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
      body += `<div class="chart-card"><h3>${t('dash.pnl.curve')}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div><div id="pnlStats"></div></div>`;
    } else if (dashFilter && dashFilter.startsWith('grp:')) {
      const grp  = Store.getGroupById(dashFilter.slice(4));
      const kpis = `<div class="kpi-grid">
        ${kpiCard(t('ui.pnl.net'), (s.totalPnL>=0?'+':'-')+'$'+Math.abs(s.totalPnL).toFixed(0), s.total+' trades', s.totalPnL>=0?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.win.rate'), s.winRate!==null ? s.winRate.toFixed(0)+'%' : '—', s.wins+'W · '+s.losses+'L', (s.winRate||0)>=50?'var(--green)':'var(--red)')}
        ${kpiCard(t('dash.avg.rr'), s.avgRR.toFixed(2)+'R', t('dash.group'), s.avgRR>=1.5?'var(--green)':'var(--amber)')}
        ${kpiCard(t('dash.open'), s.open.toString(), t('dash.in.progress'), 'var(--blue)')}
      </div>`;
      body = kpis;
      body += `<div class="chart-card"><h3>${t('dash.pnl.group', { name: UI.escHtml(grp?.name || '') })}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div><div id="pnlStats"></div></div>`;
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
      body += `<div class="chart-card"><h3>${t('dash.pnl.cumul')}</h3><div class="chart-area"><canvas id="pnlChart"></canvas></div><div id="pnlStats"></div></div>`;
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

    const _dbgEl = $('pnlChart');
    if (_dbgEl) {
      const _vals = trades.map(tr => (Calc.trade(tr).netPnl || 0).toFixed(2));
      _dbgEl.parentElement.insertAdjacentHTML('beforebegin',
        `<p id="chartDbg" style="font-size:10px;color:var(--muted);margin-bottom:4px">
          Chart=${typeof Chart} · trades=${trades.length} · netPnls=[${_vals.join(', ')}]
        </p>`);
    }

    if (typeof Chart === 'undefined') {
      const ca = $('pnlChart');
      if (ca) ca.parentElement.innerHTML = '<p style="color:var(--red);font-size:13px;padding:20px 0">⚠ Chart.js non chargé. Recharge avec Cmd+Shift+R.</p>';
    } else {
      requestAnimationFrame(() => {
        try {
          renderPnlChart('pnlChart', trades);
        } catch(e) {
          const ca = $('pnlChart');
          if (ca) ca.parentElement.innerHTML = '<p style="color:var(--red);font-size:12px;padding:20px 0">⚠ Erreur : ' + String(e).slice(0, 300) + '</p>';
          console.error('[Chart error]', e);
        }
      });
    }
  };
})();
