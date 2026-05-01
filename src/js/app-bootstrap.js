// ─── BOOTSTRAP AUTH ───────────────────────────────────────────────────────────
// Extrait de index.html pour permettre une Content-Security-Policy sans unsafe-inline

// Anti-framing
if (window.top !== window.self) { window.top.location.replace(window.self.location.href); }

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  i18n.apply();
  Contact.init();

  const landing   = $('landingScreen');
  const authModal = $('authModal');
  const loader    = $('loginLoader');
  let appLaunched = false;

  // ── Modal auth ──────────────────────────────────────────────────────────────
  function showForm(mode) {
    ['loginFormEl','registerFormEl','forgotFormEl'].forEach(id => {
      $(id).style.display = (id === mode + 'FormEl') ? '' : 'none';
    });
    ['loginError','registerError','forgotError'].forEach(id => {
      if ($(id)) $(id).textContent = '';
    });
    const focus = { login: 'loginUsername', register: 'regUsername', forgot: 'forgotEmail' };
    setTimeout(() => { if ($(focus[mode])) $(focus[mode]).focus(); }, 60);
  }
  function openModal(mode) { showForm(mode); authModal.style.display = 'flex'; }
  function closeModal()    { authModal.style.display = 'none'; }

  $('btnNavLogin').addEventListener('click',    () => openModal('login'));
  $('btnNavRegister').addEventListener('click', () => openModal('register'));
  $('btnHeroCta').addEventListener('click',     () => openModal('register'));
  $('btnHeroLogin').addEventListener('click',   () => openModal('login'));
  $('btnLandingFree').addEventListener('click', () => openModal('register'));
  $('btnLandingPro').addEventListener('click',  () => {
    sessionStorage.setItem('ztGoto', 'offers');
    openModal('login');
  });
  $('authModalClose').addEventListener('click',    closeModal);
  $('authModalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── Loader ──────────────────────────────────────────────────────────────────
  function showLoader(username) {
    closeModal();
    loader.style.display = 'flex';
    $('loaderUser').textContent = username;
    const fill = $('loaderFill');
    fill.style.transition = 'none'; fill.style.width = '0%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = 'width 1.1s cubic-bezier(0.4,0,0.2,1)';
      fill.style.width = '100%';
    }));
  }

  // ── Launch app ──────────────────────────────────────────────────────────────
  function launchApp(user) {
    if (appLaunched) return;
    appLaunched = true;
    Store.initForUser(user.id);
    $('userPillName').textContent = user.username;
    $('userAvatar').textContent   = user.username[0].toUpperCase();
    landing.style.transition = 'opacity 0.45s ease';
    landing.style.opacity    = '0';
    setTimeout(() => { landing.style.display = 'none'; loader.style.display = 'none'; }, 450);
    initApp();
    window.addEventListener('store:synced', () => {
      try {
        UI.renderList();
        UI.updateStats();
        UI.initSettings();
        const planBadge = document.getElementById('planBadge');
        if (planBadge) {
          planBadge.textContent = Store.isPro() ? 'PRO' : 'BASIC';
          planBadge.className   = 'plan-badge ' + (Store.isPro() ? 'plan-pro' : 'plan-basic');
        }
      } catch {}
    }, { once: true });
  }

  // ── Firebase Auth state ─────────────────────────────────────────────────────
  Auth.onAuthReady(user => {
    if (user) { showLoader(user.username); setTimeout(() => launchApp(user), 1200); }
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  $('loginFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('loginError').textContent = '';
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const user = await Auth.login($('loginUsername').value.trim(), $('loginPassword').value);
    btn.disabled = false;
    if (!user) { $('loginError').textContent = i18n.t('auth.err.login'); return; }
    showLoader(user.username);
    setTimeout(() => launchApp(user), 1200);
  });

  // ── Register ────────────────────────────────────────────────────────────────
  $('registerFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('registerError').textContent = '';
    const username = $('regUsername').value.trim();
    const email    = $('regEmail').value.trim();
    const password = $('regPassword').value;
    const confirm  = $('regPasswordConfirm').value;
    if (username.length < 2 || username.length > 30) { $('registerError').textContent = i18n.t('auth.err.username.length') || 'Le pseudo doit faire entre 2 et 30 caractères.'; return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(username))          { $('registerError').textContent = i18n.t('auth.err.username.chars')  || 'Le pseudo ne peut contenir que lettres, chiffres, _ et -.'; return; }
    if (password !== confirm)  { $('registerError').textContent = i18n.t('auth.err.mismatch'); return; }
    if (password.length < 8)   { $('registerError').textContent = i18n.t('auth.err.short'); return; }
    if (!/\d/.test(password))  { $('registerError').textContent = 'Le mot de passe doit contenir au moins un chiffre.'; return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const result = await Auth.register(username, password, email);
    btn.disabled = false;
    if (result.error) { $('registerError').textContent = result.error; return; }
    showLoader(result.user.username);
    setTimeout(() => launchApp(result.user), 1200);
  });

  // ── Mot de passe oublié ─────────────────────────────────────────────────────
  $('forgotFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('forgotError').textContent = '';
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const result = await Auth.resetPassword($('forgotEmail').value.trim());
    btn.disabled = false;
    if (result.error) { $('forgotError').textContent = result.error; return; }
    $('forgotError').style.color = 'var(--green)';
    $('forgotError').textContent = 'Email envoyé ! Vérifie ta boîte mail.';
  });

  // ── Toggle formulaires ──────────────────────────────────────────────────────
  $('showRegister').addEventListener('click',        () => showForm('register'));
  $('showLogin').addEventListener('click',           () => showForm('login'));
  $('showForgot').addEventListener('click',          () => showForm('forgot'));
  $('showLoginFromForgot').addEventListener('click', () => showForm('login'));
});
