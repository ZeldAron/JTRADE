// ─── CALC ─────────────────────────────────────────────────────────────────────
// Calculs R:R, risk, reward, P&L brut/net pour un trade

const Calc = (() => {
  const POINT_VALUES = {
    // Futures CME
    MES1: 5, ES1: 50, MNQ1: 2, NQ1: 20,
    MYM1: 0.5, YM1: 5, M2K1: 5, RTY1: 50,
    MGC1: 10, GC1: 100, QO1: 50,
    MCL1: 100, CL1: 1000,
    ZN1: 1000,
    // CFD Indices MT4/MT5 ($ par lot par point d'index, lot size standard FTMO/FP)
    US30: 5, US100: 1, US500: 1, GER40: 1, UK100: 1,
    // Métaux CFD ($ par lot par $ de prix — XAUUSD : 100 oz/lot)
    XAUUSD: 100,
    // Forex ($ par lot par unité complète — EURUSD 100k$/lot, 1 pip=0.0001=$10/lot)
    EURUSD: 100000, GBPUSD: 100000, USDJPY: 650,
    // Énergie CFD (USOIL : 1000 barils/lot, $0.01 move = $10/lot)
    USOIL: 1000,
  };
  const TICK_SIZE = 0.25;

  const CFD_INSTRS = new Set(['US30','US100','US500','GER40','UK100','XAUUSD','EURUSD','GBPUSD','USDJPY','USOIL']);
  function isCFD(instrument) { return CFD_INSTRS.has(instrument); }

  // Règles Apex par taille de compte (EOD)
  const ACCOUNT_RULES = {
    25000:  { drawdown: 1250, safetyNet: 1350 },
    50000:  { drawdown: 2000, safetyNet: 2100 },
    100000: { drawdown: 3000, safetyNet: 3100 },
    150000: { drawdown: 4500, safetyNet: 4600 },
  };

  function pointValue(instrument) {
    return POINT_VALUES[instrument] || 5;
  }

  function trade(t) {
    const pv     = pointValue(t.instrument);
    const isLong = t.direction === 'long';

    const riskPts   = isLong ? t.entry - t.sl  : t.sl  - t.entry;
    const rewardPts = isLong ? t.tp1  - t.entry : t.entry - t.tp1;
    const rr        = riskPts > 0 ? rewardPts / riskPts : 0;

    const riskUSD   = riskPts   * pv * t.contracts;
    const rewardUSD = rewardPts * pv * t.contracts;
    const riskPct   = t.capital > 0 ? (riskUSD / t.capital) * 100 : 0;

    const riskTicks   = isCFD(t.instrument) ? 0 : Math.round(riskPts   / TICK_SIZE);
    const rewardTicks = isCFD(t.instrument) ? 0 : Math.round(rewardPts / TICK_SIZE);

    // Commissions aller-retour (entry + exit)
    const feePerSide = t.feePerSide != null ? t.feePerSide : 2.14;
    const commFees   = feePerSide * t.contracts * 2;

    // Spread bid/ask à l'entrée
    const spreadPerContract = t.spreadCost != null ? t.spreadCost : 0;
    const spreadFees        = spreadPerContract * t.contracts;

    const totalFees = commFees + spreadFees;

    // Reward net prévu (pour la planification avant clôture)
    const netRewardUSD = rewardUSD - totalFees;

    // P&L : exitPrice explicite > outcome estimé > TP1 potentiel pour open
    let pnl    = null;
    let netPnl = null;
    let estimated = false;
    const resolvedExit = t.exitPrice != null ? t.exitPrice
      : t.outcome === 'win'  ? t.tp1
      : t.outcome === 'loss' ? t.sl
      : t.outcome === 'be'   ? t.entry
      : t.tp1;   // open : P&L potentiel si TP atteint
    if (resolvedExit != null && resolvedExit !== undefined) {
      const pts = isLong ? resolvedExit - t.entry : t.entry - resolvedExit;
      pnl      = pts * pv * t.contracts;
      netPnl   = pnl - totalFees;
      estimated = t.exitPrice == null;
    }

    return {
      riskPts, rewardPts,
      rr, riskUSD, rewardUSD, netRewardUSD, riskPct,
      riskTicks, rewardTicks,
      pv, feePerSide, commFees, spreadFees, totalFees,
      pnl, netPnl, estimated,
      apexOk:   riskPct <= 2.0,
      apexWarn: riskPct > 1.5 && riskPct <= 2.0,
    };
  }

  // Live preview depuis le formulaire
  function fromForm(direction, entry, sl, tp1, instrument, contracts, capital, feePerSide = 2.14, spreadCost = 0, exitPrice = null) {
    return trade({
      direction, entry, sl, tp1,
      instrument, contracts, capital,
      feePerSide, spreadCost,
      exitPrice,
    });
  }

  function rrColor(rr) {
    if (rr >= 2) return 'var(--green)';
    if (rr >= 1) return 'var(--amber)';
    return 'var(--red)';
  }

  function rrLabel(rr) {
    if (rr >= 2)   return 'Excellent';
    if (rr >= 1.5) return 'Bon';
    if (rr >= 1)   return 'Limite';
    return 'Insuffisant';
  }

  function riskColor(pct) {
    if (pct <= 1.5) return 'var(--green)';
    if (pct <= 2)   return 'var(--amber)';
    return 'var(--red)';
  }

  function pnlColor(pnl) {
    return pnl >= 0 ? 'var(--green)' : 'var(--red)';
  }

  function formatPnL(pnl) {
    return (pnl >= 0 ? '+' : '-') + '$' + Math.abs(pnl).toFixed(0);
  }

  // Calcul du plancher trailing (EOD) pour un compte funded
  // Le plancher = max des soldes EOD - drawdown, jamais < solde initial - drawdown
  // Une fois le Safety Net atteint, le plancher ne peut plus passer sous le solde initial
  function trailingFloor(acc, accTrades) {
    const startBalance = acc.capital || 50000;
    const rules        = ACCOUNT_RULES[startBalance] || {};
    const drawdown     = acc.maxDrawdown || rules.drawdown || 2000;
    const safetyNet    = rules.safetyNet || (drawdown + 100);

    // Cumul P&L par jour (trades fermés uniquement)
    const byDay = {};
    accTrades.forEach(t => {
      const c = trade(t);
      if (c.estimated) return;
      const d = (t.date || '').split('T')[0];
      if (!d) return;
      byDay[d] = (byDay[d] || 0) + (c.netPnl || 0);
    });

    const pnlOffset = acc.pnlOffset || 0;
    const days = Object.keys(byDay).sort();
    let cumPnL = pnlOffset;
    let hwm    = startBalance + Math.max(0, pnlOffset); // HWM déjà relevé si offset positif

    days.forEach(d => {
      cumPnL += byDay[d];
      const eod = startBalance + cumPnL;
      if (eod > hwm) hwm = eod;
    });

    const currentBalance = startBalance + cumPnL;
    const profit         = Math.max(0, cumPnL);
    const safetyReached  = profit >= safetyNet;

    // Plancher trailing : jamais sous le plancher initial
    let floor = Math.max(hwm - drawdown, startBalance - drawdown);
    // Safety Net atteint → plancher bloqué au solde initial
    if (safetyReached) floor = Math.max(floor, startBalance);

    const distanceToFloor = currentBalance - floor;
    const drawdownConsumed = drawdown - distanceToFloor;

    return {
      startBalance,
      currentBalance,
      hwm,
      floor,
      drawdown,
      safetyNet,
      safetyReached,
      distanceToFloor,
      drawdownConsumed: Math.max(0, drawdownConsumed),
      drawdownUsedPct: drawdown > 0
        ? Math.max(0, Math.min(100, (Math.max(0, drawdownConsumed) / drawdown) * 100))
        : 0,
      profit,
      byDay,
    };
  }

  return {
    trade, fromForm, trailingFloor,
    rrColor, rrLabel, riskColor, pnlColor, formatPnL,
    pointValue, isCFD, ACCOUNT_RULES,
  };
})();
