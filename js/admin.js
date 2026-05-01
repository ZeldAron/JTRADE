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
        <td>${u.username || '—'}</td>
        <td>${u.email}</td>
        <td><span class="plan-tag ${isPro ? 'plan-tag-pro' : 'plan-tag-basic'}">${isPro ? '✦ PRO' : 'BASIC'}</span></td>
        <td>${activatedAt}</td>
        <td>${formatDate(u.lastSeen)}</td>
        <td>
          <button class="btn-gen" data-uid="${u.uid}" data-email="${u.email}">Générer code</button>
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
      <td class="hash-cell">${c.id.slice(0, 16)}…</td>
      <td>${c.email || '—'}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><span class="plan-tag ${c.isActive ? 'plan-tag-pro' : 'plan-tag-basic'}">${c.isActive ? '✦ Abonnement actif' : 'Non activé'}</span></td>
      <td><button class="btn-revoke" data-id="${c.id}" data-uid="${c.uid}" data-email="${c.email || '?'}" data-active="${c.isActive}">Révoquer</button></td>
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
    } catch (e) {
      $('genError').textContent = 'Erreur : ' + e.message;
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
    } catch (e) {
      toast('Erreur : ' + e.message, true);
    }
  }

  // ── Onglets ───────────────────────────────────────────────────────────────────
  function switchTab(name) {
    ['users', 'codes'].forEach(t => {
      $('tab-' + t).classList.toggle('tab-active', t === name);
      $('tab' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = t === name ? '' : 'none';
    });
    if (name === 'users') renderUsers();
    if (name === 'codes') renderCodes();
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
    $('btnDoGen').addEventListener('click', doGenerate);
    $('btnCopyCode').addEventListener('click', copyCode);
    $('btnCloseModal').addEventListener('click', closeGenModal);
    $('adminModal').addEventListener('click', e => { if (e.target === $('adminModal')) closeGenModal(); });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
