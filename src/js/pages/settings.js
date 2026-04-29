// ─── SETTINGS ─────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);
  const t = k => i18n.t(k);

  const INSTRUMENTS  = ['MES1', 'ES1', 'MNQ1', 'NQ1'];
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

      const typeOptions = types.map(tp =>
        `<option value="${tp.id}">${UI.escHtml(tp.name)}</option>`
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

        const data = {
          name,
          status:         $('maStatus').value,
          typeId:         $('maTypeId').value,
          capital:        parseFloat($('maCapital').value)      || 50000,
          profitTarget:   parseFloat($('maProfitTarget').value) || 0,
          maxDrawdown:    parseFloat($('maMaxDrawdown').value)  || 0,
          dailyLossLimit: parseFloat($('maDailyLoss').value)    || 0,
          maxContracts:   parseInt($('maMaxContracts').value)   || 1,
          feePerSide:     parseFloat($('maFeePerSide').value)   || 2.14,
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
    const el      = $('settingsSpreads');
    const spreads = Store.getSpreads();

    const rows = INSTRUMENTS.map(instr => {
      const val = (spreads[instr] != null ? spreads[instr] : 0).toFixed(2);
      return `
        <div class="settings-row">
          <label style="font-weight:600">${instr}</label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--muted)">$</span>
            <input class="form-input" type="number" min="0" step="0.01"
              id="spread-${instr}" value="${val}"
              style="width:80px;text-align:right;font-family:'Geist Mono',monospace">
            <span style="font-size:11px;color:var(--muted)">${t('set.spreads.unit')}</span>
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="settings-section" style="max-width:600px">
        <h3>${t('set.spreads.title')}</h3>
        <p style="font-size:11px;color:var(--muted);margin-bottom:12px">
          ${t('set.spreads.hint')}
        </p>
        ${rows}
        <div class="settings-row" style="margin-top:12px;border-top:none">
          <span></span>
          <button class="btn-primary" id="btnSaveSpreads">${t('btn.save')}</button>
        </div>
      </div>`;

    $('btnSaveSpreads').addEventListener('click', () => {
      const data = {};
      INSTRUMENTS.forEach(instr => {
        data[instr] = Math.max(0, parseFloat($(`spread-${instr}`).value) || 0);
      });
      Store.updateSpreads(data);
      UI.toast(t('set.sp.saved'));
    });
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
              .map(a => a.name)
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
    try { renderGroupsSettings(); } catch(e) { console.error('[Settings] groups render error:', e); }
    renderMyAccountsSettings();
    renderPropFirmsSettings();
    renderSpreadsSettings();

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

    $('btnClearAll').addEventListener('click', () => {
      if (!confirm(t('set.clear.confirm'))) return;
      Store.clearTrades();
      UI.selectedId = null;
      UI.renderList();
      UI.renderDetail();
      UI.updateStats();
      UI.toast(t('set.clear.done'));
    });
  };
})();
