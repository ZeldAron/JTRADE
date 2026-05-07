// ─── STORE ───────────────────────────────────────────────────────────────────
// Persistance double : localStorage (rapide) + Firestore (cross-device)

const Store = (() => {

  // YYYY-MM-DD au fuseau local (évite les bordures de jour UTC)
  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── Données statiques (presets, référence) ───────────────────────────────────
  const DEFAULT_SETTINGS = { capital: 50000, contracts: 1, instrument: 'MES1' };

  const DEFAULT_ACCOUNT_TYPES = [
    { id: 'apex-25k',     firmKey: 'apex',    name: 'Apex $25K',      capital:  25000, profitTarget:  1500, maxDrawdown:  1000, dailyLossLimit:   500, maxContracts:  4, feePerSide: 1.99 },
    { id: 'apex-50k',     firmKey: 'apex',    name: 'Apex $50K',      capital:  50000, profitTarget:  3000, maxDrawdown:  2000, dailyLossLimit:  1000, maxContracts:  6, feePerSide: 1.99 },
    { id: 'apex-100k',    firmKey: 'apex',    name: 'Apex $100K',     capital: 100000, profitTarget:  6000, maxDrawdown:  3000, dailyLossLimit:  1500, maxContracts:  8, feePerSide: 1.99 },
    { id: 'apex-150k',    firmKey: 'apex',    name: 'Apex $150K',     capital: 150000, profitTarget:  9000, maxDrawdown:  4000, dailyLossLimit:  2000, maxContracts: 12, feePerSide: 1.99 },
    { id: 'topstep-50k',  firmKey: 'topstep', name: 'Topstep $50K',   capital:  50000, profitTarget:  3000, maxDrawdown:  2000, dailyLossLimit:     0, maxContracts:  5, feePerSide: 1.90 },
    { id: 'topstep-100k', firmKey: 'topstep', name: 'Topstep $100K',  capital: 100000, profitTarget:  6000, maxDrawdown:  3000, dailyLossLimit:     0, maxContracts: 10, feePerSide: 1.90 },
    { id: 'topstep-150k', firmKey: 'topstep', name: 'Topstep $150K',  capital: 150000, profitTarget:  9000, maxDrawdown:  4500, dailyLossLimit:     0, maxContracts: 15, feePerSide: 1.90 },
    // FTMO 2-Step Challenge (drawdown statique 10%, daily loss 5%, min 4 jours)
    { id: 'ftmo-10k',     firmKey: 'ftmo',    name: 'FTMO $10K',      capital:  10000, profitTarget:  1000, maxDrawdown:  1000, dailyLossLimit:   500, maxContracts: 10, feePerSide: 2.50 },
    { id: 'ftmo-25k',     firmKey: 'ftmo',    name: 'FTMO $25K',      capital:  25000, profitTarget:  2500, maxDrawdown:  2500, dailyLossLimit:  1250, maxContracts: 20, feePerSide: 2.50 },
    { id: 'ftmo-50k',     firmKey: 'ftmo',    name: 'FTMO $50K',      capital:  50000, profitTarget:  5000, maxDrawdown:  5000, dailyLossLimit:  2500, maxContracts: 30, feePerSide: 2.50 },
    { id: 'ftmo-100k',    firmKey: 'ftmo',    name: 'FTMO $100K',     capital: 100000, profitTarget: 10000, maxDrawdown: 10000, dailyLossLimit:  5000, maxContracts: 50, feePerSide: 2.50 },
    { id: 'ftmo-200k',    firmKey: 'ftmo',    name: 'FTMO $200K',     capital: 200000, profitTarget: 20000, maxDrawdown: 20000, dailyLossLimit: 10000, maxContracts: 50, feePerSide: 2.50 },
    // FTMO 1-Step Challenge (drawdown trailing 10%, daily loss 3%, 0 jours min, 90% split)
    { id: 'ftmo1-10k',    firmKey: 'ftmo1step', name: 'FTMO 1-Step $10K',   capital:  10000, profitTarget:  1000, maxDrawdown:  1000, dailyLossLimit:   300, maxContracts: 10, feePerSide: 2.50 },
    { id: 'ftmo1-25k',    firmKey: 'ftmo1step', name: 'FTMO 1-Step $25K',   capital:  25000, profitTarget:  2500, maxDrawdown:  2500, dailyLossLimit:   750, maxContracts: 20, feePerSide: 2.50 },
    { id: 'ftmo1-50k',    firmKey: 'ftmo1step', name: 'FTMO 1-Step $50K',   capital:  50000, profitTarget:  5000, maxDrawdown:  5000, dailyLossLimit:  1500, maxContracts: 30, feePerSide: 2.50 },
    { id: 'ftmo1-100k',   firmKey: 'ftmo1step', name: 'FTMO 1-Step $100K',  capital: 100000, profitTarget: 10000, maxDrawdown: 10000, dailyLossLimit:  3000, maxContracts: 50, feePerSide: 2.50 },
    { id: 'ftmo1-200k',   firmKey: 'ftmo1step', name: 'FTMO 1-Step $200K',  capital: 200000, profitTarget: 20000, maxDrawdown: 20000, dailyLossLimit:  6000, maxContracts: 50, feePerSide: 2.50 },
    { id: 'lucid-25k',    firmKey: 'lucid',   name: 'Lucid $25K',     capital:  25000, profitTarget:  1500, maxDrawdown:  1500, dailyLossLimit:   300, maxContracts:  3,   feePerSide: 1.75 },
    { id: 'lucid-50k',    firmKey: 'lucid',   name: 'Lucid $50K',     capital:  50000, profitTarget:  3000, maxDrawdown:  3000, dailyLossLimit:   600, maxContracts:  5,   feePerSide: 1.75 },
    { id: 'lucid-100k',   firmKey: 'lucid',   name: 'Lucid $100K',    capital: 100000, profitTarget:  6000, maxDrawdown:  4500, dailyLossLimit:  1200, maxContracts: 10,   feePerSide: 1.75 },
    { id: 'lucid-150k',   firmKey: 'lucid',   name: 'Lucid $150K',    capital: 150000, profitTarget:  9000, maxDrawdown:  4500, dailyLossLimit:  2700, maxContracts: 15,   feePerSide: 1.75 },
    { id: 'fpips-10k',    firmKey: 'fpips',   name: 'Funding Pips $10K',  capital:  10000, profitTarget:   800, maxDrawdown:   500, dailyLossLimit:   200, maxContracts:  2,   feePerSide: 0.00 },
    { id: 'fpips-25k',    firmKey: 'fpips',   name: 'Funding Pips $25K',  capital:  25000, profitTarget:  2000, maxDrawdown:  1250, dailyLossLimit:   500, maxContracts:  5,   feePerSide: 0.00 },
    { id: 'fpips-50k',    firmKey: 'fpips',   name: 'Funding Pips $50K',  capital:  50000, profitTarget:  4000, maxDrawdown:  2500, dailyLossLimit:  1000, maxContracts: 10,   feePerSide: 0.00 },
    { id: 'fpips-100k',   firmKey: 'fpips',   name: 'Funding Pips $100K', capital: 100000, profitTarget:  8000, maxDrawdown:  5000, dailyLossLimit:  2000, maxContracts: 20,   feePerSide: 0.00 },
    { id: 'fpips-200k',   firmKey: 'fpips',   name: 'Funding Pips $200K', capital: 200000, profitTarget: 16000, maxDrawdown: 10000, dailyLossLimit:  4000, maxContracts: 40,   feePerSide: 0.00 },
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
      { id:'ftmo-10k',     size:'10K',  capital:10000,  profitTarget:1000,  maxDrawdown:1000,  dailyLossLimit:500,   drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80% split (90% après scaling) — fee remboursé au 1er payout' },
      { id:'ftmo-25k',     size:'25K',  capital:25000,  profitTarget:2500,  maxDrawdown:2500,  dailyLossLimit:1250,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80% split (90% après scaling) — fee remboursé au 1er payout' },
      { id:'ftmo-50k',     size:'50K',  capital:50000,  profitTarget:5000,  maxDrawdown:5000,  dailyLossLimit:2500,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80% split (90% après scaling) — fee remboursé au 1er payout' },
      { id:'ftmo-100k',    size:'100K', capital:100000, profitTarget:10000, maxDrawdown:10000, dailyLossLimit:5000,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80% split (90% après scaling) — fee remboursé au 1er payout' },
      { id:'ftmo-200k',    size:'200K', capital:200000, profitTarget:20000, maxDrawdown:20000, dailyLossLimit:10000, drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:4, payoutConditions:'80% split (90% après scaling) — fee remboursé au 1er payout' },
    ]},
    ftmo1step: { name: 'FTMO 1-Step', accounts: [
      { id:'ftmo1-10k',    size:'10K',  capital:10000,  profitTarget:1000,  maxDrawdown:1000,  dailyLossLimit:300,   drawdownType:'Trailing (1-Step)', consistency:'Best day ≤50% des profits totaux', minTradingDays:0, payoutConditions:'90% split dès le départ — fee remboursé au 1er payout' },
      { id:'ftmo1-25k',    size:'25K',  capital:25000,  profitTarget:2500,  maxDrawdown:2500,  dailyLossLimit:750,   drawdownType:'Trailing (1-Step)', consistency:'Best day ≤50% des profits totaux', minTradingDays:0, payoutConditions:'90% split dès le départ — fee remboursé au 1er payout' },
      { id:'ftmo1-50k',    size:'50K',  capital:50000,  profitTarget:5000,  maxDrawdown:5000,  dailyLossLimit:1500,  drawdownType:'Trailing (1-Step)', consistency:'Best day ≤50% des profits totaux', minTradingDays:0, payoutConditions:'90% split dès le départ — fee remboursé au 1er payout' },
      { id:'ftmo1-100k',   size:'100K', capital:100000, profitTarget:10000, maxDrawdown:10000, dailyLossLimit:3000,  drawdownType:'Trailing (1-Step)', consistency:'Best day ≤50% des profits totaux', minTradingDays:0, payoutConditions:'90% split dès le départ — fee remboursé au 1er payout' },
      { id:'ftmo1-200k',   size:'200K', capital:200000, profitTarget:20000, maxDrawdown:20000, dailyLossLimit:6000,  drawdownType:'Trailing (1-Step)', consistency:'Best day ≤50% des profits totaux', minTradingDays:0, payoutConditions:'90% split dès le départ — fee remboursé au 1er payout' },
    ]},
    lucid:   { name: 'Lucid Trading',   accounts: [
      { id:'lucid-25k',    size:'25K',  capital:25000,  profitTarget:1500, maxDrawdown:1500, dailyLossLimit:300,  drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-50k',    size:'50K',  capital:50000,  profitTarget:3000, maxDrawdown:3000, dailyLossLimit:600,  drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-100k',   size:'100K', capital:100000, profitTarget:6000, maxDrawdown:4500, dailyLossLimit:1200, drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
      { id:'lucid-150k',   size:'150K', capital:150000, profitTarget:9000, maxDrawdown:4500, dailyLossLimit:2700, drawdownType:'Trailing EOD', consistency:'≤40% meilleure j. (funded)', minTradingDays:5, payoutConditions:'100% premier $10K, puis 90/10 — 5j min' },
    ]},
    fpips:   { name: 'Funding Pips (CFD/Forex)', accounts: [
      { id:'fpips-10k',    size:'10K',  capital:10000,  profitTarget:800,   maxDrawdown:500,   dailyLossLimit:200,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:3, payoutConditions:'80% split — délai 14j' },
      { id:'fpips-25k',    size:'25K',  capital:25000,  profitTarget:2000,  maxDrawdown:1250,  dailyLossLimit:500,  drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:3, payoutConditions:'80% split — délai 14j' },
      { id:'fpips-50k',    size:'50K',  capital:50000,  profitTarget:4000,  maxDrawdown:2500,  dailyLossLimit:1000, drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:3, payoutConditions:'80% split — délai 14j' },
      { id:'fpips-100k',   size:'100K', capital:100000, profitTarget:8000,  maxDrawdown:5000,  dailyLossLimit:2000, drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:3, payoutConditions:'80% split — délai 14j' },
      { id:'fpips-200k',   size:'200K', capital:200000, profitTarget:16000, maxDrawdown:10000, dailyLossLimit:4000, drawdownType:'Statique (2-Step)', consistency:'Aucune', minTradingDays:3, payoutConditions:'80% split — délai 14j' },
    ]},
  };

  const DEFAULT_SPREADS = { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 };
  const DEFAULT_SPREADS_BY_FIRM = {
    apex:    { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 },
    topstep: { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00,ZN1:15.63 },
    ftmo:      { US500:0.50,US100:1.50,US30:2.50,GER40:1.50,UK100:1.00,XAUUSD:0.35,EURUSD:1.00,GBPUSD:1.20,USDJPY:0.80,USOIL:3.00 },
    ftmo1step: { US500:0.50,US100:1.50,US30:2.50,GER40:1.50,UK100:1.00,XAUUSD:0.35,EURUSD:1.00,GBPUSD:1.20,USDJPY:0.80,USOIL:3.00 },
    lucid:   { MES1:1.25,ES1:12.50,MNQ1:0.50,NQ1:5.00,MYM1:0.50,YM1:5.00,M2K1:0.50,RTY1:5.00,MGC1:1.00,GC1:10.00,QO1:6.25,MCL1:1.00,CL1:10.00 },
    fpips:   { US500:0.40,US100:1.20,US30:2.00,GER40:1.20,UK100:0.80,XAUUSD:0.25,EURUSD:0.80,GBPUSD:1.00,USDJPY:0.70,USOIL:2.50 },
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
  let _globalGroqKey = '';

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
    _uid           = userId || 'default';
    _plan          = { plan: 'basic' };
    _aiUsage       = { date: '', count: 0 };
    _globalGroqKey = '';
    trades        = [];
    settings      = { ...DEFAULT_SETTINGS };
    accountTypes  = DEFAULT_ACCOUNT_TYPES.map(a => ({ ...a }));
    myAccounts    = [];
    spreads       = { ...DEFAULT_SPREADS };
    spreadsByFirm = Object.fromEntries(Object.keys(DEFAULT_SPREADS_BY_FIRM).map(k => [k, { ...DEFAULT_SPREADS_BY_FIRM[k] }]));
    groups        = [];
    _loadFromLocalStorage();
    _loadFromFirestore().then(_migrateLegacyData).catch(() => _migrateLegacyData());
  }

  // Migration auto pour les données legacy :
  //  - Comptes FTMO 1-Step créés avant v0.9.89 ont firmKey:'ftmo' au lieu de 'ftmo1step'
  //  - Trades anciens n'ont pas capital/feePerSide stockés → on les hydrate
  //    depuis le compte associé (apex) si présent
  function _migrateLegacyData() {
    let migrated = false;
    // 1. firmKey legacy pour FTMO 1-Step
    myAccounts.forEach(a => {
      if (a.firmKey === 'ftmo' && /1[-\s]step/i.test(a.name || '')) {
        a.firmKey = 'ftmo1step';
        migrated = true;
      }
    });
    // 2. capital + feePerSide manquants sur les trades : hydrater depuis le compte
    const accByName = Object.fromEntries(myAccounts.map(a => [a.name, a]));
    trades.forEach(t => {
      if (t.apex && (t.capital == null || t.feePerSide == null)) {
        const acc = accByName[t.apex];
        if (acc) {
          if (t.capital    == null) { t.capital    = acc.capital + (acc.pnlOffset || 0); migrated = true; }
          if (t.feePerSide == null) { t.feePerSide = (acc.feePerSide != null) ? acc.feePerSide : 2.14; migrated = true; }
        }
      }
    });
    if (migrated) {
      _saveMyAccounts();
      _saveTrades();
    }
  }

  function _loadFromLocalStorage() {
    const k = lk();
    const t  = lsGet(k.trades);
    const s  = lsGet(k.settings);
    const ma = lsGet(k.myAccounts);
    const spf = lsGet(k.spreadsByFirm);
    const g  = lsGet(k.groups);
    if (t)   trades   = t;
    if (s) {
      const { groqKey: _gk, ...safeS } = s;
      settings = { ...DEFAULT_SETTINGS, ...safeS };
    }
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
      // Note : config/groq supprimé — la clé Groq vit désormais dans Google
      // Secret Manager côté Cloud Function. Plus aucune lecture client.
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
        const raw = sSnap.data();
        settings = {
          capital:    (typeof raw.capital    === 'number' && isFinite(raw.capital))    ? Math.max(0, Math.min(1e9, raw.capital))    : DEFAULT_SETTINGS.capital,
          contracts:  (typeof raw.contracts  === 'number' && isFinite(raw.contracts))  ? Math.max(0.01, Math.min(999, raw.contracts))  : DEFAULT_SETTINGS.contracts,
          instrument: (typeof raw.instrument === 'string' && raw.instrument.length > 0) ? String(raw.instrument).replace(/[^A-Za-z0-9/. _-]/g, '').slice(0, 20) || DEFAULT_SETTINGS.instrument : DEFAULT_SETTINGS.instrument,
        };
        changed = true;
      }
      if (maSnap.exists)  { myAccounts  = maSnap.data().items || [];  changed = true; }
      if (spfSnap.exists) {
        const d = spfSnap.data();
        Object.keys(DEFAULT_SPREADS_BY_FIRM).forEach(fk => {
          if (d[fk] && typeof d[fk] === 'object') {
            const safe = { ...DEFAULT_SPREADS_BY_FIRM[fk] };
            Object.keys(DEFAULT_SPREADS_BY_FIRM[fk]).forEach(instr => {
              if (instr in d[fk]) {
                const v = parseFloat(d[fk][instr]);
                if (isFinite(v) && v >= 0) safe[instr] = v;
              }
            });
            spreadsByFirm[fk] = safe;
          }
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
        _aiUsage = {
          date:  (typeof aiData.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(aiData.date)) ? aiData.date : '',
          count: (typeof aiData.count === 'number' && isFinite(aiData.count)) ? Math.max(0, Math.floor(aiData.count)) : 0,
        };
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
    const out = {
      instrument: String(raw.instrument || '').replace(/[^A-Za-z0-9/. _-]/g, '').slice(0, 20) || 'MES1',
      direction:  DIRS.has(raw.direction)    ? raw.direction : 'long',
      outcome:    OUTCOMES.has(raw.outcome)  ? raw.outcome   : 'open',
      contracts:  Math.max(0.01, Math.min(999, parseFloat(raw.contracts) || 0.01)),
      setup:      String(raw.setup  || '').slice(0, 500),
      notes:      String(raw.notes  || '').slice(0, 2000),
      apex:       String(raw.apex   || '').replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 100),
      date:       (() => { try { const d = new Date(raw.date); return (isFinite(d) && /^\d{4}-\d{2}-\d{2}T/.test(raw.date)) ? raw.date : new Date().toISOString(); } catch { return new Date().toISOString(); } })(),
      entry:      raw.entry      != null ? _safeNum(raw.entry,      -1e7, 1e7, null) : null,
      sl:         raw.sl         != null ? _safeNum(raw.sl,         -1e7, 1e7, null) : null,
      tp1:        raw.tp1        != null ? _safeNum(raw.tp1,        -1e7, 1e7, null) : null,
      tp2:        raw.tp2        != null ? _safeNum(raw.tp2,        -1e7, 1e7, null) : null,
      tp3:        raw.tp3        != null ? _safeNum(raw.tp3,        -1e7, 1e7, null) : null,
      exitPrice:  raw.exitPrice  != null ? _safeNum(raw.exitPrice,  -1e7, 1e7, null) : null,
      // manualPnl ne s'applique QU'aux trades fermés (forcé à null si open)
      manualPnl:  (raw.manualPnl != null && (raw.outcome && raw.outcome !== 'open'))
                    ? _safeNum(raw.manualPnl, -1e9, 1e9, null) : null,
      // Snapshot du compte au moment du trade — préservé pour cohérence historique
      capital:    raw.capital    != null ? _safeNum(raw.capital,     0,    1e9, null) : null,
      feePerSide: raw.feePerSide != null ? _safeNum(raw.feePerSide,  0,    100, null) : null,
      spreadCost: raw.spreadCost != null ? _safeNum(raw.spreadCost,  0,    1000, null) : null,
      pnl:        raw.pnl        != null ? _safeNum(raw.pnl,        -1e7, 1e7, null) : null,
      rr:         raw.rr         != null ? _safeNum(raw.rr,         -100, 100, null) : null,
    };
    // groupId optionnel : utilisé pour lier les trades multi-comptes via groupes
    if (raw.groupId) {
      const safe = String(raw.groupId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      if (safe) out.groupId = safe;
    }
    return out;
  }

  function _newTradeId() {
    // Anti-collision : timestamp + 6 chars random base36
    // (évite les IDs identiques pour Promise.all en groupe)
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function addTrade(trade) {
    const t = { ..._sanitizeTrade(trade), id: _newTradeId() };
    if (!t.date) t.date = new Date().toISOString();
    trades.unshift(t);
    _saveTrades();
    return t;
  }

  function updateTrade(id, data) {
    const idx = trades.findIndex(t => t.id === id);
    if (idx < 0) return null;
    // Merge des données partielles AVANT sanitize : on ne perd jamais les
    // champs existants si `data` ne les contient pas (ex : updateTrade(id, { outcome: 'win' })
    // ne doit pas écraser apex/setup/notes/contracts/instrument/etc.).
    const merged = { ...trades[idx], ...data };
    trades[idx] = { ..._sanitizeTrade(merged), id: trades[idx].id };
    _saveTrades();
    return trades[idx];
  }

  function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    _saveTrades();
  }

  function importTrades(arr) {
    if (!Array.isArray(arr)) return 0;
    // Tous les trades importés passent par _sanitizeTrade — même validation
    // stricte que addTrade/updateTrade : ranges, regex, types, taille.
    const sanitized = arr
      .filter(t => t && typeof t === 'object' && DIRS.has(t.direction) && OUTCOMES.has(t.outcome))
      .map(t => {
        const id = String(t.id || _newTradeId()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || _newTradeId();
        return { ..._sanitizeTrade(t), id };
      });
    trades = [...sanitized, ...trades].slice(0, 10000);
    _saveTrades();
    return sanitized.length;
  }
  function clearTrades()     { trades = []; _saveTrades(); }
  function exportJSON()      { return JSON.stringify(trades, null, 2); }

  // ── Settings ─────────────────────────────────────────────────────────────────
  function getSettings()        { return { ...settings }; }
  function getGroqKey()         { return _globalGroqKey; }
  const SETTINGS_ALLOWED = new Set(['capital','contracts','instrument']);
  function updateSettings(data) {
    const safe = Object.create(null);
    for (const [k, v] of Object.entries(data)) {
      if (!SETTINGS_ALLOWED.has(k)) continue;
      if (k === 'capital')         safe.capital    = _safeNum(v, 0, 1e9, 50000);
      else if (k === 'contracts')  safe.contracts  = _safeNum(v, 0.01, 999, 1);
      else if (k === 'instrument') safe.instrument = String(v).replace(/[^A-Za-z0-9/. _-]/g,'').slice(0,20) || 'MES1';
    }
    settings = { ...settings, ...safe };
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

  function _sanitizeAccountName(name) {
    return String(name || '').replace(/[<>"]/g, '').trim().slice(0, 50);
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
    if (data.pnlOffset   !== undefined) s.pnlOffset      = _safeNum(data.pnlOffset,    -1e7, 1e7, 0);
    return s;
  }
  function _isAccountNameTaken(name, excludeId) {
    const n = String(name || '').trim().toLowerCase();
    return myAccounts.some(a => a.id !== excludeId && String(a.name || '').trim().toLowerCase() === n);
  }

  function addMyAccount(data) {
    const sanitized = _sanitizeAccount(data);
    if (_isAccountNameTaken(sanitized.name)) {
      throw new Error('Un compte avec ce nom existe déjà.');
    }
    const a = { ...data, ...sanitized, id: 'acc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) };
    myAccounts.push(a);
    _saveMyAccounts();
    return a;
  }
  function updateMyAccount(id, data) {
    const i = myAccounts.findIndex(a => a.id === id);
    if (i < 0) return null;
    const sanitized = _sanitizeAccount(data);
    if (sanitized.name && _isAccountNameTaken(sanitized.name, id)) {
      throw new Error('Un autre compte porte déjà ce nom.');
    }
    myAccounts[i] = { ...myAccounts[i], ...sanitized };
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
    return String(name || '').replace(/[<>"]/g, '').trim().slice(0, 50);
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
      // Constant-time string equality (défense en profondeur — timing attack théorique)
      const a = String(hdata.uid || ''), b = String(_uid || '');
      let diff = a.length ^ b.length;
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
      }
      if (diff !== 0) {
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
      // Compte cette tentative comme échec (couvre le cas Firestore PERMISSION_DENIED
      // quand un user tente un code attribué à un autre uid)
      _proAttempts++;
      if (_proAttempts >= 3) { _proThrottleUntil = Date.now() + 60_000; _proAttempts = 0; }
      console.warn('[Store] activatePro error', e);
      return false;
    }
  }

  // ── IA usage ─────────────────────────────────────────────────────────────────
  function getAIUsage()      { return { ..._aiUsage }; }
  function canAnalyzeToday() {
    if (isPro()) return true;
    const today = localToday();
    if (typeof _aiUsage.date === 'string' && _aiUsage.date > today) return false;
    return _aiUsage.date !== today || _aiUsage.count < 1;
  }
  // recordAnalysis() est désormais géré exclusivement par la Cloud Function
  // (transaction atomique côté serveur, impossible à bypasser via DevTools).
  // Le client ne peut plus écrire dans aiUsage — rule Firestore bloque.
  // On garde la fonction pour rétro-compat mais elle est no-op.
  function recordAnalysis() { /* no-op — handled server-side */ }

  // Refetch aiUsage depuis Firestore (à appeler après une analyse réussie pour
  // que canAnalyzeToday() côté client reste cohérent avec l'état serveur)
  async function refreshAiUsage() {
    try {
      const snap = await userDoc('aiUsage').get();
      if (snap.exists) _aiUsage = snap.data() || _aiUsage;
    } catch {}
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

  function clearLocalCache() {
    if (!_uid || _uid === 'default') return;
    Object.values(lk()).forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
  }

  return {
    initForUser, clearLocalCache,
    getTrades, getTradeById, addTrade, updateTrade, deleteTrade, importTrades, clearTrades, exportJSON,
    getSettings, getGroqKey, updateSettings,
    getAccountTypes, getAccountByName, updateAccountTypes,
    getPropFirms, getPropFirmByKey,
    getMyAccounts, getMyAccountById, getMyAccountByName, addMyAccount, updateMyAccount, deleteMyAccount,
    getSpreads, updateSpreads, getSpreadsByFirm, getAllSpreadsByFirm, updateSpreadsByFirm,
    getGroups, getGroupById, addGroup, updateGroup, deleteGroup,
    getPlanInfo, isPro, activatePro, canAnalyzeToday, recordAnalysis, refreshAiUsage, canAddAccount,
    getStats,
  };
})();
