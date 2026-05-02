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

  const DEFAULT_SPREADS = { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 };
  const DEFAULT_SPREADS_BY_FIRM = {
    apex:    { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 },
    topstep: { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00,ZN1:15.63 },
    ftmo:    { US500:0.50,US100:1.50,US30:2.50,GER40:1.50,UK100:1.00,XAUUSD:0.35,EURUSD:1.00,GBPUSD:1.20,USDJPY:0.80,USOIL:3.00 },
    lucid:   { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 },
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
  let _plan         = { plan: 'basic' };
  let _aiUsage      = { date: '', count: 0 };

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
    _uid      = userId || 'default';
    _plan     = { plan: 'basic' };
    _aiUsage  = { date: '', count: 0 };
    trades        = [];
    settings      = { ...DEFAULT_SETTINGS };
    accountTypes  = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
    myAccounts    = [];
    spreads       = { ...DEFAULT_SPREADS };
    spreadsByFirm = Object.fromEntries(Object.keys(DEFAULT_SPREADS_BY_FIRM).map(k => [k, { ...DEFAULT_SPREADS_BY_FIRM[k] }]));
    groups        = [];
    _loadFromLocalStorage();
    _loadFromFirestore();
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
    // _plan and _aiUsage are intentionally NOT loaded from localStorage:
    // always start as Basic/empty so localStorage manipulation cannot grant
    // temporary Pro access (e.g. adding extra accounts) before Firestore syncs.
    _mergeAccountTypeDefaults();
  }

  function _withTimeout(promise, ms) {
    return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore timeout')), ms))]);
  }

  async function _loadFromFirestore() {
    try {
      const [tSnap, sSnap, maSnap, spfSnap, gSnap, planSnap, aiSnap] = await _withTimeout(Promise.all([
        userDoc('trades').get(),
        userDoc('settings').get(),
        userDoc('myAccounts').get(),
        userDoc('spreadsByFirm').get(),
        userDoc('groups').get(),
        userDoc('plan').get(),
        userDoc('aiUsage').get(),
      ]), 10000);
      let changed = false;
      if (tSnap.exists)   { trades      = tSnap.data().items  || [];  changed = true; }
      if (sSnap.exists) {
        const { groqKey: _, ...cloudSettings } = sSnap.data();
        settings = { ...DEFAULT_SETTINGS, ...cloudSettings, groqKey: settings.groqKey };
        changed = true;
      }
      if (maSnap.exists)  { myAccounts  = maSnap.data().items || [];  changed = true; }
      if (spfSnap.exists) {
        const d = spfSnap.data();
        Object.keys(DEFAULT_SPREADS_BY_FIRM).forEach(fk => {
          if (d[fk]) spreadsByFirm[fk] = { ...DEFAULT_SPREADS_BY_FIRM[fk], ...d[fk] };
        });
        changed = true;
      }
      if (gSnap.exists)  { groups = gSnap.data().items || []; changed = true; }
      if (planSnap.exists) {
        const planData = planSnap.data();
        const wasPro = _plan.plan === 'pro';
        _plan = { plan: 'basic', ...planData };
        if ((_plan.plan === 'pro') !== wasPro) {
          window.dispatchEvent(new CustomEvent('store:planChanged'));
        }
        changed = true;
      }
      if (aiSnap.exists) {
        const aiData = aiSnap.data();
        _aiUsage = { date: '', count: 0, ...aiData };
        changed = true;
      }

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

  const DIRS     = new Set(['long', 'short']);
  const OUTCOMES = new Set(['win', 'loss', 'be', 'open']);
  function _safeNum(v, min, max, def) {
    const n = parseFloat(v);
    if (!isFinite(n)) return def;
    return Math.max(min, Math.min(max, n));
  }
  function _sanitizeTrade(raw) {
    return {
      instrument: String(raw.instrument || '').replace(/[^A-Za-z0-9/. _-]/g, '').slice(0, 20) || 'MES1',
      direction:  DIRS.has(raw.direction)    ? raw.direction : 'long',
      outcome:    OUTCOMES.has(raw.outcome)  ? raw.outcome   : 'open',
      contracts:  Math.max(1, Math.min(999, parseInt(raw.contracts) || 1)),
      setup:      String(raw.setup  || '').slice(0, 500),
      notes:      String(raw.notes  || '').slice(0, 2000),
      apex:       String(raw.apex   || '').replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 100),
      date:       (() => { try { const d = new Date(raw.date); return (isFinite(d) && /^\d{4}-\d{2}-\d{2}T/.test(raw.date)) ? raw.date : new Date().toISOString(); } catch { return new Date().toISOString(); } })(),
      entry:      raw.entry  != null ? _safeNum(raw.entry,  -1e7, 1e7, null) : null,
      sl:         raw.sl     != null ? _safeNum(raw.sl,     -1e7, 1e7, null) : null,
      tp1:        raw.tp1    != null ? _safeNum(raw.tp1,    -1e7, 1e7, null) : null,
      tp2:        raw.tp2    != null ? _safeNum(raw.tp2,    -1e7, 1e7, null) : null,
      pnl:        raw.pnl    != null ? _safeNum(raw.pnl,    -1e7, 1e7, null) : null,
      rr:         raw.rr     != null ? _safeNum(raw.rr,     -100, 100, null) : null,
    };
  }

  function addTrade(trade) {
    const t = { ..._sanitizeTrade(trade), id: Date.now().toString() };
    if (!t.date) t.date = new Date().toISOString();
    trades.unshift(t);
    _saveTrades();
    return t;
  }

  function updateTrade(id, data) {
    const idx = trades.findIndex(t => t.id === id);
    if (idx < 0) return null;
    trades[idx] = { ...trades[idx], ..._sanitizeTrade(data) };
    _saveTrades();
    return trades[idx];
  }

  function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    _saveTrades();
  }

  function importTrades(arr) {
    if (!Array.isArray(arr)) return 0;
    const sanitized = arr.filter(t => t && typeof t === 'object' &&
      typeof t.instrument === 'string' && t.instrument.trim() &&
      DIRS.has(t.direction) && OUTCOMES.has(t.outcome)
    ).map(t => ({
      id:         String(t.id || Date.now() + Math.random()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32),
      date:       /^\d{4}-\d{2}-\d{2}/.test(String(t.date)) ? String(t.date) : new Date().toISOString(),
      instrument: String(t.instrument).replace(/[^A-Za-z0-9/. _-]/g, '').slice(0, 20),
      direction:  t.direction,
      outcome:    t.outcome,
      entry:      Number(t.entry)     || 0,
      sl:         Number(t.sl)        || 0,
      tp1:        Number(t.tp1)       || 0,
      ...(t.tp2       ? { tp2:       Number(t.tp2) }       : {}),
      ...(t.tp3       ? { tp3:       Number(t.tp3) }       : {}),
      ...(t.exitPrice ? { exitPrice: Number(t.exitPrice) } : {}),
      contracts:  Math.max(1, Math.min(999, parseInt(t.contracts) || 1)),
      setup:      t.setup  ? String(t.setup).slice(0, 500)  : '',
      notes:      t.notes  ? String(t.notes).slice(0, 2000) : '',
      apex:       t.apex   ? String(t.apex).replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 100) : '',
    }));
    trades = [...sanitized, ...trades];
    _saveTrades();
    return sanitized.length;
  }
  function clearTrades()     { trades = []; _saveTrades(); }
  function exportJSON()      { return JSON.stringify(trades, null, 2); }

  // ── Settings ─────────────────────────────────────────────────────────────────
  function getSettings()        { return { ...settings }; }
  function getGroqKey()         { return settings.groqKey || ''; }
  const SETTINGS_ALLOWED = new Set(['capital','contracts','instrument','groqKey']);
  function updateSettings(data) {
    const safe = Object.create(null);
    for (const [k, v] of Object.entries(data)) {
      if (!SETTINGS_ALLOWED.has(k)) continue;
      if (k === 'capital')    safe.capital    = _safeNum(v, 0, 1e9, 50000);
      else if (k === 'contracts') safe.contracts = _safeNum(v, 1, 999, 1);
      else if (k === 'instrument') safe.instrument = String(v).replace(/[^A-Za-z0-9/. _-]/g,'').slice(0,20) || 'MES1';
      else if (k === 'groqKey') safe.groqKey = String(v || '').slice(0, 200);
    }
    settings = { ...settings, ...safe };
    lsSet(lk().settings, settings);
    const { groqKey: _, ...cloudSettings } = settings;
    fbSet('settings', cloudSettings);
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

  function _sanitizeAccountName(name) {
    return String(name || '').replace(/[<>"'`]/g, '').trim().slice(0, 50);
  }
  function _sanitizeAccount(data) {
    const s = {};
    if (data.name        !== undefined) s.name           = _sanitizeAccountName(data.name);
    if (data.firmKey     !== undefined) s.firmKey        = String(data.firmKey || '').replace(/[^a-z0-9_-]/g, '').slice(0, 20);
    if (data.status      !== undefined) s.status         = ['evaluation','funded'].includes(data.status) ? data.status : 'evaluation';
    if (data.capital     !== undefined) s.capital        = _safeNum(data.capital,       0, 1e9, 0);
    if (data.profitTarget!== undefined) s.profitTarget   = _safeNum(data.profitTarget,  0, 1e7, 0);
    if (data.maxDrawdown !== undefined) s.maxDrawdown    = _safeNum(data.maxDrawdown,   0, 1e7, 0);
    if (data.dailyLossLimit!==undefined)s.dailyLossLimit = _safeNum(data.dailyLossLimit,0, 1e7, 0);
    if (data.maxContracts!== undefined) s.maxContracts   = _safeNum(data.maxContracts,  1, 999, 1);
    if (data.feePerSide  !== undefined) s.feePerSide     = _safeNum(data.feePerSide,    0, 100, 0);
    return s;
  }
  function addMyAccount(data) {
    const a = { ...data, ..._sanitizeAccount(data), id: 'acc-' + Date.now() };
    myAccounts.push(a);
    _saveMyAccounts();
    return a;
  }
  function updateMyAccount(id, data) {
    const i = myAccounts.findIndex(a => a.id === id);
    if (i < 0) return null;
    myAccounts[i] = { ...myAccounts[i], ..._sanitizeAccount(data) };
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

  function _sanitizeGroupName(name) {
    return String(name || '').replace(/[<>"'`]/g, '').trim().slice(0, 50);
  }
  function addGroup(data) {
    const g = { ...data, name: _sanitizeGroupName(data.name), id: 'grp-' + Date.now() };
    groups.push(g);
    _saveGroups();
    return g;
  }
  function updateGroup(id, data) {
    const i = groups.findIndex(g => g.id === id);
    if (i < 0) return null;
    const clean = data.name !== undefined ? { ...data, name: _sanitizeGroupName(data.name) } : data;
    groups[i] = { ...groups[i], ...clean };
    _saveGroups();
    return groups[i];
  }
  function deleteGroup(id) { groups = groups.filter(g => g.id !== id); _saveGroups(); }

  // ── Plan ─────────────────────────────────────────────────────────────────────
  async function _sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getPlanInfo() { return { ..._plan }; }
  function isPro()       { return _plan.plan === 'pro'; }

  let _proAttempts = 0;
  let _proThrottleUntil = 0;
  async function activatePro(code) {
    if (Date.now() < _proThrottleUntil) return 'throttled';
    try {
      const normalized = code.trim().toUpperCase().replace(/[-\s]/g, '');
      if (!normalized) return false;
      const hash    = await _sha256(normalized);
      const hashDoc = await _fbDb.collection('proCodeHashes').doc(hash).get();
      if (!hashDoc.exists) {
        _proAttempts++;
        if (_proAttempts >= 3) { _proThrottleUntil = Date.now() + 60_000; _proAttempts = 0; }
        return false;
      }
      const hdata = hashDoc.data();
      if (hdata.uid !== _uid) {
        _proAttempts++;
        if (_proAttempts >= 3) { _proThrottleUntil = Date.now() + 60_000; _proAttempts = 0; }
        return false;
      }
      _proAttempts = 0;
      const info = { plan: 'pro', activatedAt: Date.now(), codeHash: hash };
      _plan = { ...info };
      await userDoc('plan').set(info);
      window.dispatchEvent(new CustomEvent('store:planChanged'));
      return true;
    } catch (e) {
      console.warn('[Store] activatePro error', e);
      return false;
    }
  }

  // ── IA usage ─────────────────────────────────────────────────────────────────
  function getAIUsage()      { return { ..._aiUsage }; }
  function canAnalyzeToday() {
    if (isPro()) return true;
    const today = new Date().toISOString().split('T')[0];
    return _aiUsage.date !== today || _aiUsage.count < 1;
  }
  function recordAnalysis() {
    const today = new Date().toISOString().split('T')[0];
    const next  = { date: today, count: _aiUsage.date === today ? _aiUsage.count + 1 : 1 };
    _aiUsage = next;
    lsSet(lk().aiUsage, next);
    fbSet('aiUsage', next);
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
    getSettings, getGroqKey, updateSettings,
    getAccountTypes, getAccountByName, updateAccountTypes,
    getPropFirms, getPropFirmByKey,
    getMyAccounts, getMyAccountById, getMyAccountByName, addMyAccount, updateMyAccount, deleteMyAccount,
    getSpreads, updateSpreads, getSpreadsByFirm, getAllSpreadsByFirm, updateSpreadsByFirm,
    getGroups, getGroupById, addGroup, updateGroup, deleteGroup,
    getPlanInfo, isPro, activatePro, canAnalyzeToday, recordAnalysis, canAddAccount,
    getStats,
  };
})();
