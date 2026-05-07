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
  function closeModal() {
    authModal.style.display = 'none';
    // Vide les champs sensibles à la fermeture
    ['loginPassword','regPassword','regPasswordConfirm','forgotEmail','loginUsername','regUsername','regEmail'].forEach(id => {
      const el = $(id); if (el) el.value = '';
    });
    ['loginError','registerError','forgotError'].forEach(id => {
      const el = $(id); if (el) { el.textContent = ''; el.style.color = ''; }
    });
  }

  $('btnNavLogin').addEventListener('click',    () => openModal('login'));
  $('btnNavRegister').addEventListener('click', () => openModal('register'));
  $('btnHeroCta').addEventListener('click',     () => openModal('register'));
  $('btnHeroLogin').addEventListener('click',   () => openModal('login'));
  $('btnLandingFree').addEventListener('click', () => openModal('register'));
  $('btnLandingPro').addEventListener('click',  () => {
    sessionStorage.setItem('ztGoto', 'offers');
    openModal('login');
  });
  const btnLandingLifetime = $('btnLandingLifetime');
  if (btnLandingLifetime) btnLandingLifetime.addEventListener('click', () => {
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

  // ── Rate-limiting ───────────────────────────────────────────────────────────
  let _loginAttempts = 0;
  let _loginLockedUntil = 0;
  let _lastRegister = 0;
  let _lastForgot = 0;

  // ── Login ───────────────────────────────────────────────────────────────────
  $('loginFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('loginError').textContent = '';
    if (Date.now() < _loginLockedUntil) {
      const wait = Math.ceil((_loginLockedUntil - Date.now()) / 1000);
      $('loginError').textContent = `Trop de tentatives — réessayez dans ${wait}s.`;
      return;
    }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const user = await Auth.login($('loginUsername').value.trim().slice(0, 254), $('loginPassword').value);
    btn.disabled = false;
    if (!user) {
      _loginAttempts++;
      if (_loginAttempts >= 5) {
        _loginLockedUntil = Date.now() + 60_000;
        _loginAttempts = 0;
      }
      $('loginError').textContent = i18n.t('auth.err.login');
      return;
    }
    _loginAttempts = 0;
    showLoader(user.username);
    setTimeout(() => launchApp(user), 1200);
  });

  // ── Register ────────────────────────────────────────────────────────────────
  $('registerFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('registerError').textContent = '';
    // Honeypot — si rempli, c'est un bot. On feint le succès sans rien faire.
    const honey = $('regWebsite');
    if (honey && honey.value) {
      $('registerError').style.color = 'var(--green)';
      $('registerError').textContent = '✓';
      return;
    }
    // Rate-limit : 1 inscription / 30s
    if (Date.now() - _lastRegister < 30_000) {
      $('registerError').textContent = 'Merci de patienter avant de réessayer.';
      return;
    }
    const username = $('regUsername').value.trim().slice(0, 30);
    const email    = $('regEmail').value.trim().slice(0, 254);
    const password = $('regPassword').value;
    const passwordConfirm = $('regPasswordConfirm').value;
    if (username.length < 2 || username.length > 30) { $('registerError').textContent = i18n.t('auth.err.username.length') || 'Le pseudo doit faire entre 2 et 30 caractères.'; return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(username))          { $('registerError').textContent = i18n.t('auth.err.username.chars')  || 'Le pseudo ne peut contenir que lettres, chiffres, _ et -.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $('registerError').textContent = i18n.t('auth.err.email') || 'Email invalide.'; return; }
    if (password !== passwordConfirm)  { $('registerError').textContent = i18n.t('auth.err.mismatch'); return; }
    if (password.length < 10 || password.length > 128) { $('registerError').textContent = 'Le mot de passe doit faire entre 10 et 128 caractères.'; return; }
    if (!/\d/.test(password))  { $('registerError').textContent = 'Le mot de passe doit contenir au moins un chiffre.'; return; }
    if (!/[a-zA-Z]/.test(password)) { $('registerError').textContent = 'Le mot de passe doit contenir au moins une lettre.'; return; }
    // Rejet des mots de passe trop communs (top breachs)
    const COMMON_PASSWORDS = new Set([
      'password1','password12','password123','12345678910','azerty12345','qwerty12345',
      'motdepasse1','iloveyou12','abc123456','admin12345','welcome123','letmein123',
      'monkey12345','dragon12345','baseball12','football12','superman12'
    ]);
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      $('registerError').textContent = 'Ce mot de passe est trop commun — choisis-en un autre.';
      return;
    }
    // hCaptcha — token depuis le widget du form register
    const captchaToken = document.querySelector('#registerFormEl [name="h-captcha-response"]')?.value || '';
    if (!captchaToken) {
      $('registerError').textContent = 'Merci de cocher la case anti-bot.';
      return;
    }
    _lastRegister = Date.now();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const result = await Auth.register(username, password, email, captchaToken);
    btn.disabled = false;
    if (result.error) {
      // Reset hCaptcha pour permettre un nouvel essai
      try {
        const widget = document.querySelector('#registerFormEl .h-captcha');
        if (widget && typeof hcaptcha !== 'undefined' && widget.dataset.hcaptchaWidgetId !== undefined) {
          hcaptcha.reset(widget.dataset.hcaptchaWidgetId);
        }
      } catch {}
      $('registerError').textContent = result.error;
      return;
    }
    showLoader(result.user.username);
    setTimeout(() => launchApp(result.user), 1200);
  });

  // ── Mot de passe oublié ─────────────────────────────────────────────────────
  $('forgotFormEl').addEventListener('submit', async e => {
    e.preventDefault();
    $('forgotError').textContent = '';
    // Rate-limit : 1 demande / 60s
    if (Date.now() - _lastForgot < 60_000) {
      $('forgotError').textContent = 'Merci de patienter 60 secondes avant de réessayer.';
      return;
    }
    const email = $('forgotEmail').value.trim().slice(0, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      $('forgotError').textContent = i18n.t('auth.err.email') || 'Email invalide.';
      return;
    }
    _lastForgot = Date.now();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    const result = await Auth.resetPassword(email);
    btn.disabled = false;
    if (result.error) { $('forgotError').textContent = result.error; return; }
    $('forgotError').style.color = 'var(--green)';
    $('forgotError').textContent = 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.';
  });

  // ── Toggle formulaires ──────────────────────────────────────────────────────
  $('showRegister').addEventListener('click',        () => showForm('register'));
  $('showLogin').addEventListener('click',           () => showForm('login'));
  $('showForgot').addEventListener('click',          () => showForm('forgot'));
  $('showLoginFromForgot').addEventListener('click', () => showForm('login'));

  // ── Cookie banner ───────────────────────────────────────────────────────────
  const cookieBanner = $('cookieBanner');
  if (cookieBanner && !localStorage.getItem('zt_cookie_ok')) {
    cookieBanner.style.display = 'flex';
  }
  const cookieBtn = $('cookieAcceptBtn');
  if (cookieBtn) cookieBtn.addEventListener('click', () => {
    cookieBanner.style.display = 'none';
    localStorage.setItem('zt_cookie_ok', '1');
  });
});
