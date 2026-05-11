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

    const currentAdminUid = _fbAuth.currentUser?.uid || '';

    const rows = users.map((u, i) => {
      const plan = plans[i];
      const isPro = plan?.plan === 'pro';
      const activatedAt = isPro ? formatDate(plan.activatedAt) : '—';
      const isSelf = u.uid === currentAdminUid;
      const deleteBtn = isSelf
        ? '<button class="btn-delete" disabled title="Vous ne pouvez pas vous supprimer vous-même">Supprimer</button>'
        : `<button class="btn-delete" data-uid="${esc(u.uid)}" data-email="${esc(u.email)}">Supprimer</button>`;
      return `<tr>
        <td>${esc(u.username)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="plan-tag ${isPro ? 'plan-tag-pro' : 'plan-tag-basic'}">${isPro ? '✦ PRO' : 'BASIC'}</span></td>
        <td>${activatedAt}</td>
        <td>${formatDate(u.lastSeen)}</td>
        <td>
          <button class="btn-gen" data-uid="${esc(u.uid)}" data-email="${esc(u.email)}">Générer code</button>
          <button class="btn-stripe" data-uid="${esc(u.uid)}" data-email="${esc(u.email)}">💳 Lien Stripe</button>
          ${deleteBtn}
        </td>
      </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Pseudo</th><th>Email</th><th>Plan</th><th>Activé le</th><th>Dernière connexion</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    wrap.querySelectorAll('.btn-gen').forEach(btn => {
      btn.addEventListener('click', () => openGenModal(btn.dataset.uid, btn.dataset.email));
    });
    wrap.querySelectorAll('.btn-stripe').forEach(btn => {
      btn.addEventListener('click', () => openStripeModal(btn.dataset.uid, btn.dataset.email));
    });
    wrap.querySelectorAll('.btn-delete[data-uid]').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.uid, btn.dataset.email));
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
    if (!_fbFunctions) {
      $('genError').textContent = 'SDK Functions non chargé.';
      btn.disabled = false; btn.textContent = 'Générer';
      return;
    }
    try {
      const code       = generateCode();
      const normalized = code.replace(/[-\s]/g, '').toUpperCase();
      const hash       = await sha256(normalized);

      // Passe par Cloud Function : audit log + rate-limit + cap par user
      const callable = _fbFunctions.httpsCallable('generateProCode');
      await callable({ codeHash: hash, uid, email });

      $('genCode').textContent    = code;
      $('genResult').style.display = 'block';
      toast('Code généré avec succès !');
      renderCodes();
    } catch (e) {
      console.warn('[Admin] generateProCode failed', e);
      $('genError').textContent = (e && e.message) || 'Erreur lors de la génération — réessaie.';
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

  // ── Modale génération de lien Stripe (admin uniquement) ─────────────────────
  // Le user ne fait RIEN — il reçoit juste le lien par message direct (Discord/email)
  // et clique → Stripe affiche le prix → il paie → webhook active Pro automatiquement.
  function openStripeModal(uid, email) {
    $('stripeTargetUid').value      = uid;
    $('stripeTargetEmail').value    = email;
    $('stripeTargetEmailLabel').textContent = email;
    $('stripeResult').style.display = 'none';
    $('stripeError').textContent    = '';
    $('stripeUrl').value            = '';
    $('stripeTier').value           = 'monthly';
    $('btnDoStripe').disabled       = false;
    $('btnDoStripe').textContent    = 'Générer le lien';
    $('adminStripeModal').style.display = 'flex';
  }
  function closeStripeModal() {
    $('adminStripeModal').style.display = 'none';
  }
  async function doGenerateStripeLink() {
    const tier        = $('stripeTier').value;
    const targetUid   = $('stripeTargetUid').value;
    const targetEmail = $('stripeTargetEmail').value;
    const btn         = $('btnDoStripe');
    btn.disabled    = true;
    btn.textContent = '…';
    $('stripeError').textContent = '';
    if (!_fbFunctions) {
      $('stripeError').textContent = 'SDK Functions non chargé.';
      btn.disabled = false; btn.textContent = 'Générer le lien';
      return;
    }
    try {
      const callable = _fbFunctions.httpsCallable('createCheckoutSession');
      const res = await callable({ tier, targetUid, targetEmail });
      $('stripeUrl').value = res.data.url;
      $('stripeResult').style.display = 'block';
      toast('Lien Stripe généré !');
    } catch (e) {
      console.warn('[Admin] createCheckoutSession failed', e);
      $('stripeError').textContent = (e && e.message) || 'Erreur lors de la génération.';
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Générer le lien';
    }
  }
  async function copyStripeUrl() {
    const url = $('stripeUrl').value;
    try {
      await navigator.clipboard.writeText(url);
      toast('Lien copié — envoie-le par message au bêta-testeur');
    } catch {
      toast('Sélectionne le lien manuellement.', true);
    }
  }

  // ── Modale suppression utilisateur ───────────────────────────────────────────
  function openDeleteModal(uid, email) {
    $('delTargetUid').value     = uid;
    $('delTargetEmail').textContent = email;
    $('delConfirmInput').value  = '';
    $('delError').textContent   = '';
    $('btnDoDelete').disabled   = true;
    $('btnDoDelete').textContent = 'Supprimer définitivement';
    $('deleteModal').style.display = 'flex';
    setTimeout(() => $('delConfirmInput').focus(), 50);
  }

  function closeDeleteModal() {
    $('deleteModal').style.display = 'none';
  }

  function onConfirmInputChange() {
    $('btnDoDelete').disabled = $('delConfirmInput').value.trim() !== 'SUPPRIMER';
  }

  async function doDeleteUser() {
    const uid   = $('delTargetUid').value;
    const email = $('delTargetEmail').textContent;
    if ($('delConfirmInput').value.trim() !== 'SUPPRIMER') return;
    if (!_fbFunctions) {
      $('delError').textContent = 'SDK Functions non chargé.';
      return;
    }
    const btn = $('btnDoDelete');
    btn.disabled    = true;
    btn.textContent = 'Suppression…';
    $('delError').textContent = '';
    try {
      const callable = _fbFunctions.httpsCallable('deleteUserAccount');
      await callable({ uid });
      toast(`Utilisateur ${email} supprimé.`);
      closeDeleteModal();
      renderUsers();
    } catch (e) {
      console.warn('[Admin] deleteUser failed', e);
      const msg = (e && e.message) ? e.message : 'Erreur lors de la suppression.';
      $('delError').textContent = msg;
      btn.disabled    = false;
      btn.textContent = 'Supprimer définitivement';
    }
  }

  // ── Révoquer un code (via Cloud Function pour atomicité) ──────────────────────
  let _revokeInFlight = false;
  async function revokeCode(id, uid, email, isActive) {
    if (_revokeInFlight) return;
    const msg = isActive
      ? `Révoquer le code ET désactiver l'abonnement Pro de ${email} ?`
      : `Supprimer le code non utilisé de ${email} ?`;
    if (!confirm(msg)) return;
    if (!_fbFunctions) {
      toast('SDK Functions non chargé.', true);
      return;
    }
    _revokeInFlight = true;
    try {
      const callable = _fbFunctions.httpsCallable('revokeProCode');
      await callable({ codeHash: id, uid });
      toast(isActive ? 'Abonnement Pro révoqué.' : 'Code supprimé.');
      renderCodes();
    } catch (e) {
      console.warn('[Admin] revokeCode failed', e);
      toast((e && e.message) || 'Erreur lors de la révocation.', true);
    } finally {
      _revokeInFlight = false;
    }
  }

  // ── Config Groq — DÉPRÉCIÉE depuis v0.9.82 ───────────────────────────────────
  // La clé Groq est désormais stockée dans Google Secret Manager et utilisée
  // exclusivement par la Cloud Function `analyzeChart`. Plus aucune lecture
  // ni écriture client (rules Firestore : `allow read, write: if false`).
  async function renderConfig() {
    const wrap = $('tabConfig');
    wrap.innerHTML = `
      <div style="max-width:560px">
        <h3 style="margin:0 0 6px;font-size:15px">Clé API Groq</h3>
        <p style="font-size:12px;color:var(--muted);line-height:1.6">
          La clé Groq est désormais stockée dans <strong>Google Secret Manager</strong> et utilisée
          uniquement par la Cloud Function <code>analyzeChart</code>.<br>
          Plus aucune lecture/écriture côté client — la clé n'est jamais exposée au navigateur.
        </p>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:14px;font-family:monospace;font-size:12px;color:var(--muted);line-height:1.7">
          # Mettre à jour la clé Groq :<br>
          <span style="color:var(--text)">firebase functions:secrets:set GROQ_API_KEY</span><br>
          # Redéployer ensuite :<br>
          <span style="color:var(--text)">firebase deploy --only functions</span>
        </div>
      </div>`;
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
  let _adminLoginAttempts = 0;
  let _adminLockedUntil = 0;

  async function login() {
    const email    = $('loginEmail').value.trim().slice(0, 254);
    const password = $('loginPassword').value;
    const errEl    = $('loginError');
    const btn      = $('btnLogin');
    errEl.textContent = '';

    if (Date.now() < _adminLockedUntil) {
      const wait = Math.ceil((_adminLockedUntil - Date.now()) / 1000);
      errEl.textContent = `Trop de tentatives — réessayez dans ${wait}s.`;
      return;
    }

    btn.disabled = true;
    // Anti-timing-attack : on garantit une durée minimale uniforme pour
    // toutes les branches (succès, mauvais email, mauvais password, erreur réseau).
    const start = Date.now();
    const minDelay = 1500;
    let success = false;
    let user = null;
    try {
      const cred = await _fbAuth.signInWithEmailAndPassword(email, password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await _fbAuth.signOut();
      } else {
        success = true;
        user = cred.user;
      }
    } catch (e) {
      // Identifiants invalides ou erreur réseau — traité comme un échec uniforme
    }

    const elapsed = Date.now() - start;
    if (elapsed < minDelay) await new Promise(r => setTimeout(r, minDelay - elapsed));

    btn.disabled = false;
    if (success) {
      _adminLoginAttempts = 0;
      showDashboard(user);
    } else {
      _adminLoginAttempts++;
      if (_adminLoginAttempts >= 3) {
        _adminLockedUntil = Date.now() + 5 * 60_000;
        _adminLoginAttempts = 0;
      }
      errEl.textContent = 'Identifiants invalides.';
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
    $('btnCloseDelete').addEventListener('click', closeDeleteModal);
    $('btnDoDelete').addEventListener('click', doDeleteUser);
    $('delConfirmInput').addEventListener('input', onConfirmInputChange);
    $('deleteModal').addEventListener('click', e => { if (e.target === $('deleteModal')) closeDeleteModal(); });
    // Stripe modal
    $('btnDoStripe').addEventListener('click', doGenerateStripeLink);
    $('btnCloseStripe').addEventListener('click', closeStripeModal);
    $('btnCopyStripeUrl').addEventListener('click', copyStripeUrl);
    $('adminStripeModal').addEventListener('click', e => { if (e.target === $('adminStripeModal')) closeStripeModal(); });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
