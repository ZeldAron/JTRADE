// ─── AUTH (Firebase) ──────────────────────────────────────────────────────────

const Auth = (() => {

  function getCurrentUser() {
    return _fbAuth.currentUser
      ? { id: _fbAuth.currentUser.uid, username: _fbAuth.currentUser.displayName || _fbAuth.currentUser.email.split('@')[0] }
      : null;
  }

  // Appelé par l'app pour attendre que Firebase confirme la session
  function onAuthReady(cb) {
    _fbAuth.onAuthStateChanged(user => {
      cb(user ? { id: user.uid, username: user.displayName || user.email.split('@')[0] } : null);
    });
  }

  async function login(email, password) {
    try {
      const cred = await _fbAuth.signInWithEmailAndPassword(email, password);
      const user  = cred.user;
      return { id: user.uid, username: user.displayName || user.email.split('@')[0] };
    } catch (e) {
      return null;
    }
  }

  async function register(username, password, email) {
    const name = username.trim();
    if (!name || !password || !email) return { error: i18n.t('auth.err.required') };
    try {
      const cred = await _fbAuth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '465a3d27-6989-4226-8bb1-c5e70e9704c5',
          subject:    `[ZeldTrade] Nouvel utilisateur : ${name}`,
          from_name:  'ZeldTrade Bot',
          email:      'zeldtradepro@gmail.com',
          message:    `Nouvel inscrit !\n\nPseudo  : ${name}\nEmail   : ${email}\nDate    : ${new Date().toLocaleString('fr-FR')}`,
        }),
      }).catch(() => {});

      return { user: { id: cred.user.uid, username: name } };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') return { error: i18n.t('auth.err.taken') };
      if (e.code === 'auth/invalid-email')        return { error: i18n.t('auth.err.email') };
      if (e.code === 'auth/weak-password')        return { error: i18n.t('auth.err.weak') };
      return { error: e.message };
    }
  }

  async function resetPassword(email) {
    try {
      await _fbAuth.sendPasswordResetEmail(email);
      return { ok: true };
    } catch (e) {
      return { error: e.message };
    }
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

      // Supprime toutes les données Firestore de l'utilisateur
      const dataRef = _fbDb.collection('users').doc(user.uid).collection('data');
      const snap    = await dataRef.get();
      await Promise.all(snap.docs.map(d => d.ref.delete()));

      // Supprime le compte Firebase Auth
      await user.delete();
      return { ok: true };
    } catch(e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        return { error: i18n.t('auth.err.login') };
      if (e.code === 'auth/invalid-email')
        return { error: i18n.t('auth.err.email') };
      if (e.code === 'auth/user-mismatch')
        return { error: i18n.t('auth.err.mismatch') };
      return { error: e.message };
    }
  }

  // Compat shim — plus utilisé mais évite les erreurs si appelé ailleurs
  function touchSession() {}

  return { login, register, logout, getCurrentUser, onAuthReady, resetPassword, touchSession, deleteAccount };
})();
