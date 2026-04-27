// ─── AUTH ─────────────────────────────────────────────────────────────────────
// Authentification locale, sessions par utilisateur (données isolées)

const Auth = (() => {
  const USERS_KEY   = 'jtrade_auth_users';
  const SESSION_KEY = 'jtrade_auth_session';

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
  }
  function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

  function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  async function login(username, password) {
    const hash = await sha256(password);
    const user = getUsers().find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === hash
    );
    if (!user) return null;
    const session = { id: user.id, username: user.username };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async function register(username, password) {
    const name = username.trim();
    if (!name || !password) return { error: i18n.t('auth.err.required') };
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === name.toLowerCase()))
      return { error: i18n.t('auth.err.taken') };
    const hash = await sha256(password);
    const user = { id: 'u' + Date.now(), username: name, passwordHash: hash };
    users.push(user);
    saveUsers(users);
    const session = { id: user.id, username: user.username };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Notif inscription — fire & forget
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: '6586bd2e-5bce-45ff-9c4f-92730958a80c',
        subject:    `[ZeldTrade] Nouvel utilisateur : ${name}`,
        from_name:  'ZeldTrade Bot',
        email:      'noreply@zeldtrade.app',
        message:    `Nouvel inscrit !\n\nPseudo  : ${name}\nDate    : ${new Date().toLocaleString('fr-FR')}\nNavig.  : ${navigator.userAgent.split(') ')[0].split('(')[1] || '?'}`,
      }),
    }).catch(() => {}); // silencieux si pas de réseau

    return { user: session };
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); }

  return { login, register, logout, getCurrentUser };
})();
