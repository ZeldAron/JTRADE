// ─── AUTH ─────────────────────────────────────────────────────────────────────
// Session localStorage avec expiry 30 min d'inactivité

const Auth = (() => {
  const USERS_KEY   = 'jtrade_auth_users';
  const SESSION_KEY = 'ztrade_session_v2';   // localStorage + lastActivity
  const IDLE_MS     = 30 * 60 * 1000;        // 30 minutes

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
  }
  function saveUsers(list) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    if (Date.now() - (s.lastActivity || 0) > IDLE_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { id: s.id, username: s.username };
  }

  function touchSession() {
    const s = getSession();
    if (!s) return;
    s.lastActivity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  }

  async function login(username, password) {
    const hash = await sha256(password);
    const user = getUsers().find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === hash
    );
    if (!user) return null;
    const session = { id: user.id, username: user.username, lastActivity: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { id: session.id, username: session.username };
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
    const session = { id: user.id, username: user.username, lastActivity: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

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
    }).catch(() => {});

    return { user: { id: session.id, username: session.username } };
  }

  function logout() { localStorage.removeItem(SESSION_KEY); }

  return { login, register, logout, getCurrentUser, touchSession };
})();
