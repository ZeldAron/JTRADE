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
    // Sanitize strict (mêmes règles qu'au form HTML : alphanum + _ + -)
    const safeName  = name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    if (safeName.length < 2) return { error: i18n.t('auth.err.username.chars') || 'Pseudo invalide.' };
    const safeEmail = String(email).replace(/[\s]/g, '').slice(0, 254);
    try {
      const cred = await _fbAuth.createUserWithEmailAndPassword(safeEmail, password);
      await cred.user.updateProfile({ displayName: safeName });

      // v0.9.125 : créer immédiatement le doc userEmails (anti-race).
      // Avant : on attendait `onAuthStateChanged` qui appelle `_storeUserEmail()`.
      // Si l'user fermait l'onglet trop vite, le doc n'existait jamais → user
      // fantôme côté admin. Bug détecté avec 4/11 docs manquants en prod.
      try {
        await _fbDb.collection('userEmails').doc(cred.user.uid).set({
          uid:      cred.user.uid,
          email:    safeEmail,
          username: safeName,
          lastSeen: Date.now(),
        });
      } catch (e) {
        // Non bloquant : si rules refusent, onAuthStateChanged retentera au prochain login
        console.warn('[register] storeUserEmail failed', e && e.code);
      }

      // Email de vérification (non bloquant)
      cred.user.sendEmailVerification().catch(() => {});

      // Notif admin via Cloud Function (Discord webhook → #new-users public)
      try {
        if (_fbFunctions && captchaToken) {
          const callable = _fbFunctions.httpsCallable('notifyNewSignup');
          callable({ captchaToken }).catch(() => {});
        }
      } catch {}

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

      // RGPD : supprime aussi les proCodeHashes attribués à cet uid (sinon
      // l'email reste dans la base après suppression du compte).
      try {
        const codesSnap = await _fbDb.collection('proCodeHashes').where('uid', '==', user.uid).get();
        await Promise.all(codesSnap.docs.map(d => d.ref.delete().catch(() => null)));
      } catch (e) { console.warn('[Auth] deleteAccount proCodeHashes', e); }

      // RGPD : supprime tous les screenshots Storage des trades du user
      // (sans ça, les images restent à vie dans le bucket → violation art. 17)
      try {
        const trades = Store.getTrades();
        await Promise.allSettled(
          trades
            .filter(t => t.screenshotPath)
            .map(t => Store.deleteTradeScreenshot(t.screenshotPath))
        );
      } catch (e) { console.warn('[Auth] deleteAccount screenshots', e); }

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
