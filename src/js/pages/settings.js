// ─── SETTINGS ─────────────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);

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
            const t = types.find(t => t.id === a.typeId) || {};
            return `
              <div class="ma-row">
                <span class="ma-badge ${STATUS_BADGE[a.status] || 'ma-eval'}">${STATUS_LABEL[a.status] || '?'}</span>
                <span class="ma-name">${UI.escHtml(a.name)}</span>
                <span class="ma-preset">${UI.escHtml(t.name || '—')}</span>
                <span class="ma-stat">$${Number(a.capital).toLocaleString('fr-FR')}</span>
                <span class="ma-stat" style="color:var(--green)">TP +$${a.profitTarget}</span>
                <span class="ma-stat" style="color:var(--red)">DD -$${a.maxDrawdown}</span>
                <div class="ma-actions">
                  <button class="btn-ghost" style="padding:3px 10px;font-size:11px" data-ma-edit="${a.id}">Modifier</button>
                  <button class="btn-ghost btn-danger" style="padding:3px 10px;font-size:11px" data-ma-del="${a.id}">Supprimer</button>
                </div>
              </div>`;
          }).join('')
        : `<p style="color:var(--muted);font-size:12px;padding:8px 0">
             Aucun compte — cliquez sur <strong>+ Ajouter</strong> pour créer votre premier compte.
           </p>`;

      const typeOptions = types.map(t =>
        `<option value="${t.id}">${UI.escHtml(t.name)}</option>`
      ).join('');

      el.innerHTML = `
        <div class="settings-section settings-section--wide">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h3 style="margin:0">Mes Comptes</h3>
            <button class="btn-ghost" id="btnAddMyAccount">+ Ajouter un compte</button>
          </div>

          <div id="maList">${listHtml}</div>

          <div id="maForm" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:14px" id="maFormTitle">Nouveau compte</div>
            <input type="hidden" id="maEditId">

            <div class="form-grid form-grid-2" style="margin-bottom:10px">
              <div class="form-field">
                <label class="form-label">Nom du compte</label>
                <input class="form-input" type="text" id="maName" placeholder="ex: APEX-001">
              </div>
              <div class="form-field">
                <label class="form-label">Statut</label>
                <select class="form-input" id="maStatus">
                  <option value="evaluation">Evaluation</option>
                  <option value="funded">Funded (PA)</option>
                </select>
              </div>
            </div>

            <div class="form-field" style="margin-bottom:12px">
              <label class="form-label">Basé sur (preset Apex)</label>
              <select class="form-input" id="maTypeId">
                <option value="">— Sélectionner un preset —</option>
                ${typeOptions}
              </select>
            </div>

            <div class="form-grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
              <div class="form-field">
                <label class="form-label">Capital ($)</label>
                <input class="form-input mono" type="number" id="maCapital" placeholder="50000">
              </div>
              <div class="form-field">
                <label class="form-label">Objectif ($)</label>
                <input class="form-input mono" type="number" id="maProfitTarget">
              </div>
              <div class="form-field">
                <label class="form-label">Drawdown max ($)</label>
                <input class="form-input mono" type="number" id="maMaxDrawdown">
              </div>
              <div class="form-field">
                <label class="form-label">Loss limit / jour ($)</label>
                <input class="form-input mono" type="number" id="maDailyLoss">
              </div>
              <div class="form-field">
                <label class="form-label">Contrats max</label>
                <input class="form-input mono" type="number" id="maMaxContracts">
              </div>
              <div class="form-field">
                <label class="form-label">Frais / side ($)</label>
                <input class="form-input mono" type="number" step="0.01" id="maFeePerSide">
              </div>
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn-ghost" id="maBtnCancel">Annuler</button>
              <button class="btn-primary" id="maBtnSave">Enregistrer</button>
            </div>
          </div>
        </div>`;

      $('btnAddMyAccount').addEventListener('click', () => {
        if (!Store.canAddAccount()) {
          UI.toast('Limite Basic : 1 compte de trading. Passez Pro pour en ajouter plus.', true);
          setTimeout(() => document.querySelector('[data-page="offers"]').click(), 1500);
          return;
        }
        $('maFormTitle').textContent = 'Nouveau compte';
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
        const t = types.find(t => t.id === $('maTypeId').value);
        if (!t) return;
        $('maCapital').value      = t.capital;
        $('maProfitTarget').value = t.profitTarget;
        $('maMaxDrawdown').value  = t.maxDrawdown;
        $('maDailyLoss').value    = t.dailyLossLimit;
        $('maMaxContracts').value = t.maxContracts;
        $('maFeePerSide').value   = (t.feePerSide || 2.14).toFixed(2);
      });

      $('maBtnCancel').addEventListener('click', () => {
        $('maForm').style.display = 'none';
      });

      $('maBtnSave').addEventListener('click', () => {
        const name = $('maName').value.trim();
        if (!name) { UI.toast('Le nom du compte est requis', true); return; }

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
          UI.toast(i18n.t('set.acc.updated'));
        } else {
          Store.addMyAccount(data);
          UI.toast(i18n.t('set.acc.added'));
        }
        render();
      });

      el.querySelectorAll('[data-ma-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const acc = Store.getMyAccountById(btn.dataset.maEdit);
          if (!acc) return;
          $('maFormTitle').textContent = 'Modifier le compte';
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
          if (!acc || !confirm(`Supprimer le compte "${acc.name}" ?`)) return;
          Store.deleteMyAccount(btn.dataset.maDel);
          render();
          UI.toast(i18n.t('set.acc.deleted'));
        });
      });
    }

    render();
  }

  function renderAccountTypesSettings() {
    const el       = $('settingsAccountTypes');
    const accounts = Store.getAccountTypes();

    el.innerHTML = `
      <div class="settings-section settings-section--wide">
        <h3>Comptes Apex EOD</h3>
        <div class="accounts-grid">
          ${accounts.map(a => `
            <div class="account-card" data-id="${a.id}">
              <div class="ac-header">
                <input class="ac-name" type="text" value="${UI.escHtml(a.name)}" data-field="name">
                <span class="ac-badge">EOD</span>
              </div>
              <div class="ac-field">
                <span class="ac-label">Capital ($)</span>
                <input class="ac-input" type="number" value="${a.capital}" data-field="capital">
              </div>
              <div class="ac-field">
                <span class="ac-label">Objectif ($)</span>
                <input class="ac-input" type="number" value="${a.profitTarget}" data-field="profitTarget">
              </div>
              <div class="ac-field">
                <span class="ac-label">Drawdown max ($)</span>
                <input class="ac-input" type="number" value="${a.maxDrawdown}" data-field="maxDrawdown">
              </div>
              <div class="ac-field">
                <span class="ac-label">Loss limit / jour ($)</span>
                <input class="ac-input" type="number" value="${a.dailyLossLimit}" data-field="dailyLossLimit">
              </div>
              <div class="ac-field">
                <span class="ac-label">Contrats max</span>
                <input class="ac-input" type="number" value="${a.maxContracts}" data-field="maxContracts">
              </div>
              <div class="ac-field">
                <span class="ac-label">Frais/side ($)</span>
                <input class="ac-input" type="number" step="0.01" value="${(a.feePerSide || 2.14).toFixed(2)}" data-field="feePerSide">
              </div>
            </div>
          `).join('')}
        </div>
        <div class="settings-save-row">
          <button class="btn-primary" id="btnSaveAccounts">Sauvegarder</button>
        </div>
      </div>`;

    $('btnSaveAccounts').addEventListener('click', () => {
      const cards   = el.querySelectorAll('.account-card');
      const updated = Array.from(cards).map(card => {
        const orig = accounts.find(a => a.id === card.dataset.id);
        const get  = field => card.querySelector(`[data-field="${field}"]`).value;
        return {
          id:             card.dataset.id,
          name:           get('name').trim()              || orig.name,
          capital:        parseFloat(get('capital'))      || orig.capital,
          profitTarget:   parseFloat(get('profitTarget')) || orig.profitTarget,
          maxDrawdown:    parseFloat(get('maxDrawdown'))  || orig.maxDrawdown,
          dailyLossLimit: parseFloat(get('dailyLossLimit')) || orig.dailyLossLimit,
          maxContracts:   parseInt(get('maxContracts'))   || orig.maxContracts,
          feePerSide:     parseFloat(get('feePerSide'))   || orig.feePerSide || 2.14,
        };
      });
      Store.updateAccountTypes(updated);
      UI.toast('Comptes sauvegardés');
    });
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
            <span style="font-size:11px;color:var(--muted)">/contrat</span>
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="settings-section" style="max-width:600px">
        <h3>Spreads par instrument</h3>
        <p style="font-size:11px;color:var(--muted);margin-bottom:12px">
          Coût bid/ask à l'entrée, en dollars par contrat.
        </p>
        ${rows}
        <div class="settings-row" style="margin-top:12px;border-top:none">
          <span></span>
          <button class="btn-primary" id="btnSaveSpreads">Sauvegarder</button>
        </div>
      </div>`;

    $('btnSaveSpreads').addEventListener('click', () => {
      const data = {};
      INSTRUMENTS.forEach(instr => {
        data[instr] = Math.max(0, parseFloat($(`spread-${instr}`).value) || 0);
      });
      Store.updateSpreads(data);
      UI.toast(i18n.t('set.sp.saved'));
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
                <button class="btn-ghost" style="padding:3px 10px;font-size:11px" data-grp-edit="${g.id}">Modifier</button>
                <button class="btn-ghost btn-danger" style="padding:3px 10px;font-size:11px" data-grp-del="${g.id}">Supprimer</button>
              </div>
            </div>`;
          }).join('')
        : `<p style="color:var(--muted);font-size:12px;padding:8px 0">
             Aucun groupe — créez un groupe pour lier plusieurs comptes.
           </p>`;

      const checkboxes = accs.map(a =>
        `<label class="grp-check-row">
          <input type="checkbox" class="grp-acc-check" value="${a.id}">
          ${UI.escHtml(a.name)}
        </label>`
      ).join('');

      el.innerHTML = `
        <div class="settings-section settings-section--wide">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <h3 style="margin:0">Groupes de trading</h3>
            <button class="btn-ghost" id="btnAddGroup">+ Créer un groupe</button>
          </div>

          <div id="grpList">${listHtml}</div>

          <div id="grpForm" style="display:none;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:14px" id="grpFormTitle">Nouveau groupe</div>
            <input type="hidden" id="grpEditId">
            <div class="form-field" style="margin-bottom:12px">
              <label class="form-label">Nom du groupe</label>
              <input class="form-input" type="text" id="grpName" placeholder="ex: Apex Principal">
            </div>
            <div class="form-field" style="margin-bottom:14px">
              <label class="form-label" style="margin-bottom:8px">Comptes inclus</label>
              <div class="grp-checkboxes">${checkboxes || '<span style="color:var(--muted);font-size:12px">Aucun compte — créez d\'abord des comptes dans "Mes Comptes"</span>'}</div>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn-ghost" id="grpBtnCancel">Annuler</button>
              <button class="btn-primary" id="grpBtnSave">Enregistrer</button>
            </div>
          </div>
        </div>`;

      $('btnAddGroup').addEventListener('click', () => {
        $('grpFormTitle').textContent = 'Nouveau groupe';
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
        if (!name) { UI.toast('Le nom du groupe est requis', true); return; }
        const accountIds = Array.from(el.querySelectorAll('.grp-acc-check:checked')).map(cb => cb.value);
        const editId = $('grpEditId').value;
        if (editId) {
          Store.updateGroup(editId, { name, accountIds });
          UI.toast(i18n.t('set.grp.updated'));
        } else {
          Store.addGroup({ name, accountIds });
          UI.toast(i18n.t('set.grp.added'));
        }
        render();
      });

      el.querySelectorAll('[data-grp-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const g = Store.getGroupById(btn.dataset.grpEdit);
          if (!g) return;
          $('grpFormTitle').textContent = 'Modifier le groupe';
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
          if (!g || !confirm(`Supprimer le groupe "${g.name}" ?`)) return;
          Store.deleteGroup(btn.dataset.grpDel);
          render();
          UI.toast(i18n.t('set.grp.deleted'));
        });
      });
    }

    render();
  }

  UI.initSettings = function () {
    try { renderGroupsSettings(); } catch(e) { console.error('[Settings] groups render error:', e); }
    renderMyAccountsSettings();
    renderAccountTypesSettings();
    renderSpreadsSettings();

    const s = Store.getSettings();

    $('setGroqKey').value = s.groqKey || '';
    $('btnSaveGroq').addEventListener('click', () => {
      const key = $('setGroqKey').value.trim();
      Store.updateSettings({ groqKey: key });
      const st = $('groqKeyStatus');
      st.textContent = key ? i18n.t('set.groq.saved') : i18n.t('set.groq.cleared');
      st.style.color = key ? 'var(--green)' : 'var(--muted)';
    });
    if (s.groqKey) {
      $('groqKeyStatus').textContent = i18n.t('set.groq.ok');
      $('groqKeyStatus').style.color = 'var(--green)';
    }


    $('btnExport').addEventListener('click', () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'jtrade-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      UI.toast('Export téléchargé');
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
            UI.toast(data.length + ' trades importés');
          }
        } catch { UI.toast('Fichier invalide', true); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('btnClearAll').addEventListener('click', () => {
      if (!confirm('Effacer TOUS les trades ? Irréversible.')) return;
      Store.clearTrades();
      UI.selectedId = null;
      UI.renderList();
      UI.renderDetail();
      UI.updateStats();
      UI.toast(i18n.t('set.clear.done'));
    });
  };
})();
