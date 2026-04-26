// ─── STORE ───────────────────────────────────────────────────────────────────
// Gestion des données : trades + settings, persistance localStorage
// Clés préfixées par userId pour isoler chaque session utilisateur

const Store = (() => {
  // Clés dynamiques, initialisées par initForUser()
  let TRADES_KEY      = 'jtrade_default_v2_trades';
  let SETTINGS_KEY    = 'jtrade_default_v2_settings';
  let ACCOUNTS_KEY    = 'jtrade_default_v2_accounts';
  let MY_ACCOUNTS_KEY = 'jtrade_default_v2_my_accounts';
  let SPREADS_KEY     = 'jtrade_default_v3_spreads_usd';
  let GROUPS_KEY      = 'jtrade_default_v1_groups';

  const DEFAULT_SETTINGS = {
    capital:    50000,
    contracts:  1,
    instrument: 'MES1',
    groqKey:    '',
  };

  const DEFAULT_ACCOUNT_TYPES = [
    { id: 'apex-25k',  name: 'Apex $25K',  capital: 25000,  profitTarget: 1500,  maxDrawdown: 1000, dailyLossLimit: 500,  maxContracts: 4,  feePerSide: 2.14 },
    { id: 'apex-50k',  name: 'Apex $50K',  capital: 50000,  profitTarget: 3000,  maxDrawdown: 2000, dailyLossLimit: 1000, maxContracts: 6,  feePerSide: 2.14 },
    { id: 'apex-100k', name: 'Apex $100K', capital: 100000, profitTarget: 6000,  maxDrawdown: 3000, dailyLossLimit: 1500, maxContracts: 8,  feePerSide: 2.14 },
    { id: 'apex-150k', name: 'Apex $150K', capital: 150000, profitTarget: 9000,  maxDrawdown: 4000, dailyLossLimit: 2000, maxContracts: 12, feePerSide: 2.14 },
  ];

  const DEFAULT_SPREADS = { MES1: 1.04, ES1: 12.50, MNQ1: 0.50, NQ1: 5.00 };

  let trades       = [];
  let settings     = { ...DEFAULT_SETTINGS };
  let accountTypes = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
  let myAccounts   = [];
  let spreads      = { ...DEFAULT_SPREADS };
  let groups       = [];

  // ── Initialisation par utilisateur ──────────────────────────────────────────
  function initForUser(userId) {
    const uid = userId || 'default';
    TRADES_KEY      = `jtrade_${uid}_v2_trades`;
    SETTINGS_KEY    = `jtrade_${uid}_v2_settings`;
    ACCOUNTS_KEY    = `jtrade_${uid}_v2_accounts`;
    MY_ACCOUNTS_KEY = `jtrade_${uid}_v2_my_accounts`;
    SPREADS_KEY     = `jtrade_${uid}_v3_spreads_usd`;
    GROUPS_KEY      = `jtrade_${uid}_v1_groups`;

    // Réinitialise l'état
    trades       = [];
    settings     = { ...DEFAULT_SETTINGS };
    accountTypes = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
    myAccounts   = [];
    spreads      = { ...DEFAULT_SPREADS };
    groups       = [];

    migrateOldData();
    loadAll();
  }

  // Migration silencieuse des données de l'ancienne version (sans préfixe utilisateur)
  function migrateOldData() {
    const OLD = {
      trades:      'jtrade_v2_trades',
      settings:    'jtrade_v2_settings',
      accounts:    'jtrade_v2_accounts',
      myAccounts:  'jtrade_v2_my_accounts',
      spreads:     'jtrade_v3_spreads_usd',
    };
    if (!localStorage.getItem(TRADES_KEY) && localStorage.getItem(OLD.trades))
      localStorage.setItem(TRADES_KEY, localStorage.getItem(OLD.trades));
    if (!localStorage.getItem(SETTINGS_KEY) && localStorage.getItem(OLD.settings))
      localStorage.setItem(SETTINGS_KEY, localStorage.getItem(OLD.settings));
    if (!localStorage.getItem(ACCOUNTS_KEY) && localStorage.getItem(OLD.accounts))
      localStorage.setItem(ACCOUNTS_KEY, localStorage.getItem(OLD.accounts));
    if (!localStorage.getItem(MY_ACCOUNTS_KEY) && localStorage.getItem(OLD.myAccounts))
      localStorage.setItem(MY_ACCOUNTS_KEY, localStorage.getItem(OLD.myAccounts));
    if (!localStorage.getItem(SPREADS_KEY) && localStorage.getItem(OLD.spreads))
      localStorage.setItem(SPREADS_KEY, localStorage.getItem(OLD.spreads));
  }

  // ── Persistence ─────────────────────────────────────────────────────────────
  function loadAll() {
    try {
      const t  = localStorage.getItem(TRADES_KEY);
      const s  = localStorage.getItem(SETTINGS_KEY);
      const a  = localStorage.getItem(ACCOUNTS_KEY);
      const ma = localStorage.getItem(MY_ACCOUNTS_KEY);
      const sp = localStorage.getItem(SPREADS_KEY);
      const g  = localStorage.getItem(GROUPS_KEY);
      if (t)  trades       = JSON.parse(t);
      if (s)  settings     = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
      if (a)  accountTypes = JSON.parse(a);
      if (ma) myAccounts   = JSON.parse(ma);
      if (sp) spreads      = { ...DEFAULT_SPREADS, ...JSON.parse(sp) };
      if (g)  groups       = JSON.parse(g);
      if (settings.ollamaModel === 'llama3.2') settings.ollamaModel = 'llava';
    } catch (e) {
      console.error('[Store] load error', e);
    }
  }

  function saveTrades()   { localStorage.setItem(TRADES_KEY,   JSON.stringify(trades));   }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

  // ── Trades CRUD ──────────────────────────────────────────────────────────────
  function getTrades()        { return trades; }
  function getTradeById(id)   { return trades.find(t => t.id === id) || null; }

  function addTrade(trade) {
    const t = { ...trade, id: Date.now().toString() };
    if (!t.date) t.date = new Date().toISOString();
    trades.unshift(t);
    saveTrades();
    return t;
  }

  function updateTrade(id, data) {
    const idx = trades.findIndex(t => t.id === id);
    if (idx < 0) return null;
    trades[idx] = { ...trades[idx], ...data };
    saveTrades();
    return trades[idx];
  }

  function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    saveTrades();
  }

  function importTrades(arr) {
    trades = [...arr, ...trades];
    saveTrades();
  }

  function clearTrades() {
    trades = [];
    saveTrades();
  }

  function exportJSON() {
    return JSON.stringify(trades, null, 2);
  }

  // ── Settings ─────────────────────────────────────────────────────────────────
  function getSettings()        { return { ...settings }; }
  function updateSettings(data) {
    settings = { ...settings, ...data };
    saveSettings();
  }

  // ── Account types (presets) ──────────────────────────────────────────────────
  function getAccountTypes()       { return accountTypes.map(a => ({ ...a })); }
  function getAccountByName(name)  { return accountTypes.find(a => a.name === name) || null; }
  function updateAccountTypes(arr) {
    accountTypes = arr;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accountTypes));
  }

  // ── Mes comptes (instances personnelles) ─────────────────────────────────────
  function getMyAccounts()          { return myAccounts.map(a => ({ ...a })); }
  function getMyAccountById(id)     { return myAccounts.find(a => a.id === id) || null; }
  function getMyAccountByName(name) { return myAccounts.find(a => a.name === name) || null; }

  function addMyAccount(data) {
    const acc = { ...data, id: 'acc-' + Date.now() };
    myAccounts.push(acc);
    localStorage.setItem(MY_ACCOUNTS_KEY, JSON.stringify(myAccounts));
    return acc;
  }

  function updateMyAccount(id, data) {
    const idx = myAccounts.findIndex(a => a.id === id);
    if (idx < 0) return null;
    myAccounts[idx] = { ...myAccounts[idx], ...data };
    localStorage.setItem(MY_ACCOUNTS_KEY, JSON.stringify(myAccounts));
    return myAccounts[idx];
  }

  function deleteMyAccount(id) {
    myAccounts = myAccounts.filter(a => a.id !== id);
    localStorage.setItem(MY_ACCOUNTS_KEY, JSON.stringify(myAccounts));
  }

  // ── Spreads ──────────────────────────────────────────────────────────────────
  function getSpreads()        { return { ...spreads }; }
  function updateSpreads(data) {
    spreads = { ...spreads, ...data };
    localStorage.setItem(SPREADS_KEY, JSON.stringify(spreads));
  }

  // ── Groupes de trading ───────────────────────────────────────────────────────
  function getGroups()        { return groups.map(g => ({ ...g })); }
  function getGroupById(id)   { return groups.find(g => g.id === id) || null; }

  function addGroup(data) {
    const g = { ...data, id: 'grp-' + Date.now() };
    groups.push(g);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    return g;
  }

  function updateGroup(id, data) {
    const idx = groups.findIndex(g => g.id === id);
    if (idx < 0) return null;
    groups[idx] = { ...groups[idx], ...data };
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    return groups[idx];
  }

  function deleteGroup(id) {
    groups = groups.filter(g => g.id !== id);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }

  // ── Agrégats ─────────────────────────────────────────────────────────────────
  function getStats() {
    const closed   = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
    const wins     = closed.filter(t => t.outcome === 'win');
    const totalPnL = trades.reduce((s, t) => {
      const c = Calc.trade(t);
      return s + (c.netPnl !== null ? c.netPnl : 0);
    }, 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : null;
    const avgRR   = trades.length
      ? trades.reduce((s, t) => s + Calc.trade(t).rr, 0) / trades.length
      : 0;
    return {
      totalPnL, winRate, avgRR,
      total:  trades.length,
      open:   trades.filter(t => t.outcome === 'open').length,
      wins:   wins.length,
      losses: closed.length - wins.length,
    };
  }

  return {
    initForUser,
    getTrades, getTradeById,
    addTrade, updateTrade, deleteTrade,
    importTrades, clearTrades, exportJSON,
    getSettings, updateSettings,
    getAccountTypes, getAccountByName, updateAccountTypes,
    getMyAccounts, getMyAccountById, getMyAccountByName,
    addMyAccount, updateMyAccount, deleteMyAccount,
    getSpreads, updateSpreads,
    getGroups, getGroupById, addGroup, updateGroup, deleteGroup,
    getStats,
  };
})();
