// ─── CONSOLE ADMIN ZELDTRADE ─────────────────────────────────────────────────
if (window.top !== window.self) { window.top.location.replace(window.self.location.href); }

const ADMIN_EMAIL = 'zeldtradepro@gmail.com';

const Admin = (() => {

  // ── SHA-256 ──────────────────────────────────────────────────────────────────
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Génération de code unique ────────────────────────────────────────────────
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I/L ambigus
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const raw = Array.from(bytes).map(b => chars[b % chars.length]).join('');
    return `ZELD-${raw.slice(0,4)}-${raw.slice(4,8)}-${raw.slice(8,12)}`;
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function show(id, type = 'block') { $(id).style.display = type; }
  function hide(id) { $(id).style.display = 'none'; }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

  function toast(msg, isError = false) {
    const t = $('adminToast');
    t.textContent  = msg;
    t.className    = 'admin-toast ' + (isError ? 'admin-toast-err' : 'admin-toast-ok');
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }

  function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Chargement des données ────────────────────────────────────────────────────
  async function loadUsers() {
    const snap = await _fbDb.collection('userEmails').get();
    return snap.docs.map(d => d.data());
  }

  async function loadCodes() {
    const snap  = await _fbDb.collection('proCodeHashes').get();
    const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                           .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const planSnaps = await Promise.all(
      codes.map(c =>
        _fbDb.collection('users').doc(c.uid).collection('data').doc('plan')
          .get().catch(() => null)
      )
    );

    return codes.map((c, i) => {
      const plan     = planSnaps[i];
      const isActive = plan && plan.exists && plan.data().codeHash === c.id;
      return { ...c, isActive };
    });
  }

  async function getUserPlan(uid) {
    try {
      const snap = await _fbDb.collection('users').doc(uid).collection('data').doc('plan').get();
      return snap.exists ? snap.data() : null;
    } catch { return null; }
  }

  // ── Rendu onglet Utilisateurs ─────────────────────────────────────────────────
  async function renderUsers() {
    const wrap = $('tabUsers');
    wrap.innerHTML = '<div class="admin-loading">Chargement…</div>';
    const users = await loadUsers();
    if (!users.length) {
      wrap.innerHTML = '<p class="admin-empty">Aucun utilisateur enregistré.</p>';
      return;
    }

    // Charge les plans en parallèle
    const plans = await Promise.all(users.map(u => getUserPlan(u.uid)));

    const rows = users.map((u, i) => {
      const plan = plans[i];
      const isPro = plan?.plan === 'pro';
      const activatedAt = isPro ? formatDate(plan.activatedAt) : '—';
      return `<tr>
        <td>${esc(u.username)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="plan-tag ${isPro ? 'plan-tag-pro' : 'plan-tag-basic'}">${isPro ? '✦ PRO' : 'BASIC'}</span></td>
        <td>${activatedAt}</td>
        <td>${formatDate(u.lastSeen)}</td>
        <td>
          <button class="btn-gen" data-uid="${esc(u.uid)}" data-email="${esc(u.email)}">Générer code</button>
        </td>
      </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Pseudo</th><th>Email</th><th>Plan</th><th>Activé le</th><th>Dernière connexion</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    wrap.querySelectorAll('.btn-gen').forEach(btn => {
      btn.addEventListener('click', () => openGenModal(btn.dataset.uid, btn.dataset.email));
    });
  }

  // ── Rendu onglet Codes ────────────────────────────────────────────────────────
  async function renderCodes() {
    const wrap = $('tabCodes');
    wrap.innerHTML = '<div class="admin-loading">Chargement…</div>';
    const codes = await loadCodes();
    if (!codes.length) {
      wrap.innerHTML = '<p class="admin-empty">Aucun code généré.</p>';
      return;
    }

    const rows = codes.map(c => `<tr>
      <td class="hash-cell">${esc(c.id.slice(0, 16))}…</td>
      <td>${esc(c.email)}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><span class="plan-tag ${c.isActive ? 'plan-tag-pro' : 'plan-tag-basic'}">${c.isActive ? '✦ Abonnement actif' : 'Non activé'}</span></td>
      <td><button class="btn-revoke" data-id="${esc(c.id)}" data-uid="${esc(c.uid)}" data-email="${esc(c.email || '?')}" data-active="${c.isActive}">Révoquer</button></td>
    </tr>`).join('');

    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Hash (tronqué)</th><th>Généré pour</th><th>Créé le</th><th>Statut</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    wrap.querySelectorAll('.btn-revoke').forEach(btn => {
      btn.addEventListener('click', () =>
        revokeCode(btn.dataset.id, btn.dataset.uid, btn.dataset.email, btn.dataset.active === 'true')
      );
    });
  }

  // ── Modale génération de code ─────────────────────────────────────────────────
  function openGenModal(uid, email) {
    $('genModalTitle').textContent = `Générer un code pour ${email}`;
    $('genResult').style.display   = 'none';
    $('genError').textContent      = '';
    $('genCode').textContent       = '';
    $('genTargetUid').value        = uid;
    $('genTargetEmail').value      = email;
    $('adminModal').style.display  = 'flex';
  }

  function closeGenModal() {
    $('adminModal').style.display = 'none';
  }

  async function doGenerate() {
    const uid   = $('genTargetUid').value;
    const email = $('genTargetEmail').value;
    const btn   = $('btnDoGen');
    btn.disabled    = true;
    btn.textContent = '…';
    $('genError').textContent = '';
    try {
      const code       = generateCode();
      const normalized = code.replace(/[-\s]/g, '').toUpperCase();
      const hash       = await sha256(normalized);

      await _fbDb.collection('proCodeHashes').doc(hash).set({
        uid,
        email,
        createdAt: Date.now(),
      });

      $('genCode').textContent    = code;
      $('genResult').style.display = 'block';
      toast('Code généré avec succès !');
      renderCodes();
    } catch {
      $('genError').textContent = 'Erreur lors de la génération — réessaie.';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Générer';
    }
  }

  async function copyCode() {
    const code = $('genCode').textContent;
    try {
      await navigator.clipboard.writeText(code);
      toast('Code copié !');
    } catch {
      toast('Sélectionne le code manuellement.', true);
    }
  }

  // ── Révoquer un code ──────────────────────────────────────────────────────────
  async function revokeCode(id, uid, email, isActive) {
    const msg = isActive
      ? `Révoquer le code ET désactiver l'abonnement Pro de ${email} ?`
      : `Supprimer le code non utilisé de ${email} ?`;
    if (!confirm(msg)) return;
    try {
      if (isActive) {
        await _fbDb.collection('users').doc(uid).collection('data').doc('plan').delete();
      }
      await _fbDb.collection('proCodeHashes').doc(id).delete();
      toast(isActive ? 'Abonnement Pro révoqué.' : 'Code supprimé.');
      renderCodes();
    } catch {
      toast('Erreur lors de la révocation — réessaie.', true);
    }
  }

  // ── Config Groq ───────────────────────────────────────────────────────────────
  async function loadGroqConfig() {
    try {
      const snap = await _fbDb.collection('config').doc('groq').get();
      return snap.exists ? (snap.data().key || '') : '';
    } catch { return ''; }
  }

  async function saveGroqConfig(key) {
    await _fbDb.collection('config').doc('groq').set({ key });
  }

  async function renderConfig() {
    const wrap = $('tabConfig');
    wrap.innerHTML = '<div class="admin-loading">Chargement…</div>';
    const currentKey = await loadGroqConfig();

    wrap.innerHTML = `
      <div style="max-width:520px">
        <h3 style="margin:0 0 6px;font-size:15px">Clé API Groq (globale)</h3>
        <p style="font-size:12px;color:var(--muted);margin-bottom:16px;line-height:1.5">
          Cette clé est utilisée par tous les utilisateurs pour l'analyse IA des screenshots.<br>
          Récupère-la sur <strong>console.groq.com</strong> → "API Keys".
        </p>
        <div style="display:flex;gap:8px">
          <input type="password" id="groqConfigInput" value="${esc(currentKey)}"
            placeholder="gsk_..."
            style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:9px 12px;font-size:13px;font-family:monospace;outline:none">
          <button class="btn-gen" id="btnSaveGroqConfig" style="padding:8px 18px">Sauvegarder</button>
        </div>
        <div id="groqConfigStatus" style="font-size:12px;margin-top:8px;min-height:16px;color:${currentKey ? 'var(--green)' : 'var(--muted)'}">
          ${currentKey ? '✓ Clé configurée' : 'Aucune clé — IA désactivée pour tous les utilisateurs'}
        </div>
        ${currentKey ? `<button class="btn-revoke" id="btnClearGroqConfig" style="margin-top:12px;font-size:12px">Supprimer la clé</button>` : ''}
      </div>`;

    $('btnSaveGroqConfig').addEventListener('click', async () => {
      const key = $('groqConfigInput').value.trim();
      if (key && !key.startsWith('gsk_')) {
        $('groqConfigStatus').textContent = 'Clé invalide — doit commencer par gsk_';
        $('groqConfigStatus').style.color = 'var(--red)';
        return;
      }
      const btn = $('btnSaveGroqConfig');
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await saveGroqConfig(key);
        toast(key ? 'Clé Groq sauvegardée.' : 'Clé Groq supprimée.');
        renderConfig();
      } catch {
        $('groqConfigStatus').textContent = 'Erreur lors de la sauvegarde — réessaie.';
        $('groqConfigStatus').style.color = 'var(--red)';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sauvegarder';
      }
    });

    const clearBtn = $('btnClearGroqConfig');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (!confirm('Supprimer la clé Groq ? L\'IA sera désactivée pour tous les utilisateurs.')) return;
        await saveGroqConfig('');
        toast('Clé Groq supprimée.');
        renderConfig();
      });
    }
  }

  // ── Onglets ───────────────────────────────────────────────────────────────────
  function switchTab(name) {
    ['users', 'codes', 'config'].forEach(t => {
      $('tab-' + t).classList.toggle('tab-active', t === name);
      $('tab' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = t === name ? '' : 'none';
    });
    if (name === 'users')  renderUsers();
    if (name === 'codes')  renderCodes();
    if (name === 'config') renderConfig();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────────
  async function login() {
    const email    = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const errEl    = $('loginError');
    const btn      = $('btnLogin');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      const cred = await _fbAuth.signInWithEmailAndPassword(email, password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await _fbAuth.signOut();
        errEl.textContent = 'Accès refusé — compte non autorisé.';
        return;
      }
      showDashboard(cred.user);
    } catch (e) {
      errEl.textContent = 'Email ou mot de passe incorrect.';
    } finally {
      btn.disabled = false;
    }
  }

  function showDashboard(user) {
    hide('loginScreen');
    show('dashboard', 'block');
    $('adminUserEmail').textContent = user.email;
    switchTab('users');
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    _fbAuth.onAuthStateChanged(user => {
      if (user && user.email === ADMIN_EMAIL) {
        showDashboard(user);
      } else {
        show('loginScreen', 'flex');
        hide('dashboard');
      }
    });

    $('btnLogin').addEventListener('click', login);
    $('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    $('btnLogout').addEventListener('click', () => _fbAuth.signOut());
    $('tab-users').addEventListener('click', () => switchTab('users'));
    $('tab-codes').addEventListener('click', () => switchTab('codes'));
    $('tab-config').addEventListener('click', () => switchTab('config'));
    $('btnDoGen').addEventListener('click', doGenerate);
    $('btnCopyCode').addEventListener('click', copyCode);
    $('btnCloseModal').addEventListener('click', closeGenModal);
    $('adminModal').addEventListener('click', e => { if (e.target === $('adminModal')) closeGenModal(); });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
