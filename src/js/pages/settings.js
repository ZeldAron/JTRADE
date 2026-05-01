// ─── SETTINGS ─────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);
  const t = k => i18n.t(k);

  const INSTRUMENTS = [
    'MES1','ES1','MNQ1','NQ1',
    'MYM1','YM1','M2K1','RTY1',
    'MGC1','GC1','QO1','MCL1','CL1','ZN1',
  ];

  // Groupes d'instruments par catégorie (pour la sidebar du modal & le label)
  const INSTR_CATEGORY = {
    MES1:'Indices Micro', ES1:'Indices Full', MNQ1:'Indices Micro', NQ1:'Indices Full',
    MYM1:'Indices Micro', YM1:'Indices Full', M2K1:'Indices Micro', RTY1:'Indices Full',
    MGC1:'Métaux', GC1:'Métaux', QO1:'Métaux', MCL1:'Énergie', CL1:'Énergie', ZN1:'Taux',
    'US500':'Indices CFD','US100':'Indices CFD','US30':'Indices CFD','GER40':'Indices CFD','UK100':'Indices CFD',
    'XAUUSD':'Métaux CFD','EURUSD':'Forex','GBPUSD':'Forex','USDJPY':'Forex','USOIL':'Énergie CFD',
  };
  const STATUS_LABEL = { evaluation: 'EVAL', funded: 'PA' };
  const STATUS_BADGE = { evaluation: 'ma-eval', funded: 'ma-funded' };

  function renderMyAccountsSettings() {
    const el = $('settingsMyAccounts');

    function render() {
      const myAccs = Store.getMyAccounts();
      const types  = Store.getAccountTypes();

      const listHtml = myAccs.length
        ? myAccs.map(a => {
            const tp = types.find(tp => tp.id === a.typeId) || {};
            return `
              <div class="ma-row">
                <span class="ma-badge ${STATUS_BADGE[a.status] || 'ma-eval'}">${STATUS_LABEL[a.status] || '?'}</span>
                <span class="ma-name">${UI.escHtml(a.name)}</span>
                <span class="ma-preset">${UI.escHtml(tp.name || '—')}</span>
                <span class="ma-stat">$${Number(a.capital).toLocaleString('fr-FR')}</span>
                <span class="ma-stat" style="color:var(--green)">TP +$${a.profitTarget}</span>
                <span class="ma-stat" style="color:var(--red)">DD -$${a.maxDrawdown}</span>
                <div class="ma-actions">
                  <button class="btn-ghost" style="padding:3px 10px;font-size:11px" data-ma-edit="${a.id}">${t('btn.edit')}</button>
                  <button class="btn-ghost btn-danger" style="padding:3px 10px;font-size:11px" data-ma-del="${a.id}">${t('btn.delete')}</button>
                </div>
              </div>`;
          }).join('')
        : `<p style="color:var(--muted);font-size:12px;padding:8px 0" data-i18n-html="set.acc.empty">
             ${t('set.acc.empty')}
           </p>`;

      const FIRM_LABELS = { apex: 'Apex', topstep: 'Topstep', ftmo: 'FTMO', lucid: 'Lucid' };
      const byFirm = {};
      types.forEach(tp => {
        const fk = tp.firmKey || tp.id.split('-')[0] || 'other';
        if (!byFirm[fk]) byFirm[fk] = [];
        byFirm[fk].push(tp);
      });
      const typeOptions = Object.entries(byFirm).map(([fk, tps]) =>
        `<optgroup label="${FIRM_LABELS[fk] || fk}">${tps.map(tp =>
          `<option value="${tp.id}">${UI.escHtml(tp.name)}</option>`
        ).join('')}</optgroup>`
      ).join('');

      el.innerHTML = `
        <div class="settings-section settings-section--wide">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h3 style="margin:0">${t('set.accounts')}</h3>
            <button class="btn-ghost" id="btnAddMyAccount">${t('set.acc.add')}</button>
          </div>

          <div id="maList">${listHtml}</div>

          <div id="maForm" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:14px" id="maFormTitle">${t('set.acc.new')}</div>
            <input type="hidden" id="maEditId">

            <div class="form-grid form-grid-2" style="margin-bottom:10px">
              <div class="form-field">
                <label class="form-label">${t('set.acc.name')}</label>
                <input class="form-input" type="text" id="maName" placeholder="ex: APEX-001">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.status')}</label>
                <select class="form-input" id="maStatus">
                  <option value="evaluation">${t('set.acc.eval')}</option>
                  <option value="funded">${t('set.acc.funded')}</option>
                </select>
              </div>
            </div>

            <div class="form-field" style="margin-bottom:12px">
              <label class="form-label">${t('set.acc.type')}</label>
              <select class="form-input" id="maTypeId">
                <option value="">${t('set.acc.type.ph')}</option>
                ${typeOptions}
              </select>
            </div>

            <div class="form-grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
              <div class="form-field">
                <label class="form-label">${t('set.acc.capital')}</label>
                <input class="form-input mono" type="number" id="maCapital" placeholder="50000">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.target')}</label>
                <input class="form-input mono" type="number" id="maProfitTarget">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.drawdown')}</label>
                <input class="form-input mono" type="number" id="maMaxDrawdown">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.daily')}</label>
                <input class="form-input mono" type="number" id="maDailyLoss">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.contracts')}</label>
                <input class="form-input mono" type="number" id="maMaxContracts">
              </div>
              <div class="form-field">
                <label class="form-label">${t('set.acc.fee')}</label>
                <input class="form-input mono" type="number" step="0.01" id="maFeePerSide">
              </div>
            </div>

            <div style="background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:12px 14px;margin-bottom:14px">
              <div class="form-field">
                <label class="form-label" style="color:var(--indigo,#6366f1)">${t('set.acc.pnloffset')} <span style="font-weight:400;color:var(--muted);font-size:10px">(optionnel)</span></label>
                <input class="form-input mono" type="number" step="1" id="maPnlOffset" placeholder="0" style="max-width:160px">
                <p style="font-size:11px;color:var(--muted);margin-top:5px">${t('set.acc.pnloffset.desc')}</p>
              </div>
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn-ghost" id="maBtnCancel">${t('set.acc.cancel')}</button>
              <button class="btn-primary" id="maBtnSave">${t('set.acc.save')}</button>
            </div>
          </div>
        </div>`;

      $('btnAddMyAccount').addEventListener('click', () => {
        if (!Store.canAddAccount()) {
          UI.toast(t('err.limit.account'), true);
          setTimeout(() => document.querySelector('[data-page="offers"]').click(), 1500);
          return;
        }
        $('maFormTitle').textContent = t('set.acc.new');
        $('maEditId').value = '';
        $('maName').value = ''; $('maStatus').value = 'evaluation';
        $('maTypeId').value = '';
        $('maCapital').value = ''; $('maProfitTarget').value = '';
        $('maMaxDrawdown').value = ''; $('maDailyLoss').value = '';
        $('maMaxContracts').value = ''; $('maFeePerSide').value = '2.14';
        $('maPnlOffset').value = '';
        $('maForm').style.display = 'block';
        $('maName').focus();
      });

      $('maTypeId').addEventListener('change', () => {
        const tp = types.find(tp => tp.id === $('maTypeId').value);
        if (!tp) return;
        $('maCapital').value      = tp.capital;
        $('maProfitTarget').value = tp.profitTarget;
        $('maMaxDrawdown').value  = tp.maxDrawdown;
        $('maDailyLoss').value    = tp.dailyLossLimit;
        $('maMaxContracts').value = tp.maxContracts;
        $('maFeePerSide').value   = (tp.feePerSide || 2.14).toFixed(2);
      });

      $('maBtnCancel').addEventListener('click', () => {
        $('maForm').style.display = 'none';
      });

      $('maBtnSave').addEventListener('click', () => {
        const name = $('maName').value.trim();
        if (!name) { UI.toast(t('err.name.required'), true); return; }
        if (name.length > 50) { UI.toast(t('err.name.invalid'), true); return; }

        const selType = types.find(tp => tp.id === $('maTypeId').value);
        const pnlOffsetRaw = $('maPnlOffset').value.trim();
        const data = {
          name,
          status:         $('maStatus').value,
          typeId:         $('maTypeId').value,
          firmKey:        selType?.firmKey || ($('maTypeId').value.split('-')[0] || ''),
          capital:        parseFloat($('maCapital').value)      || 50000,
          profitTarget:   parseFloat($('maProfitTarget').value) || 0,
          maxDrawdown:    parseFloat($('maMaxDrawdown').value)  || 0,
          dailyLossLimit: parseFloat($('maDailyLoss').value)    || 0,
          maxContracts:   parseInt($('maMaxContracts').value)   || 1,
          feePerSide:     parseFloat($('maFeePerSide').value)   || 2.14,
          pnlOffset:      pnlOffsetRaw !== '' ? (parseFloat(pnlOffsetRaw) || 0) : 0,
        };

        const editId = $('maEditId').value;
        if (editId) {
          Store.updateMyAccount(editId, data);
          UI.toast(t('set.acc.updated'));
        } else {
          Store.addMyAccount(data);
          UI.toast(t('set.acc.added'));
        }
        render();
      });

      el.querySelectorAll('[data-ma-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const acc = Store.getMyAccountById(btn.dataset.maEdit);
          if (!acc) return;
          $('maFormTitle').textContent = t('set.acc.edit');
          $('maEditId').value       = acc.id;
          $('maName').value         = acc.name;
          $('maStatus').value       = acc.status;
          $('maTypeId').value       = acc.typeId || '';
          $('maCapital').value      = acc.capital;
          $('maProfitTarget').value = acc.profitTarget;
          $('maMaxDrawdown').value  = acc.maxDrawdown;
          $('maDailyLoss').value    = acc.dailyLossLimit;
          $('maMaxContracts').value = acc.maxContracts;
          $('maFeePerSide').value   = (acc.feePerSide || 2.14).toFixed(2);
          $('maPnlOffset').value    = acc.pnlOffset || 0;
          $('maForm').style.display = 'block';
          $('maName').focus();
        });
      });

      el.querySelectorAll('[data-ma-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const acc = Store.getMyAccountById(btn.dataset.maDel);
          if (!acc || !confirm(t('confirm.acc.delete'))) return;
          Store.deleteMyAccount(btn.dataset.maDel);
          render();
          UI.toast(t('set.acc.deleted'));
        });
      });
    }

    render();
  }

  function renderPropFirmsSettings() {
    const el = $('settingsPropFirms');
    if (!el) return;

    const firms      = Store.getPropFirms();
    const FIRM_ORDER = ['apex', 'topstep', 'ftmo', 'lucid'];

    function ddBadge(type) {
      if (!type) return '';
      const lc = type.toLowerCase();
      if (lc.includes('statique') || lc.includes('static'))
        return `<span class="ac-badge" style="background:var(--border);color:var(--muted)">STATIC</span>`;
      if (lc.includes('intraday'))
        return `<span class="ac-badge" style="background:rgba(255,160,50,0.15);color:#f0a030">INTRA</span>`;
      return `<span class="ac-badge">EOD</span>`;
    }

    function mono(val, color) {
      return `<span style="font-family:'Geist Mono',monospace;font-size:12px;${color ? 'color:' + color : ''}">${val}</span>`;
    }

    function renderCards(key) {
      const firm = firms[key];
      if (!firm) return `<p style="color:var(--muted);font-size:12px">—</p>`;
      return `<div class="accounts-grid">${firm.accounts.map(a => `
        <div class="account-card">
          <div class="ac-header">
            <span class="ac-name" style="font-weight:700;font-size:13px">${a.size}</span>
            ${ddBadge(a.drawdownType)}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.capital')}</span>
            ${mono('$' + Number(a.capital).toLocaleString('fr-FR'))}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.target')}</span>
            ${mono('+$' + Number(a.profitTarget).toLocaleString('fr-FR'), 'var(--green)')}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.drawdown')}</span>
            ${mono('-$' + Number(a.maxDrawdown).toLocaleString('fr-FR'), 'var(--red)')}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.daily')}</span>
            ${a.dailyLossLimit
              ? mono('-$' + Number(a.dailyLossLimit).toLocaleString('fr-FR'), 'var(--red)')
              : mono('—', 'var(--muted)')}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.dd.type')}</span>
            <span style="font-size:10px;color:var(--muted2);text-align:right;max-width:55%;line-height:1.3">${a.drawdownType}</span>
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.min.days')}</span>
            ${mono(a.minTradingDays || '0')}
          </div>
          <div class="ac-field">
            <span class="ac-label">${t('set.pf.consistency')}</span>
            <span style="font-size:10px;color:var(--muted2);text-align:right;max-width:55%;line-height:1.3">${a.consistency}</span>
          </div>
          <div class="ac-field" style="align-items:flex-start">
            <span class="ac-label" style="padding-top:2px">${t('set.pf.payout')}</span>
            <span style="font-size:10px;color:var(--muted2);text-align:right;max-width:58%;line-height:1.4">${a.payoutConditions}</span>
          </div>
        </div>
      `).join('')}</div>`;
    }

    function render(activeKey) {
      const tabs = FIRM_ORDER
        .filter(k => firms[k])
        .map(k => `<button class="chip${activeKey === k ? ' active' : ''}" data-pf-tab="${k}">${firms[k].name}</button>`)
        .join('');

      el.innerHTML = `
        <div class="settings-section settings-section--wide">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h3 style="margin:0">${t('set.pf.title')}</h3>
            <span style="font-size:10px;background:var(--border);color:var(--muted);padding:2px 8px;border-radius:99px;letter-spacing:0.06em">🔒 ${t('set.apex.locked')}</span>
          </div>
          <div style="display:flex;gap:6px;margin:14px 0;flex-wrap:wrap">${tabs}</div>
          ${renderCards(activeKey)}
        </div>`;

      el.querySelectorAll('[data-pf-tab]').forEach(btn => {
        btn.addEventListener('click', () => render(btn.dataset.pfTab));
      });
    }

    render(FIRM_ORDER.find(k => firms[k]) || 'apex');
  }

  function renderSpreadsSettings() {
    const el         = $('settingsSpreads');
    if (!el) return;
    const firms      = Store.getPropFirms();
    const FIRM_ORDER = ['apex', 'topstep', 'ftmo', 'lucid'];

    function renderRows(firmKey) {
      const sp       = Store.getSpreadsByFirm(firmKey);
      const instrs   = Object.keys(sp);

      // Grouper par catégorie
      const groups = {};
      instrs.forEach(instr => {
        const cat = INSTR_CATEGORY[instr] || 'Autres';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(instr);
      });

      return Object.entries(groups).map(([cat, list]) => `
        <div style="margin-bottom:4px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted2);padding:10px 0 6px;font-weight:600">${UI.escHtml(cat)}</div>
          ${list.map(instr => {
            const safeInstr = UI.escHtml(instr);
            const val = (sp[instr] != null ? sp[instr] : 0).toFixed(2);
            return `
              <div class="settings-row" style="padding:5px 0">
                <label style="font-weight:600;font-family:'Geist Mono',monospace;font-size:12px">${safeInstr}</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:11px;color:var(--muted)">$</span>
                  <input class="form-input" type="number" min="0" step="0.01"
                    data-sp-instr="${safeInstr}" value="${val}"
                    style="width:80px;text-align:right;font-family:'Geist Mono',monospace">
                  <span style="font-size:11px;color:var(--muted)">/side</span>
                </div>
              </div>`;
          }).join('')}
        </div>`
      ).join('');
    }

    function render(activeKey) {
      const tabs = FIRM_ORDER
        .filter(k => firms[k])
        .map(k => `<button class="chip${activeKey === k ? ' active' : ''}" data-sp-tab="${k}">${firms[k].name}</button>`)
        .join('');

      el.innerHTML = `
        <div class="settings-section" style="max-width:560px">
          <h3>${t('set.spreads.title')}</h3>
          <p style="font-size:11px;color:var(--muted);margin-bottom:12px">${t('set.spreads.hint')}</p>
          <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">${tabs}</div>
          <div id="spRows">${renderRows(activeKey)}</div>
          <div class="settings-row" style="margin-top:12px;border-top:none">
            <span></span>
            <button class="btn-primary" id="btnSaveSpreads">${t('btn.save')}</button>
          </div>
        </div>`;

      el.querySelectorAll('[data-sp-tab]').forEach(btn => {
        btn.addEventListener('click', () => render(btn.dataset.spTab));
      });

      $('btnSaveSpreads').addEventListener('click', () => {
        const data = {};
        el.querySelectorAll('[data-sp-instr]').forEach(input => {
          data[input.dataset.spInstr] = Math.max(0, parseFloat(input.value) || 0);
        });
        Store.updateSpreadsByFirm(activeKey, data);
        UI.toast(t('set.sp.saved'));
      });
    }

    render(FIRM_ORDER.find(k => firms[k]) || 'apex');
  }

  function renderGroupsSettings() {
    const el = $('settingsGroups');
    if (!el) return;

    function render() {
      const grps = Store.getGroups();
      const accs = Store.getMyAccounts();

      const listHtml = grps.length
        ? grps.map(g => {
            const names = (g.accountIds || [])
              .map(id => accs.find(a => a.id === id))
              .filter(Boolean)
              .map(a => UI.escHtml(a.name))
              .join(', ');
            return `<div class="grp-row">
              <span class="grp-name">⬡ ${UI.escHtml(g.name)}</span>
              <span class="grp-accounts">${names || '—'}</span>
              <div class="grp-actions">
                <button class="btn-ghost" style="padding:3px 10px;font-size:11px" data-grp-edit="${g.id}">${t('btn.edit')}</button>
                <button class="btn-ghost btn-danger" style="padding:3px 10px;font-size:11px" data-grp-del="${g.id}">${t('btn.delete')}</button>
              </div>
            </div>`;
          }).join('')
        : `<p style="color:var(--muted);font-size:12px;padding:8px 0">${t('set.grp.empty.hint')}</p>`;

      const checkboxes = accs.map(a =>
        `<label class="grp-check-row">
          <input type="checkbox" class="grp-acc-check" value="${a.id}">
          ${UI.escHtml(a.name)}
        </label>`
      ).join('');

      el.innerHTML = `
        <div class="settings-section settings-section--wide">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h3 style="margin:0">${t('set.groups')}</h3>
            <button class="btn-ghost" id="btnAddGroup">${t('set.grp.add')}</button>
          </div>

          <div id="grpList">${listHtml}</div>

          <div id="grpForm" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:14px" id="grpFormTitle">${t('set.grp.new')}</div>
            <input type="hidden" id="grpEditId">
            <div class="form-field" style="margin-bottom:12px">
              <label class="form-label">${t('set.grp.name')}</label>
              <input class="form-input" type="text" id="grpName" placeholder="ex: Apex Principal">
            </div>
            <div class="form-field" style="margin-bottom:14px">
              <label class="form-label" style="margin-bottom:8px">${t('set.grp.accounts')}</label>
              <div class="grp-checkboxes">${checkboxes || `<span style="color:var(--muted);font-size:12px">${t('set.grp.no.accounts')}</span>`}</div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn-ghost" id="grpBtnCancel">${t('set.grp.cancel')}</button>
              <button class="btn-primary" id="grpBtnSave">${t('set.grp.save')}</button>
            </div>
          </div>
        </div>`;

      $('btnAddGroup').addEventListener('click', () => {
        $('grpFormTitle').textContent = t('set.grp.new');
        $('grpEditId').value = '';
        $('grpName').value = '';
        el.querySelectorAll('.grp-acc-check').forEach(cb => cb.checked = false);
        $('grpForm').style.display = 'block';
        $('grpName').focus();
      });

      $('grpBtnCancel').addEventListener('click', () => {
        $('grpForm').style.display = 'none';
      });

      $('grpBtnSave').addEventListener('click', () => {
        const name = $('grpName').value.trim();
        if (!name) { UI.toast(t('err.grp.name'), true); return; }
        if (name.length > 50) { UI.toast(t('err.name.invalid'), true); return; }
        const accountIds = Array.from(el.querySelectorAll('.grp-acc-check:checked')).map(cb => cb.value);
        const editId = $('grpEditId').value;
        if (editId) {
          Store.updateGroup(editId, { name, accountIds });
          UI.toast(t('set.grp.updated'));
        } else {
          Store.addGroup({ name, accountIds });
          UI.toast(t('set.grp.added'));
        }
        render();
      });

      el.querySelectorAll('[data-grp-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const g = Store.getGroupById(btn.dataset.grpEdit);
          if (!g) return;
          $('grpFormTitle').textContent = t('set.grp.edit');
          $('grpEditId').value = g.id;
          $('grpName').value   = g.name;
          el.querySelectorAll('.grp-acc-check').forEach(cb => {
            cb.checked = (g.accountIds || []).includes(cb.value);
          });
          $('grpForm').style.display = 'block';
          $('grpName').focus();
        });
      });

      el.querySelectorAll('[data-grp-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const g = Store.getGroupById(btn.dataset.grpDel);
          if (!g || !confirm(t('confirm.grp.delete'))) return;
          Store.deleteGroup(btn.dataset.grpDel);
          render();
          UI.toast(t('set.grp.deleted'));
        });
      });
    }

    render();
  }

  UI.initSettings = function () {
    try { renderGroupsSettings(); }    catch(e) { console.error('[Settings] groups error:', e); }
    try { renderMyAccountsSettings(); } catch(e) { console.error('[Settings] accounts error:', e); }
    try { renderPropFirmsSettings(); }  catch(e) { console.error('[Settings] propfirms error:', e); }
    try { renderSpreadsSettings(); }    catch(e) { console.error('[Settings] spreads error:', e); }

    // Tab switching
    document.querySelectorAll('[data-settings-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-settings-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('[data-settings-pane]').forEach(p => { p.style.display = 'none'; });
        btn.classList.add('active');
        document.querySelector(`[data-settings-pane="${btn.dataset.settingsTab}"]`).style.display = '';
      });
    });

    const s = Store.getSettings();

    $('setGroqKey').value = s.groqKey || '';
    $('btnSaveGroq').addEventListener('click', () => {
      const key = $('setGroqKey').value.trim();
      Store.updateSettings({ groqKey: key });
      const st = $('groqKeyStatus');
      st.textContent = key ? t('set.groq.saved') : t('set.groq.cleared');
      st.style.color = key ? 'var(--green)' : 'var(--muted)';
    });
    if (s.groqKey) {
      $('groqKeyStatus').textContent = t('set.groq.ok');
      $('groqKeyStatus').style.color = 'var(--green)';
    }

    $('btnExport').addEventListener('click', () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'zeldtrade-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      UI.toast(t('set.export.done'));
    });

    $('btnImport').addEventListener('click', () => $('importFile').click());

    $('importFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { UI.toast(t('err.file.large'), true); e.target.value = ''; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            Store.importTrades(data);
            UI.renderList();
            UI.updateStats();
            UI.toast(t('set.import.done').replace('{n}', data.length));
          }
        } catch { UI.toast(t('set.import.err'), true); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // ── Import CSV ─────────────────────────────────────────────────────────────
    const CSV_TEMPLATE = [
      '# ZeldTrade — Modèle CSV',
      '# direction : long | short',
      '# outcome   : win | loss | be | open  (ou laisser vide si pnl renseigné)',
      '# Si exitPrice OU pnl fourni, outcome est déduit automatiquement',
      'date,instrument,direction,outcome,entry,sl,tp1,exitPrice,pnl,contracts,account,setup,notes',
      '2024-01-15 09:30,MES1,long,win,4800.25,4795.00,4810.50,4810.50,,2,Apex-50K,ORB,Bon trade',
      '2024-01-15 14:00,MNQ1,short,loss,18200.00,18215.00,18160.00,18215.00,,1,Apex-50K,Breakout,,',
      '2024-01-16 10:15,MES1,long,be,4805.50,4800.00,4815.00,4805.50,,1,Apex-50K,,,',
    ].join('\n');

    function normalizeCSVDate(str) {
      str = str.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const d = new Date(str.length <= 10 ? str + 'T12:00:00Z' : str);
        return isNaN(d) ? null : d.toISOString();
      }
      const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (m) {
        const d = new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T12:00:00Z`);
        return isNaN(d) ? null : d.toISOString();
      }
      const d = new Date(str);
      return isNaN(d) ? null : d.toISOString();
    }

    function parseCSVText(text) {
      const firstLine = text.split('\n').find(l => l.trim() && !l.trim().startsWith('#')) || '';
      const delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

      function parseLine(line) {
        const cols = []; let cur = ''; let inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { inQ = !inQ; }
          else if (ch === delim && !inQ) { cols.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        cols.push(cur.trim());
        return cols;
      }

      const COL_MAP = {
        date:       ['date','datetime','time','trade date','tradedate','open time','opentime','opened','open date'],
        instrument: ['instrument','symbol','ticker','contract','asset','market','symbole'],
        direction:  ['direction','side','type','action','buy/sell','buysell','sens'],
        outcome:    ['outcome','result','status','résultat','resultat'],
        entry:      ['entry','entry price','entryprice','open price','openprice','price open','prix entrée','prix entree'],
        sl:         ['sl','stop','stoploss','stop loss','stop_loss','stop-loss'],
        tp1:        ['tp1','tp','target','take profit','takeprofit','objectif'],
        exitPrice:  ['exit','exitprice','exit price','close','close price','closeprice','price close','prix sortie'],
        pnl:        ['pnl','net pnl','netpnl','p&l','profit','profit/loss','net profit','gain','realised p&l','realized p&l','résultat net','resultat net'],
        contracts:  ['contracts','qty','quantity','lots','size','volume','nb contracts','nb contrats','contrats','quantité','quantite'],
        account:    ['account','apex','firm','account name','accountname','compte','nom du compte'],
        setup:      ['setup','strategy','stratégie','strategie','pattern'],
        notes:      ['notes','note','comment','comments','description','memo','commentaire'],
      };

      const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
      if (lines.length < 2) return { trades: [], skipped: 0 };

      const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g,'').trim());
      const colIdx  = {};
      for (const [field, aliases] of Object.entries(COL_MAP)) {
        for (const alias of aliases) {
          const idx = headers.indexOf(alias);
          if (idx >= 0 && colIdx[field] === undefined) { colIdx[field] = idx; break; }
        }
      }

      const trades  = [];
      let   skipped = 0;
      const get = (cols, field) => colIdx[field] !== undefined ? (cols[colIdx[field]] || '').replace(/['"]/g,'').trim() : '';

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseLine(line);
        const gf   = f => get(cols, f);

        const dateISO = normalizeCSVDate(gf('date'));
        if (!dateISO) { skipped++; continue; }

        const instrument = gf('instrument').toUpperCase();
        if (!instrument) { skipped++; continue; }

        const dirRaw = gf('direction').toLowerCase().trim();
        let direction;
        if (['long','buy','b','l','bto','buy to open','achat'].includes(dirRaw)) direction = 'long';
        else if (['short','sell','s','sto','sell to open','vente'].includes(dirRaw)) direction = 'short';
        else { skipped++; continue; }

        const contracts = Math.max(1, Math.min(999, parseInt(gf('contracts')) || 1));
        const entry     = parseFloat(gf('entry').replace(',','.'))     || null;
        const sl        = parseFloat(gf('sl').replace(',','.'))        || null;
        const tp1       = parseFloat(gf('tp1').replace(',','.'))       || null;
        let   exitPrice = parseFloat(gf('exitPrice').replace(',','.')) || null;
        const pnlRaw    = parseFloat(gf('pnl').replace(',','.'));

        if (!exitPrice && !isNaN(pnlRaw) && pnlRaw !== 0 && entry) {
          const pv = Calc.pointValue(instrument);
          if (pv > 0) {
            const pts = pnlRaw / (pv * contracts);
            exitPrice = Math.round((direction === 'long' ? entry + pts : entry - pts) * 10000) / 10000;
          }
        }

        const outRaw = gf('outcome').toLowerCase().trim();
        let outcome;
        const WIN_WORDS  = ['win','profit','winner','tp','take profit','yes','w','gagné','gagne'];
        const LOSS_WORDS = ['loss','loser','sl','stop loss','no','l','perdu'];
        const BE_WORDS   = ['be','breakeven','break even','break-even','neutre','neutral','scratch'];
        if (WIN_WORDS.includes(outRaw))  outcome = 'win';
        else if (LOSS_WORDS.includes(outRaw)) outcome = 'loss';
        else if (BE_WORDS.includes(outRaw))   outcome = 'be';
        else if (!isNaN(pnlRaw)) {
          outcome = pnlRaw > 0 ? 'win' : pnlRaw < 0 ? 'loss' : 'be';
        } else {
          outcome = exitPrice ? (exitPrice > (entry || 0) ? 'win' : exitPrice < (entry || 0) ? 'loss' : 'be') : 'open';
        }

        const trade = {
          date: dateISO, instrument, direction, outcome,
          entry: entry || 0, sl: sl || 0, tp1: tp1 || 0, contracts,
          apex:  gf('account'), setup: gf('setup'), notes: gf('notes'),
        };
        if (exitPrice) trade.exitPrice = exitPrice;

        trades.push(trade);
      }
      return { trades, skipped };
    }

    $('btnCsvTemplate').addEventListener('click', () => {
      const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'zeldtrade-modele.csv';
      a.click();
    });

    $('btnImportCsv').addEventListener('click', () => $('importCsvFile').click());

    $('importCsvFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { UI.toast(t('err.file.large'), true); e.target.value = ''; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const { trades, skipped } = parseCSVText(ev.target.result);
          if (trades.length === 0 && skipped === 0) { UI.toast(t('set.csv.import.err'), true); return; }
          if (trades.length > 0) {
            Store.importTrades(trades);
            UI.renderList();
            UI.updateStats();
            UI.toast(t('set.csv.import.done').replace('{n}', trades.length));
          }
          if (skipped > 0) setTimeout(() => UI.toast(t('set.csv.import.warn').replace('{n}', skipped), true), trades.length > 0 ? 3200 : 0);
        } catch (err) { UI.toast(t('set.csv.import.err'), true); }
      };
      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    });

    $('btnClearAll').addEventListener('click', () => {
      if (!confirm(t('set.clear.confirm'))) return;
      Store.clearTrades();
      UI.selectedId = null;
      UI.renderList();
      UI.renderDetail();
      UI.updateStats();
      UI.toast(t('set.clear.done'));
    });

    // ── Suppression de compte ──────────────────────────────────────────────────
    const delOverlay    = $('deleteAccountOverlay');
    const delConfirmBtn = $('delConfirmBtn');
    const delCancelBtn  = $('delCancelBtn');
    const delError      = $('delError');

    $('btnDeleteAccount').addEventListener('click', () => {
      $('delEmail').value    = '';
      $('delPassword').value = '';
      delError.textContent   = '';
      delOverlay.style.display = 'flex';
      setTimeout(() => $('delEmail').focus(), 50);
    });

    delCancelBtn.addEventListener('click', () => {
      delOverlay.style.display = 'none';
    });

    delOverlay.addEventListener('click', e => {
      if (e.target === delOverlay) delOverlay.style.display = 'none';
    });

    delConfirmBtn.addEventListener('click', async () => {
      const email    = $('delEmail').value.trim();
      const password = $('delPassword').value;
      delError.textContent = '';

      if (!email || !password) {
        delError.textContent = t('auth.err.required');
        return;
      }

      delConfirmBtn.disabled   = true;
      delConfirmBtn.textContent = t('del.modal.deleting');

      const result = await Auth.deleteAccount(email, password);

      if (result.ok) {
        delOverlay.style.display = 'none';
        // Firebase signOut se déclenche automatiquement après delete()
        // mais on force quand même le retour à la landing
        window.location.reload();
      } else {
        delError.textContent     = result.error;
        delConfirmBtn.disabled   = false;
        delConfirmBtn.textContent = t('del.modal.confirm');
      }
    });

    $('delPassword').addEventListener('keydown', e => {
      if (e.key === 'Enter') delConfirmBtn.click();
    });
  };
})();
