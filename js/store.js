// ─── STORE ───────────────────────────────────────────────────────────────────
// Persistance double : localStorage (rapide) + Firestore (cross-device)

const Store = (() => {

  // ── Données statiques (presets, référence) ───────────────────────────────────
  const DEFAULT_SETTINGS = { capital: 50000, contracts: 1, instrument: 'MES1', groqKey: '' };

  const DEFAULT_ACCOUNT_TYPES = [
    { id: 'apex-25k',     firmKey: 'apex',    name: 'Apex $25K',      capital:  25000, profitTarget:  1500, maxDrawdown:  1000, dailyLossLimit:   500, maxContracts:  4, feePerSide: 1.99 },
    { id: 'apex-50k',     firmKey: 'apex',    name: 'Apex $50K',      capital:  50000, profitTarget:  3000, maxDrawdown:  2000, dailyLossLimit:  1000, maxContracts:  6, feePerSide: 1.99 },
    { id: 'apex-100k',    firmKey: 'apex',    name: 'Apex $100K',     capital: 100000, profitTarget:  6000, maxDrawdown:  3000, dailyLossLimit:  1500, maxContracts:  8, feePerSide: 1.99 },
    { id: 'apex-150k',    firmKey: 'apex',    name: 'Apex $150K',     capital: 150000, profitTarget:  9000, maxDrawdown:  4000, dailyLossLimit:  2000, maxContracts: 12, feePerSide: 1.99 },
    { id: 'topstep-50k',  firmKey: 'topstep', name: 'Topstep $50K',   capital:  50000, profitTarget:  3000, maxDrawdown:  2000, dailyLossLimit:     0, maxContracts:  5, feePerSide: 1.90 },
    { id: 'topstep-100k', firmKey: 'topstep', name: 'Topstep $100K',  capital: 100000, profitTarget:  6000, maxDrawdown:  3000, dailyLossLimit:     0, maxContracts: 10, feePerSide: 1.90 },
    { id: 'topstep-150k', firmKey: 'topstep', name: 'Topstep $150K',  capital: 150000, profitTarget:  9000, maxDrawdown:  4500, dailyLossLimit:     0, maxContracts: 15, feePerSide: 1.90 },
    { id: 'ftmo-25k',     firmKey: 'ftmo',    name: 'FTMO $25K',      capital:  25000, profitTarget:  2500, maxDrawdown:  2500, dailyLossLimit:  1250, maxContracts:  2, feePerSide: 3.00 },
    { id: 'ftmo-50k',     firmKey: 'ftmo',    name: 'FTMO $50K',      capital:  50000, profitTarget:  5000, maxDrawdown:  5000, dailyLossLimit:  2500, maxContracts:  3, feePerSide: 3.00 },
    { id: 'ftmo-100k',    firmKey: 'ftmo',    name: 'FTMO $100K',     capital: 100000, profitTarget: 10000, maxDrawdown: 10000, dailyLossLimit:  5000, maxContracts:  5, feePerSide: 3.00 },
    { id: 'ftmo-200k',    firmKey: 'ftmo',    name: 'FTMO $200K',     capital: 200000, profitTarget: 20000, maxDrawdown: 20000, dailyLossLimit: 10000, maxContracts: 10, feePerSide: 3.00 },
    { id: 'lucid-25k',    firmKey: 'lucid',   name: 'Lucid $25K',     capital:  25000, profitTarget:  1500, maxDrawdown:  1500, dailyLossLimit:   300, maxContracts:  3, feePerSide: 1.75 },
    { id: 'lucid-50k',    firmKey: 'lucid',   name: 'Lucid $50K',     capital:  50000, profitTarget:  3000, maxDrawdown:  3000, dailyLossLimit:   600, maxContracts:  5, feePerSide: 1.75 },
    { id: 'lucid-100k',   firmKey: 'lucid',   name: 'Lucid $100K',    capital: 100000, profitTarget:  6000, maxDrawdown:  4500, dailyLossLimit:  1200, maxContracts: 10, feePerSide: 1.75 },
    { id: 'lucid-150k',   firmKey: 'lucid',   name: 'Lucid $150K',    capital: 150000, profitTarget:  9000, maxDrawdown:  4500, dailyLossLimit:  2700, maxContracts: 15, feePerSide: 1.75 },
  ];

  const DEFAULT_PROP_FIRMS = {
    apex:    { name: 'Apex Funding',    accounts: [
      { id:'apex-25k',     size:'25K',  capital:25000,  profitTarget:1500,  maxDrawdown:1000, dailyLossLimit:500,  drawdownType:'Trailing EOD', consistency:'≤50% meilleure journée',              minTradingDays:0, payoutConditions:'90/10 split — aucun min de jours' },
      { id:'apex-50k',     size:'50K',  capital:50000,  profitTarget:3000,  maxDrawdown:2000, dailyLossLimit:1000, drawdownType:'Trailing EOD', consistency:'≤50% meilleure journée',              minTradingDays:0, payoutConditions:'90/10 split — aucun min de jours' },
      { id:'apex-100k',    size:'100K', capital:100000, profitTarget:6000,  maxDrawdown:3000, dailyLossLimit:1500, drawdownType:'Trailing EOD', consistency:'≤50% meilleure journée',              minTradingDays:0, payoutConditions:'90/10 split — aucun min de jours' },
      { id:'apex-150k',    size:'150K', capital:150000, profitTarget:9000,  maxDrawdown:4000, dailyLossLimit:2000, drawdownType:'Trailing EOD', consistency:'≤50% meilleure journée',              minTradingDays:0, payoutConditions:'90/10 split — aucun min de jours' },
    ]},
    topstep: { name: 'Topstep',         accounts: [
      { id:'topstep-50k',  size:'50K',  capital:50000,  profitTarget:3000,  maxDrawdown:2000, dailyLossLimit:0,    drawdownType:'Trailing EOD', consistency:'≤50% PT (PT ajusté si dépassé)',    minTradingDays:0, payoutConditions:'100% premier $10K, puis 90/10 — 5j gagnants min' },
      { id:'topstep-100k', size:'100K', capital:100000, profitTarget:6000,  maxDrawdown:3000, dailyLossLimit:0,    drawdownType:'Trailing EOD', consistency:'≤50% PT (PT ajusté si dépassé)',    minTradingDays:0, payoutConditions:'100% premier $10K, puis 90/10 — 5j gagnants min' },
      { id:'topstep-150k', size:'150K', capital:150000, profitTarget:9000,  maxDrawdown:4500, dailyLossLimit:0,    drawdownType:'Trailing EOD', consistency:'≤50% PT (PT ajusté si dépassé)',    minTradingDays:0, payoutConditions:'100% premier $10K, puis 90/10 — 5j gagnants min' },
    ]},
    ftmo:    { name: 'FTMO (CFD/Forex)', accounts: [
      { id:'ftmo-25k',     size:'25K',  capital:25000,  profitTarget:2500,  maxDrawdown:2500,  dailyLossLimit:1250,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80-90% split — fee remboursé au 1er payout' },
      { id:'ftmo-50k',     size:'50K',  capital:50000,  profitTarget:5000,  maxDrawdown:5000,  dailyLossLimit:2500,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80-90% split — fee remboursé au 1er payout' },
      { id:'ftmo-100k',    size:'100K', capital:100000, profitTarget:10000, maxDrawdown:10000, dailyLossLimit:5000,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80-90% split — fee remboursé au 1er payout' },
      { id:'ftmo-200k',    size:'200K', capital:200000, profitTarget:20000, maxDrawdown:20000, dailyLossLimit:10000, drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80-90% split — fee remboursé au 1er payout' },
    ]},
    lucid:   { name: 'Lucid Trading',   accounts: [
      { id:'lucid-25k',    size:'25K',  capital:25000,  profitTarget:1500, maxDrawdown:1500, dailyLossLimit:300,  drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-50k',    size:'50K',  capital:50000,  profitTarget:3000, maxDrawdown:3000, dailyLossLimit:600,  drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-100k',   size:'100K', capital:100000, profitTarget:6000, maxDrawdown:4500, dailyLossLimit:1200, drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-150k',   size:'150K', capital:150000, profitTarget:9000, maxDrawdown:4500, dailyLossLimit:2700, drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
    ]},
  };

  const DEFAULT_SPREADS = { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,MCL1:1.00,CL1:10.00 };
  const DEFAULT_SPREADS_BY_FIRM = {
    apex:    { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,MCL1:1.00,CL1:10.00 },
    topstep: { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,MCL1:1.00,CL1:10.00,ZN1:15.63 },
    ftmo:    { US500:0.50,US100:1.50,US30:2.50,GER40:1.50,UK100:1.00,XAUUSD:0.35,EURUSD:1.00,GBPUSD:1.20,USDJPY:0.80,USOIL:3.00 },
    lucid:   { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,MCL1:1.00,CL1:10.00 },
  };

  // ── État en mémoire ──────────────────────────────────────────────────────────
  let _uid          = 'default';
  let trades        = [];
  let settings      = { ...DEFAULT_SETTINGS };
  let accountTypes  = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
  let myAccounts    = [];
  let spreads       = { ...DEFAULT_SPREADS };
  let spreadsByFirm = Object.fromEntries(Object.keys(DEFAULT_SPREADS_BY_FIRM).map(k => [k, { ...DEFAULT_SPREADS_BY_FIRM[k] }]));
  let groups        = [];

  // ── Clés localStorage (cache local) ─────────────────────────────────────────
  const lk = () => ({
    trades:       `ztrade_${_uid}_trades`,
    settings:     `ztrade_${_uid}_settings`,
    myAccounts:   `ztrade_${_uid}_myAccounts`,
    spreadsByFirm:`ztrade_${_uid}_spreadsByFirm`,
    groups:       `ztrade_${_uid}_groups`,
    plan:         `ztrade_${_uid}_plan`,
    aiUsage:      `ztrade_${_uid}_aiUsage`,
  });

  // ── Helpers Firestore ────────────────────────────────────────────────────────
  function userDoc(name) {
    return _fbDb.collection('users').doc(_uid).collection('data').doc(name);
  }

  function fbSet(name, data) {
    userDoc(name).set(data).catch(e => console.warn('[Store] Firestore write error', e));
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  // ── Init & chargement ────────────────────────────────────────────────────────
  function initForUser(userId) {
    _uid = userId || 'default';
    trades        = [];
    settings      = { ...DEFAULT_SETTINGS };
    accountTypes  = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
    myAccounts    = [];
    spreads       = { ...DEFAULT_SPREADS };
    spreadsByFirm = Object.fromEntries(Object.keys(DEFAULT_SPREADS_BY_FIRM).map(k => [k, { ...DEFAULT_SPREADS_BY_FIRM[k] }]));
    groups        = [];
    _loadFromLocalStorage();   // affichage immédiat
    _loadFromFirestore();      // sync cloud en arrière-plan
  }

  function _loadFromLocalStorage() {
    const k = lk();
    const t  = lsGet(k.trades);
    const s  = lsGet(k.settings);
    const ma = lsGet(k.myAccounts);
    const spf = lsGet(k.spreadsByFirm);
    const g  = lsGet(k.groups);
    if (t)   trades       = t;
    if (s)   settings     = { ...DEFAULT_SETTINGS, ...s };
    if (ma)  myAccounts   = ma;
    if (spf) Object.keys(DEFAULT_SPREADS_BY_FIRM).forEach(fk => {
      if (spf[fk]) spreadsByFirm[fk] = { ...DEFAULT_SPREADS_BY_FIRM[fk], ...spf[fk] };
    });
    if (g)   groups = g;
    // Merge nouveaux presets si absents
    _mergeAccountTypeDefaults();
  }

  async function _loadFromFirestore() {
    try {
      const [tSnap, sSnap, maSnap, spfSnap, gSnap, planSnap] = await Promise.all([
        userDoc('trades').get(),
        userDoc('settings').get(),
        userDoc('myAccounts').get(),
        userDoc('spreadsByFirm').get(),
        userDoc('groups').get(),
        userDoc('plan').get(),
      ]);
      let changed = false;
      if (tSnap.exists)   { trades      = tSnap.data().items  || [];  changed = true; }
      if (sSnap.exists)   { settings    = { ...DEFAULT_SETTINGS, ...sSnap.data() }; changed = true; }
      if (maSnap.exists)  { myAccounts  = maSnap.data().items || [];  changed = true; }
      if (spfSnap.exists) {
        const d = spfSnap.data();
        Object.keys(DEFAULT_SPREADS_BY_FIRM).forEach(fk => {
          if (d[fk]) spreadsByFirm[fk] = { ...DEFAULT_SPREADS_BY_FIRM[fk], ...d[fk] };
        });
        changed = true;
      }
      if (gSnap.exists)   { groups = gSnap.data().items || []; changed = true; }
      if (planSnap.exists) { lsSet(lk().plan, planSnap.data()); changed = true; }

      if (changed) {
        const k = lk();
        lsSet(k.trades,        trades);
        lsSet(k.settings,      settings);
        lsSet(k.myAccounts,    myAccounts);
        lsSet(k.spreadsByFirm, spreadsByFirm);
        lsSet(k.groups,        groups);
        window.dispatchEvent(new CustomEvent('store:synced'));
      }
    } catch (e) {
      console.warn('[Store] Firestore read error (mode hors-ligne ?)', e);
    }
  }

  function _mergeAccountTypeDefaults() {
    const defaultById = Object.fromEntries(DEFAULT_ACCOUNT_TYPES.map(d => [d.id, d]));
    const storedIds   = new Set(accountTypes.map(x => x.id));
    accountTypes = accountTypes.map(x => x.firmKey ? x : { ...x, firmKey: (defaultById[x.id]?.firmKey || x.id.split('-')[0]) });
    DEFAULT_ACCOUNT_TYPES.forEach(def => { if (!storedIds.has(def.id)) accountTypes.push(def); });
  }

  // ── Trades ───────────────────────────────────────────────────────────────────
  function getTrades()      { return trades; }
  function getTradeById(id) { return trades.find(t => t.id === id) || null; }

  function _saveTrades() {
    lsSet(lk().trades, trades);
    fbSet('trades', { items: trades });
  }

  function addTrade(trade) {
    const t = { ...trade, id: Date.now().toString() };
    if (!t.date) t.date = new Date().toISOString();
    trades.unshift(t);
    _saveTrades();
    return t;
  }

  function updateTrade(id, data) {
    const idx = trades.findIndex(t => t.id === id);
    if (idx < 0) return null;
    trades[idx] = { ...trades[idx], ...data };
    _saveTrades();
    return trades[idx];
  }

  function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    _saveTrades();
  }

  function importTrades(arr) { trades = [...arr, ...trades]; _saveTrades(); }
  function clearTrades()     { trades = []; _saveTrades(); }
  function exportJSON()      { return JSON.stringify(trades, null, 2); }

  // ── Settings ─────────────────────────────────────────────────────────────────
  function getSettings()        { return { ...settings }; }
  function updateSettings(data) {
    settings = { ...settings, ...data };
    lsSet(lk().settings, settings);
    fbSet('settings', settings);
  }

  // ── Account types (presets statiques) ────────────────────────────────────────
  function getAccountTypes()      { return accountTypes.map(a => ({ ...a })); }
  function getAccountByName(name) { return accountTypes.find(a => a.name === name) || null; }
  function updateAccountTypes(arr){ accountTypes = arr; }

  // ── Prop Firms ───────────────────────────────────────────────────────────────
  function getPropFirms()        { return DEFAULT_PROP_FIRMS; }
  function getPropFirmByKey(key) { return DEFAULT_PROP_FIRMS[key] || null; }

  // ── Mes comptes ───────────────────────────────────────────────────────────────
  function getMyAccounts()          { return myAccounts.map(a => ({ ...a })); }
  function getMyAccountById(id)     { return myAccounts.find(a => a.id === id) || null; }
  function getMyAccountByName(name) { return myAccounts.find(a => a.name === name) || null; }

  function _saveMyAccounts() {
    lsSet(lk().myAccounts, myAccounts);
    fbSet('myAccounts', { items: myAccounts });
  }

  function addMyAccount(data)      { const a = { ...data, id: 'acc-' + Date.now() }; myAccounts.push(a);               _saveMyAccounts(); return a; }
  function updateMyAccount(id, data) {
    const i = myAccounts.findIndex(a => a.id === id);
    if (i < 0) return null;
    myAccounts[i] = { ...myAccounts[i], ...data };
    _saveMyAccounts();
    return myAccounts[i];
  }
  function deleteMyAccount(id) { myAccounts = myAccounts.filter(a => a.id !== id); _saveMyAccounts(); }

  // ── Spreads ───────────────────────────────────────────────────────────────────
  function getSpreads()          { return { ...spreads }; }
  function updateSpreads(data)   { spreads = { ...spreads, ...data }; }

  function getSpreadsByFirm(key) { return { ...(spreadsByFirm[key] || DEFAULT_SPREADS) }; }
  function getAllSpreadsByFirm()  { return JSON.parse(JSON.stringify(spreadsByFirm)); }
  function updateSpreadsByFirm(key, data) {
    spreadsByFirm[key] = { ...(spreadsByFirm[key] || DEFAULT_SPREADS), ...data };
    lsSet(lk().spreadsByFirm, spreadsByFirm);
    fbSet('spreadsByFirm', spreadsByFirm);
  }

  // ── Groupes ───────────────────────────────────────────────────────────────────
  function getGroups()      { return groups.map(g => ({ ...g })); }
  function getGroupById(id) { return groups.find(g => g.id === id) || null; }

  function _saveGroups() {
    lsSet(lk().groups, groups);
    fbSet('groups', { items: groups });
  }

  function addGroup(data)      { const g = { ...data, id: 'grp-' + Date.now() }; groups.push(g); _saveGroups(); return g; }
  function updateGroup(id, data) {
    const i = groups.findIndex(g => g.id === id);
    if (i < 0) return null;
    groups[i] = { ...groups[i], ...data };
    _saveGroups();
    return groups[i];
  }
  function deleteGroup(id) { groups = groups.filter(g => g.id !== id); _saveGroups(); }

  // ── Plan ─────────────────────────────────────────────────────────────────────
  const PRO_CODES = ['ZELDTRADE-PRO-2026', 'JTRADE-PRO-2026'];

  function getPlanInfo() { return lsGet(lk().plan) || { plan: 'basic' }; }
  function isPro()       { return getPlanInfo().plan === 'pro'; }
  function activatePro(code) {
    if (!PRO_CODES.includes(code.trim().toUpperCase())) return false;
    const info = { plan: 'pro', activatedAt: Date.now(), code: code.trim().toUpperCase() };
    lsSet(lk().plan, info);
    fbSet('plan', info);
    return true;
  }

  // ── IA usage ─────────────────────────────────────────────────────────────────
  function getAIUsage()      { return lsGet(lk().aiUsage) || { date: '', count: 0 }; }
  function canAnalyzeToday() {
    if (isPro()) return true;
    const today = new Date().toISOString().split('T')[0];
    const u = getAIUsage();
    return u.date !== today || u.count < 1;
  }
  function recordAnalysis() {
    const today = new Date().toISOString().split('T')[0];
    const u = getAIUsage();
    lsSet(lk().aiUsage, { date: today, count: u.date === today ? u.count + 1 : 1 });
  }

  function canAddAccount() { return isPro() || myAccounts.length < 1; }

  // ── Stats ─────────────────────────────────────────────────────────────────────
  function getStats() {
    const closed = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
    const wins   = closed.filter(t => t.outcome === 'win');
    const totalPnL = trades.reduce((s, t) => { const c = Calc.trade(t); return s + (c.netPnl !== null ? c.netPnl : 0); }, 0);
    return {
      totalPnL,
      winRate: closed.length ? (wins.length / closed.length) * 100 : null,
      avgRR:   trades.length ? trades.reduce((s, t) => s + Calc.trade(t).rr, 0) / trades.length : 0,
      total:   trades.length,
      open:    trades.filter(t => t.outcome === 'open').length,
      wins:    wins.length,
      losses:  closed.length - wins.length,
    };
  }

  return {
    initForUser,
    getTrades, getTradeById, addTrade, updateTrade, deleteTrade, importTrades, clearTrades, exportJSON,
    getSettings, updateSettings,
    getAccountTypes, getAccountByName, updateAccountTypes,
    getPropFirms, getPropFirmByKey,
    getMyAccounts, getMyAccountById, getMyAccountByName, addMyAccount, updateMyAccount, deleteMyAccount,
    getSpreads, updateSpreads, getSpreadsByFirm, getAllSpreadsByFirm, updateSpreadsByFirm,
    getGroups, getGroupById, addGroup, updateGroup, deleteGroup,
    getPlanInfo, isPro, activatePro, canAnalyzeToday, recordAnalysis, canAddAccount,
    getStats,
  };
})();
