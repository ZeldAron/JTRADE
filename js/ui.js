// ─── UI CORE ──────────────────────────────────────────────────────────────────
// Shared state, utilities, toast, sidebar stats, trade list + detail
// Page renderers are assigned by js/pages/*.js

const UI = (() => {
  const $ = id => document.getElementById(id);

  // Shared state
  let selectedId    = null;
  let currentFilter = 'all';

  // Shared constants (exposed for page files)
  const OB_CLASS = { win:'ob-win', loss:'ob-loss', be:'ob-be', open:'ob-open' };
  const OB_LABEL = { win: i18n.t('ob.win'), loss: i18n.t('ob.loss'), be: i18n.t('ob.be'), open: i18n.t('ob.open') };
  const MICRO_RATES = {
    bnc:          { cotis: 24.6, cfp: 0.2, vl: 2.2, abat: 34, labelKey: 'micro.bnc.label' },
    bic_services: { cotis: 21.2, cfp: 0.3, vl: 1.7, abat: 50, labelKey: 'micro.bic.services.label' },
    bic_vente:    { cotis: 12.3, cfp: 0.1, vl: 1.0, abat: 71, labelKey: 'micro.bic.vente.label' },
  };

  // ── Shared helpers (exposed on UI for page files) ───────────────────────────
  function localDay(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function statsForTrades(trades) {
    const closed   = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
    const wins     = closed.filter(t => t.outcome === 'win');
    const totalPnL = trades.reduce((s, t) => s + (Calc.trade(t).netPnl || 0), 0);
    const winRate  = closed.length ? (wins.length / closed.length) * 100 : null;
    const avgRR    = trades.length ? trades.reduce((s, t) => s + Calc.trade(t).rr, 0) / trades.length : 0;
    return { totalPnL, winRate, avgRR, total: trades.length,
      open: trades.filter(t => t.outcome === 'open').length,
      wins: wins.length, losses: closed.length - wins.length };
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg, isError = false) {
    const el = $('toast');
    el.textContent = msg;
    el.className   = 'toast' + (isError ? ' error' : '');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }

  // ── Sidebar stats ───────────────────────────────────────────────────────────
  function updateStats() {
    const s   = Store.getStats();
    const pEl = $('statPnL');
    pEl.textContent = s.total > 0
      ? (s.totalPnL >= 0 ? '+' : '-') + '$' + Math.abs(s.totalPnL).toFixed(0)
      : '—';
    pEl.style.color = s.totalPnL > 0 ? 'var(--green)'
                    : s.totalPnL < 0 ? 'var(--red)'
                    : 'var(--muted)';
    const wEl = $('statWR');
    wEl.textContent = s.winRate !== null ? s.winRate.toFixed(0) + '%' : '—';
    wEl.style.color = s.winRate >= 50 ? 'var(--green)'
                    : s.winRate !== null ? 'var(--red)'
                    : 'var(--muted)';
    $('statCount').textContent = s.total;
  }

  // ── Trade list ──────────────────────────────────────────────────────────────
  function getFiltered() {
    const q = ($('searchInput').value || '').toLowerCase();
    return Store.getTrades().filter(t => {
      const matchFilter = currentFilter === 'all' || t.outcome === currentFilter;
      const matchSearch = !q || [t.instrument, t.setup, t.apex, t.notes]
        .some(s => (s || '').toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }

  function renderList() {
    const list     = $('tradeList');
    const filtered = getFiltered();

    if (!filtered.length) {
      const msg = Store.getTrades().length ? i18n.t('ui.no.results') : i18n.t('ui.no.trades');
      list.innerHTML = `
        <div class="empty-list">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
          </svg>
          <p>${msg}</p>
        </div>`;
      return;
    }

    list.innerHTML = filtered.map(t => {
      const c       = Calc.trade(t);
      const dc      = t.direction === 'long' ? 'var(--green)' : 'var(--red)';
      const rrC     = Calc.rrColor(c.rr);
      const date    = new Date(t.date).toLocaleDateString(i18n.locale(), {
        day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
      });
      const pnlHtml = c.pnl !== null && !c.estimated
        ? `<span class="trade-pnl" style="color:${Calc.pnlColor(c.pnl)}">${Calc.formatPnL(c.pnl)}</span>`
        : '';
      const setupHtml = t.setup
        ? `<div class="trade-setup">${escHtml(t.setup)}</div>`
        : '';

      return `<div class="trade-item ${selectedId === t.id ? 'selected' : ''}" data-id="${t.id}">
        <div class="trade-bar" style="background:${dc}"></div>
        <div class="trade-item-body">
          <div class="trade-item-top">
            <span class="trade-instr">${t.instrument}</span>
            <span class="dir-badge dir-${t.direction}">${t.direction.toUpperCase()}</span>
            <span class="outcome-badge ${OB_CLASS[t.outcome]}">${OB_LABEL[t.outcome]}</span>
          </div>
          <div class="trade-item-meta">
            <span>${date}${t.apex ? ' · ' + escHtml(t.apex) : ''}</span>
            <span class="trade-rr" style="color:${rrC}">${c.rr.toFixed(2)}R</span>
            ${pnlHtml}
          </div>
          ${setupHtml}
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.trade-item').forEach(el => {
      el.addEventListener('click', () => selectTrade(el.dataset.id));
    });
  }

  // ── Detail ──────────────────────────────────────────────────────────────────
  function selectTrade(id) {
    selectedId = id;
    renderList();
    renderDetail();
  }

  function renderDetail() {
    const panel = $('detailPanel');
    const t     = selectedId ? Store.getTradeById(selectedId) : null;

    if (!t) {
      panel.innerHTML = `
        <div class="detail-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          </svg>
          <p>${i18n.t('ui.select.trade')}</p>
        </div>`;
      return;
    }

    const c    = Calc.trade(t);
    const date = new Date(t.date).toLocaleDateString(i18n.locale(), {
      weekday:'long', day:'numeric', month:'long', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });

    const apexClass = c.riskPct <= 1.5 ? 'apex-ok' : c.riskPct <= 2 ? 'apex-warn' : 'apex-err';
    const apexMsg   = c.riskPct <= 1.5
      ? i18n.t('ui.apex.ok',   { pct: c.riskPct.toFixed(2) })
      : c.riskPct <= 2
        ? i18n.t('ui.apex.warn', { pct: c.riskPct.toFixed(2) })
        : i18n.t('ui.apex.err',  { pct: c.riskPct.toFixed(2) });

    const tpCards = buildTpCards(t, c);
    const pnlCard = c.netPnl !== null
      ? `<div class="metric-card">
           <div class="mc-label">${c.estimated ? i18n.t('ui.pnl.potential') : i18n.t('ui.pnl.net')}</div>
           <div class="mc-val" style="color:${Calc.pnlColor(c.netPnl)}">${c.estimated ? '~' : ''}${Calc.formatPnL(c.netPnl)}</div>
           <div class="mc-sub">${c.estimated ? i18n.t('ui.pnl.estimated') : i18n.t('ui.gross') + ' ' + Calc.formatPnL(c.pnl) + ' · Comm. -$' + c.commFees.toFixed(2) + ' · Spread -$' + c.spreadFees.toFixed(2)}</div>
         </div>`
      : '';

    const infoCard = (t.setup || t.notes || t.apex)
      ? `<div class="info-card">
           <h4>${i18n.t('ui.analysis')}</h4>
           ${t.apex  ? `<div class="info-row"><span class="info-key">${i18n.t('ui.apex.account')}</span><span class="info-val">${escHtml(t.apex)}</span></div>` : ''}
           ${t.setup ? `<div class="info-row"><span class="info-key">${i18n.t('ui.setup')}</span><span class="info-val">${escHtml(t.setup)}</span></div>` : ''}
           ${t.notes ? `<div class="info-row"><span class="info-key">${i18n.t('ui.notes')}</span><span class="info-val">${escHtml(t.notes)}</span></div>` : ''}
         </div>`
      : '';

    const contractLabel = t.contracts > 1 ? i18n.t('ui.contracts') : i18n.t('ui.contract');

    panel.innerHTML = `
      <div class="detail-content">
        <div class="detail-header">
          <div>
            <div class="detail-title-row">
              <span class="detail-instr">${t.instrument}</span>
              <span class="dir-badge dir-${t.direction}" style="font-size:12px;padding:3px 9px">${t.direction.toUpperCase()}</span>
              <span class="outcome-badge ${OB_CLASS[t.outcome]}" style="font-size:11px;padding:3px 9px">${OB_LABEL[t.outcome]}</span>
            </div>
            <div class="detail-date">${date}</div>
          </div>
          <div class="detail-actions">
            <button class="btn-ghost" id="detailBtnEdit">${i18n.t('btn.edit')}</button>
            <button class="btn-ghost btn-danger" id="detailBtnDelete">${i18n.t('btn.delete')}</button>
          </div>
        </div>

        <div class="metrics-strip">
          <div class="metric-card">
            <div class="mc-label">R:R</div>
            <div class="mc-val" style="color:${Calc.rrColor(c.rr)}">${c.rr.toFixed(2)}R</div>
            <div class="mc-sub">${Calc.rrLabel(c.rr)}</div>
          </div>
          <div class="metric-card">
            <div class="mc-label">${i18n.t('ui.risk.usd')}</div>
            <div class="mc-val" style="color:var(--red)">-$${c.riskUSD.toFixed(0)}</div>
            <div class="mc-sub">${c.riskTicks} ticks</div>
          </div>
          <div class="metric-card">
            <div class="mc-label">${i18n.t('ui.reward.usd')}</div>
            <div class="mc-val" style="color:var(--green)">+$${c.rewardUSD.toFixed(0)}</div>
            <div class="mc-sub">${c.rewardTicks} ticks</div>
          </div>
          <div class="metric-card">
            <div class="mc-label">Risk %</div>
            <div class="mc-val" style="color:${Calc.riskColor(c.riskPct)}">${c.riskPct.toFixed(2)}%</div>
          </div>
          ${pnlCard}
        </div>

        <div class="levels-row">
          <div class="level-card lc-entry">
            <div class="lc-label">Entry</div>
            <div class="lc-price">${t.entry.toFixed(2)}</div>
            <div class="lc-ticks">${t.direction.toUpperCase()}</div>
          </div>
          <div class="level-card lc-sl">
            <div class="lc-label">SL</div>
            <div class="lc-price">${t.sl.toFixed(2)}</div>
            <div class="lc-ticks">${c.riskTicks} ticks</div>
          </div>
          ${tpCards}
          ${t.exitPrice ? `<div class="level-card lc-exit"><div class="lc-label">Exit</div><div class="lc-price">${t.exitPrice.toFixed(2)}</div></div>` : ''}
        </div>

        <div class="apex-bar ${apexClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ${apexMsg}
          <span class="apex-right">${t.contracts} ${contractLabel} · $${c.pv}/pt</span>
        </div>

        ${infoCard}
      </div>`;

    $('detailBtnEdit').addEventListener('click', () => {
      Modal.open(t.id, saved => {
        selectTrade(saved.id);
        updateStats();
      });
    });

    $('detailBtnDelete').addEventListener('click', () => {
      if (!confirm(i18n.t('confirm.trade.delete'))) return;
      Store.deleteTrade(t.id);
      selectedId = Store.getTrades()[0]?.id || null;
      renderList();
      renderDetail();
      updateStats();
      toast(i18n.t('ui.trade.deleted'));
    });
  }

  function buildTpCards(t, c) {
    const tps = [
      { label: 'TP1', price: t.tp1, ticks: c.rewardTicks },
      t.tp2 ? { label: 'TP2', price: t.tp2, ticks: null } : null,
      t.tp3 ? { label: 'TP3', price: t.tp3, ticks: null } : null,
    ].filter(Boolean);

    return tps.map(tp => `
      <div class="level-card lc-tp">
        <div class="lc-label">${tp.label}</div>
        <div class="lc-price">${tp.price.toFixed(2)}</div>
        ${tp.ticks ? `<div class="lc-ticks">${tp.ticks} ticks</div>` : ''}
      </div>`).join('');
  }

  return {
    toast, updateStats, renderList, selectTrade, renderDetail,
    // Shared utilities exposed for js/pages/*.js
    escHtml, localDay, statsForTrades,
    OB_CLASS, OB_LABEL, MICRO_RATES,
    setFilter: (f) => { currentFilter = f; renderList(); },
    get selectedId()  { return selectedId; },
    set selectedId(v) { selectedId = v; },
    // Page render functions — assigned by js/pages/*.js after this script loads
    renderDashboard: () => {},
    renderAnalytics: () => {},
    renderGoals:     () => {},
    renderCalendar:  () => {},
    renderMicro:     () => {},
    initSettings:    () => {},
  };
})();
