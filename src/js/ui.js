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

  // YYYY-MM-DD au fuseau local — à utiliser pour comparer aux dates de trades
  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
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

      const safeDir = t.direction === 'long' ? 'long' : 'short';
      return `<div class="trade-item ${selectedId === t.id ? 'selected' : ''}" data-id="${escHtml(t.id)}">
        <div class="trade-bar" style="background:${dc}"></div>
        <div class="trade-item-body">
          <div class="trade-item-top">
            <span class="trade-instr">${escHtml(t.instrument)}</span>
            <span class="dir-badge dir-${safeDir}">${safeDir.toUpperCase()}</span>
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
    // Mobile : afficher le panel et cacher la liste
    const layout = document.querySelector('.journal-layout');
    if (layout) layout.classList.toggle('has-detail', !!id);
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

    // Si manualPnl override → le partial est ignoré dans le calcul, mais on l'affiche
    // quand même comme info contextuelle (avec mention "ignoré").
    const hasManualOverride = t.manualPnl != null && t.manualPnl !== '' && !isNaN(Number(t.manualPnl)) && t.outcome !== 'open';
    const partialRow = c.hasPartial
      ? `<div class="info-row"><span class="info-key">Partial close</span><span class="info-val" style="color:var(--purple-l)">${c.partialPercent}% à ${c.partialPrice.toFixed(2)}${hasManualOverride ? ' <span style="color:var(--muted);font-size:11px">(ignoré — P&L manuel)</span>' : ''}</span></div>`
      : '';

    const infoCard = (t.setup || t.notes || t.apex || c.hasPartial)
      ? `<div class="info-card">
           <h4>${i18n.t('ui.analysis')}</h4>
           ${t.apex  ? `<div class="info-row"><span class="info-key">${i18n.t('ui.apex.account')}</span><span class="info-val">${escHtml(t.apex)}</span></div>` : ''}
           ${partialRow}
           ${t.setup ? `<div class="info-row"><span class="info-key">${i18n.t('ui.setup')}</span><span class="info-val">${escHtml(t.setup)}</span></div>` : ''}
           ${t.notes ? `<div class="info-row"><span class="info-key">${i18n.t('ui.notes')}</span><span class="info-val">${escHtml(t.notes)}</span></div>` : ''}
         </div>`
      : '';

    // Screenshot du trade (s'il existe) — cliquable pour lightbox plein écran
    const screenshotCard = t.screenshotPath
      ? `<div class="info-card" style="margin-top:14px">
           <h4 style="margin-bottom:10px">📸 Screenshot</h4>
           <div class="trade-screenshot-wrap" style="position:relative;background:var(--bg-deeper,#0a0a0a);border-radius:8px;overflow:hidden;cursor:zoom-in;min-height:180px;display:flex;align-items:center;justify-content:center">
             <img id="tradeShotImg" alt="Screenshot du trade" style="max-width:100%;max-height:400px;display:block;border-radius:8px;opacity:0;transition:opacity 0.2s">
             <div id="tradeShotLoading" style="position:absolute;color:var(--muted);font-size:13px">Chargement…</div>
           </div>
         </div>`
      : '';

    const cfd = Calc.isCFD(t.instrument);
    const contractLabel = cfd ? 'lots' : (t.contracts > 1 ? i18n.t('ui.contracts') : i18n.t('ui.contract'));
    const contractDisplay = cfd ? t.contracts.toFixed(2) : t.contracts;

    panel.innerHTML = `
      <button class="detail-back-btn" id="detailBackBtn" style="display:none">
        ${i18n.t('ui.back') || '← Retour'}
      </button>
      <div class="detail-content">
        <div class="detail-header">
          <div>
            <div class="detail-title-row">
              <span class="detail-instr">${escHtml(t.instrument)}</span>
              <span class="dir-badge dir-${t.direction === 'long' ? 'long' : 'short'}" style="font-size:12px;padding:3px 9px">${t.direction === 'long' ? 'LONG' : 'SHORT'}</span>
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
            <div class="mc-sub">${cfd ? c.riskPts.toFixed(cfd ? 2 : 0) + ' pts' : c.riskTicks + ' ticks'}</div>
          </div>
          <div class="metric-card">
            <div class="mc-label">${i18n.t('ui.reward.usd')}</div>
            <div class="mc-val" style="color:var(--green)">+$${c.rewardUSD.toFixed(0)}</div>
            <div class="mc-sub">${cfd ? c.rewardPts.toFixed(2) + ' pts' : c.rewardTicks + ' ticks'}</div>
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
            <div class="lc-ticks">${(t.direction === 'long' ? 'long' : 'short').toUpperCase()}</div>
          </div>
          <div class="level-card lc-sl">
            <div class="lc-label">SL</div>
            <div class="lc-price">${t.sl.toFixed(2)}</div>
            <div class="lc-ticks">${cfd ? c.riskPts.toFixed(2) + ' pts' : c.riskTicks + ' ticks'}</div>
          </div>
          ${tpCards}
          ${t.exitPrice ? `<div class="level-card lc-exit"><div class="lc-label">Exit</div><div class="lc-price">${t.exitPrice.toFixed(2)}</div></div>` : ''}
        </div>

        <div class="apex-bar ${apexClass}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ${apexMsg}
          <span class="apex-right">${contractDisplay} ${contractLabel}${cfd ? '' : ' · $' + c.pv + '/pt'}</span>
        </div>

        ${infoCard}
        ${screenshotCard}
      </div>`;

    // Charge l'image du screenshot async dès que le panel est rendu
    if (t.screenshotPath) {
      const imgEl     = $('tradeShotImg');
      const loadingEl = $('tradeShotLoading');
      Store.getTradeScreenshotUrl(t.screenshotPath).then(url => {
        if (url && imgEl) {
          imgEl.src = url;
          imgEl.onload = () => {
            imgEl.style.opacity = '1';
            if (loadingEl) loadingEl.style.display = 'none';
          };
          imgEl.onerror = () => {
            if (loadingEl) loadingEl.textContent = 'Image introuvable';
          };
          // Click pour lightbox plein écran
          const wrap = imgEl.parentElement;
          if (wrap) wrap.addEventListener('click', () => openLightbox(url));
        } else if (loadingEl) {
          loadingEl.textContent = 'Screenshot indisponible';
        }
      });
    }

    // Bouton retour mobile
    const backBtn = $('detailBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        selectedId = null;
        const layout = document.querySelector('.journal-layout');
        if (layout) layout.classList.remove('has-detail');
        renderList();
        renderDetail();
      });
    }

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
      const layout = document.querySelector('.journal-layout');
      if (layout) layout.classList.remove('has-detail');
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

  // ── Lightbox : affichage plein écran d'une image ─────────────────────────────
  // Construction via DOM API (jamais d'innerHTML interpolant l'URL — defense-in-depth)
  function openLightbox(url) {
    if (!url) return;
    closeLightbox();
    const overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:24px';

    const img = document.createElement('img');
    img.alt = 'Screenshot';
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.8)';
    img.src = url;  // setter src : encodage automatique, pas d'interprétation HTML
    overlay.appendChild(img);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.title = 'Fermer (Échap)';
    btn.style.cssText = 'position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center';
    btn.addEventListener('click', closeLightbox);
    overlay.appendChild(btn);

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', _lightboxKeyHandler);
  }
  function closeLightbox() {
    const el = $('lightboxOverlay');
    if (el) el.remove();
    document.removeEventListener('keydown', _lightboxKeyHandler);
  }
  function _lightboxKeyHandler(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  return {
    toast, updateStats, renderList, selectTrade, renderDetail,
    // Shared utilities exposed for js/pages/*.js
    escHtml, localDay, localToday, statsForTrades,
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
