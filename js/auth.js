// ─── AUTH (Firebase) ──────────────────────────────────────────────────────────

const Auth = (() => {

  function _safeUsername(user) {
    if (user.displayName) return user.displayName;
    if (user.email && user.email.includes('@')) return user.email.split('@')[0];
    return 'user';
  }

  function getCurrentUser() {
    return _fbAuth.currentUser
      ? { id: _fbAuth.currentUser.uid, username: _safeUsername(_fbAuth.currentUser) }
      : null;
  }

  function _storeUserEmail(user) {
    if (!user) return;
    _fbDb.collection('userEmails').doc(user.uid).set({
      uid:      user.uid,
      email:    user.email || '',
      username: String(user.displayName || '').replace(/[<>"'`]/g, '').trim().slice(0, 50),
      lastSeen: Date.now(),
    }).catch(() => {});
  }

  // Appelé par l'app pour attendre que Firebase confirme la session
  function onAuthReady(cb) {
    _fbAuth.onAuthStateChanged(user => {
      if (user) _storeUserEmail(user);
      cb(user ? { id: user.uid, username: _safeUsername(user) } : null);
    });
  }

  async function login(email, password) {
    try {
      const cred = await _fbAuth.signInWithEmailAndPassword(email, password);
      const user  = cred.user;
      return { id: user.uid, username: _safeUsername(user) };
    } catch (e) {
      return null;
    }
  }

  async function register(username, password, email, captchaToken) {
    const name = username.trim();
    if (!name || !password || !email) return { error: i18n.t('auth.err.required') };
    // Sanitize CRLF (anti header-injection si transmis tel quel à un service mail)
    const safeName  = name.replace(/[\r\n]/g, '').slice(0, 100);
    const safeEmail = String(email).replace(/[\r\n]/g, '').slice(0, 254);
    try {
      const cred = await _fbAuth.createUserWithEmailAndPassword(safeEmail, password);
      await cred.user.updateProfile({ displayName: safeName });

      // Envoie l'email de vérification (non bloquant — l'utilisateur peut continuer sans)
      cred.user.sendEmailVerification().catch(() => {});

      // Notif admin via Web3Forms (captcha requis maintenant que hCaptcha est activé)
      if (captchaToken) {
        const ctrl = new AbortController();
        const tmr  = setTimeout(() => ctrl.abort(), 10_000);
        fetch('https://api.web3forms.com/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          signal:  ctrl.signal,
          body: JSON.stringify({
            access_key: '465a3d27-6989-4226-8bb1-c5e70e9704c5',
            subject:    `[ZeldTrade] Nouvel utilisateur : ${safeName}`,
            from_name:  'ZeldTrade Bot',
            email:      'zeldtradepro@gmail.com',
            message:    `Nouvel inscrit !\n\nPseudo  : ${safeName}\nEmail   : ${safeEmail}\nDate    : ${new Date().toLocaleString('fr-FR')}`,
            'h-captcha-response': captchaToken,
          }),
        }).finally(() => clearTimeout(tmr)).catch(() => {});
      }

      return { user: { id: cred.user.uid, username: safeName } };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return { error: i18n.t('auth.err.taken') };
      if (e.code === 'auth/invalid-email')        return { error: i18n.t('auth.err.email') };
      if (e.code === 'auth/weak-password')        return { error: i18n.t('auth.err.weak') };
      return { error: i18n.t('auth.err.unknown') };
    }
  }

  async function resetPassword(email) {
    try {
      await _fbAuth.sendPasswordResetEmail(email);
    } catch {
      // Ne pas révéler si l'email existe ou non
    }
    return { ok: true };
  }

  function logout() {
    return _fbAuth.signOut();
  }

  async function deleteAccount(email, password) {
    const user = _fbAuth.currentUser;
    if (!user) return { error: 'Non connecté' };
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(email, password);
      await user.reauthenticateWithCredential(cred);

      // Supprime d'abord toutes les données Firestore — si une suppression échoue,
      // l'utilisateur conserve son compte et peut réessayer (pas d'état orphelin).
      const dataRef = _fbDb.collection('users').doc(user.uid).collection('data');
      const snap    = await dataRef.get();
      await Promise.all(snap.docs.map(d => d.ref.delete()));
      await _fbDb.collection('userEmails').doc(user.uid).delete().catch(() => {});

      // Nettoie le cache local
      try { Store.clearLocalCache(); } catch {}

      // Supprime le compte Firebase Auth en dernier (point de non-retour)
      await user.delete();
      return { ok: true };
    } catch(e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        return { error: i18n.t('auth.err.login') };
      if (e.code === 'auth/invalid-email')
        return { error: i18n.t('auth.err.email') };
      if (e.code === 'auth/user-mismatch')
        return { error: i18n.t('auth.err.mismatch') };
      return { error: i18n.t('auth.err.unknown') };
    }
  }

  // Compat shim — plus utilisé mais évite les erreurs si appelé ailleurs
  function touchSession() {}

  return { login, register, logout, getCurrentUser, onAuthReady, resetPassword, touchSession, deleteAccount };
})();
