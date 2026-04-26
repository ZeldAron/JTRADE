// ─── GOALS & REWARDS ──────────────────────────────────────────────────────────
(function () {
  const $ = id => document.getElementById(id);

  function goalBar(label, current, max, color) {
    const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
    const col = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : color;
    return `<div class="goal-progress">
      <div class="gp-header">
        <span class="gp-label">${label}</span>
        <span class="gp-value" style="color:${col}">$${current.toFixed(0)} / $${max}</span>
      </div>
      <div class="gp-track"><div class="gp-fill" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }

  function goalRuleRow(label, value, state) {
    const cls = state === 'ok' ? 'grr-ok' : state === 'warn' ? 'grr-warn' : 'grr-pending';
    return `<div class="goal-rule-row">
      <span class="grr-label">${label}</span>
      <span class="grr-val ${cls}">${value}</span>
    </div>`;
  }

  function evalCard(acc, accTrades, today) {
    const s      = UI.statsForTrades(accTrades);
    const ddUsed = Math.abs(Math.min(0, s.totalPnL));
    const profit = Math.max(0, s.totalPnL);

    const todayLoss = accTrades
      .filter(t => t.date.startsWith(today) && t.outcome === 'loss')
      .reduce((sum, t) => sum + Math.abs(Calc.trade(t).netPnl || 0), 0);

    const days   = new Set(accTrades.map(t => UI.localDay(t.date))).size;
    const minDays = 5;

    const byDay = {};
    accTrades.forEach(t => {
      const d = UI.localDay(t.date);
      byDay[d] = (byDay[d] || 0) + (Calc.trade(t).netPnl || 0);
    });
    const bestDay = Math.max(0, ...Object.values(byDay), 0);
    const maxDay  = profit > 0 ? profit * 0.30 : 0;
    const consOk  = maxDay === 0 || bestDay <= maxDay;

    const ddOk      = !acc.maxDrawdown    || ddUsed   <  acc.maxDrawdown;
    const dailyOk   = !acc.dailyLossLimit || todayLoss < acc.dailyLossLimit;
    const targetMet = acc.profitTarget    && profit   >= acc.profitTarget;
    const daysOk    = days >= minDays;
    const allOk     = targetMet && ddOk && dailyOk && daysOk && consOk;

    const statusHtml = allOk
      ? `<div class="goal-status goal-status--pass">🏆 Objectif atteint — Prêt à passer en compte Funded !</div>`
      : targetMet
        ? `<div class="goal-status goal-status--almost">✓ Profit atteint — vérifier les autres règles</div>`
        : `<div class="goal-status goal-status--eval">En cours d'évaluation</div>`;

    return `<div class="goal-card">
      <div class="goal-card-header">
        <div><span class="goal-badge goal-badge--eval">EVAL</span><span class="goal-card-name">${UI.escHtml(acc.name)}</span></div>
        <span class="goal-pnl" style="color:${s.totalPnL>=0?'var(--green)':'var(--red)'}">${s.totalPnL>=0?'+':'-'}$${Math.abs(s.totalPnL).toFixed(0)}</span>
      </div>
      <div class="goal-rules">
        ${acc.profitTarget   ? goalBar('Objectif de profit',   profit,    acc.profitTarget,   'var(--green)') : ''}
        ${acc.maxDrawdown    ? goalBar('Drawdown max utilisé', ddUsed,    acc.maxDrawdown,    'var(--amber)') : ''}
        ${acc.dailyLossLimit ? goalBar('Perte du jour',        todayLoss, acc.dailyLossLimit, 'var(--red)')   : ''}
      </div>
      <div class="goal-rules">
        ${goalRuleRow('Jours tradés minimum', `${days} / ${minDays} jours`, daysOk ? 'ok' : 'pending')}
        ${maxDay > 0 ? goalRuleRow('Consistance (max 30%/jour)', `+$${bestDay.toFixed(0)} meilleur jour`, consOk ? 'ok' : 'warn') : ''}
        ${goalRuleRow('Drawdown respecté',    ddOk    ? '✓ OK' : `✗ Dépassé (-$${ddUsed.toFixed(0)})`,     ddOk    ? 'ok' : 'warn')}
        ${goalRuleRow('Loss limit respectée', dailyOk ? '✓ OK' : `✗ Dépassée ($${todayLoss.toFixed(0)})`,  dailyOk ? 'ok' : 'warn')}
      </div>
      ${statusHtml}
    </div>`;
  }

  function fundedCard(acc, accTrades, today) {
    const s  = UI.statsForTrades(accTrades);
    const fl = Calc.trailingFloor(acc, accTrades);

    const { startBalance, currentBalance, hwm, floor, drawdown,
            safetyNet, safetyReached, distanceToFloor, drawdownUsedPct, profit } = fl;

    const safetyLeft = Math.max(0, safetyNet - profit);

    const floorColor = distanceToFloor <= drawdown * 0.25 ? 'var(--red)'
                     : distanceToFloor <= drawdown * 0.5  ? 'var(--amber)'
                     : 'var(--green)';

    const dayValues    = Object.values(fl.byDay);
    const bestDay      = Math.max(0, ...dayValues, 0);
    const consistScore = profit > 0 ? (bestDay / profit) * 100 : 0;
    const consistOk    = profit <= 0 || consistScore <= 50;
    const consistBarW  = Math.min(100, consistScore * 2);
    const consistCol   = consistScore > 50 ? 'var(--red)' : consistScore > 40 ? 'var(--amber)' : 'var(--green)';
    const consistBar   = profit > 0
      ? `<div class="goal-progress">
           <div class="gp-header">
             <span class="gp-label">Meilleur jour / Profit total (limite 50%)</span>
             <span class="gp-value" style="color:${consistCol}">${consistScore.toFixed(0)}% ${consistOk ? '✓' : '✗'}</span>
           </div>
           <div class="gp-track" style="position:relative">
             <div class="gp-fill" style="width:${consistBarW}%;background:${consistCol}"></div>
             <div style="position:absolute;top:0;left:50%;width:1px;height:100%;background:rgba(255,255,255,0.2)"></div>
           </div>
           <div style="font-size:10px;color:var(--muted);margin-top:4px">Meilleur jour : +$${bestDay.toFixed(0)} · Profit total : +$${profit.toFixed(0)}</div>
         </div>`
      : `<div style="font-size:11px;color:var(--muted);padding:6px 0">Pas encore de données de profit</div>`;

    const month       = today.slice(0, 7);
    const monthTrades = accTrades.filter(t => t.date.startsWith(month));
    const monthStats  = UI.statsForTrades(monthTrades);
    const monthDays   = new Set(monthTrades.map(t => UI.localDay(t.date))).size;
    const monthlyGoal = acc.profitTarget ? Math.round(acc.profitTarget * 0.5) : 0;

    const todayLoss = accTrades
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => {
        const c = Calc.trade(t);
        return c.netPnl < 0 ? sum + Math.abs(c.netPnl) : sum;
      }, 0);

    const totalDays   = new Set(accTrades.map(t => UI.localDay(t.date))).size;
    const payoutReady = totalDays >= 5 && profit > 0 && safetyReached;
    const dailyOk     = !acc.dailyLossLimit || todayLoss < acc.dailyLossLimit;

    const ddBarW   = Math.min(100, drawdownUsedPct);
    const ddBarCol = drawdownUsedPct >= 75 ? 'var(--red)' : drawdownUsedPct >= 50 ? 'var(--amber)' : 'var(--green)';

    return `<div class="goal-card">
      <div class="goal-card-header">
        <div><span class="goal-badge goal-badge--funded">PA</span><span class="goal-card-name">${UI.escHtml(acc.name)}</span></div>
        <span class="goal-pnl" style="color:${s.totalPnL>=0?'var(--green)':'var(--red)'}">${s.totalPnL>=0?'+':'-'}$${Math.abs(s.totalPnL).toFixed(0)}</span>
      </div>

      <div class="floor-panel ${safetyReached ? 'floor-panel--safe' : ''}">
        <div class="floor-panel-top">
          <div class="floor-main">
            <span class="floor-label">Plancher actuel</span>
            <span class="floor-value" style="color:${floorColor}">$${floor.toLocaleString('fr-FR')}</span>
          </div>
          <div class="floor-balance">
            <span class="floor-label">Solde EOD max atteint</span>
            <span class="floor-hwm">$${hwm.toLocaleString('fr-FR')}</span>
          </div>
        </div>
        <div class="floor-margin-row">
          <span style="font-size:11px;color:var(--muted)">Marge restante avant plancher</span>
          <span style="font-size:13px;font-weight:700;color:${floorColor}">$${Math.max(0, distanceToFloor).toLocaleString('fr-FR')}</span>
        </div>
        <div class="gp-track" style="margin-top:6px;position:relative">
          <div class="gp-fill" style="width:${ddBarW}%;background:${ddBarCol}"></div>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px;display:flex;justify-content:space-between">
          <span>Drawdown utilisé : $${Math.max(0, fl.drawdownConsumed).toFixed(0)} / $${drawdown}</span>
          <span>Capital initial : $${startBalance.toLocaleString('fr-FR')}</span>
        </div>
        ${safetyReached
          ? `<div class="floor-safe-badge">🛡 Safety Net atteint — plancher verrouillé à $${startBalance.toLocaleString('fr-FR')}</div>`
          : `<div style="font-size:10px;color:var(--muted);margin-top:6px">🔄 Mis à jour chaque soir à l'EOD · Safety Net dans <strong style="color:var(--text)">$${safetyLeft.toFixed(0)}</strong></div>`
        }
      </div>

      <div class="goal-section-label">🛡 Priorité #1 — Safety Net ($${safetyNet.toLocaleString('fr-FR')})</div>
      <div class="goal-rules">
        ${goalBar('Progression vers le Safety Net', profit, safetyNet, 'var(--green)')}
      </div>
      ${safetyReached
        ? `<div class="goal-status goal-status--pass" style="margin-bottom:16px">🛡 Safety Net atteint — capital de départ protégé !</div>`
        : `<div class="goal-info-row">Il reste <strong>$${safetyLeft.toFixed(0)}</strong> à gagner pour verrouiller le plancher à $${startBalance.toLocaleString('fr-FR')}</div>`
      }

      <div class="goal-section-label">📊 Score de consistance (funded uniquement)</div>
      <div class="goal-rules">${consistBar}</div>
      <div class="goal-rules">
        ${goalRuleRow('Règle 50%', consistOk ? `✓ Conforme (${consistScore.toFixed(0)}%)` : `✗ Violation — meilleur jour trop élevé (${consistScore.toFixed(0)}%)`, consistOk ? 'ok' : 'warn')}
      </div>

      <div class="goal-section-label">📅 Ce mois — ${month}</div>
      <div class="goal-rules">
        ${monthlyGoal ? goalBar('Objectif mensuel (50% du target)', Math.max(0, monthStats.totalPnL), monthlyGoal, 'var(--green)') : ''}
        ${acc.dailyLossLimit ? goalBar('Perte du jour', todayLoss, acc.dailyLossLimit, 'var(--red)') : ''}
      </div>
      <div class="goal-rules">
        ${goalRuleRow('Jours tradés ce mois', `${monthDays} jour${monthDays>1?'s':''}`, monthDays > 0 ? 'ok' : 'pending')}
        ${goalRuleRow('P&L du mois', monthStats.totalPnL >= 0 ? `+$${monthStats.totalPnL.toFixed(0)}` : `-$${Math.abs(monthStats.totalPnL).toFixed(0)}`, monthStats.totalPnL >= 0 ? 'ok' : 'warn')}
      </div>

      <div class="goal-section-label">🔒 Protection & Retrait</div>
      <div class="goal-rules">
        ${goalRuleRow('Loss limit du jour', dailyOk ? '✓ OK' : '✗ Limite atteinte', dailyOk ? 'ok' : 'warn')}
        ${goalRuleRow('Payout', payoutReady ? '✓ Éligible' : `${totalDays}/5 jours · Safety Net ${safetyReached ? '✓' : '✗'}`, payoutReady ? 'ok' : 'pending')}
      </div>
      ${payoutReady ? `<div class="goal-status goal-status--pass">💰 Éligible au retrait — contacte Apex !</div>` : ''}
    </div>`;
  }

  function achievementsCard(trades) {
    const closed = trades.filter(t => t.outcome === 'win' || t.outcome === 'loss');
    const s      = UI.statsForTrades(trades);

    let maxConsec = 0, consec = 0;
    [...trades].reverse().forEach(t => {
      if (t.outcome === 'win')       { consec++; maxConsec = Math.max(maxConsec, consec); }
      else if (t.outcome === 'loss') { consec = 0; }
    });

    const badges = [
      { icon:'🎯', label:'Premier trade',        desc:'Loguer son premier trade',               done: trades.length >= 1 },
      { icon:'📊', label:'5 trades',             desc:'Loguer 5 trades',                        done: trades.length >= 5 },
      { icon:'📈', label:'10 trades',            desc:'Loguer 10 trades',                       done: trades.length >= 10 },
      { icon:'💰', label:'Rentable',             desc:'P&L total positif',                      done: s.totalPnL > 0 },
      { icon:'⚡', label:'R:R solide',           desc:'R:R moyen ≥ 1.5',                       done: s.avgRR >= 1.5 },
      { icon:'🚀', label:'R:R excellent',        desc:'R:R moyen ≥ 2.0',                       done: s.avgRR >= 2.0 },
      { icon:'🎖', label:'Win Rate 60%',         desc:'60%+ sur 10 trades min.',               done: closed.length >= 10 && (s.winRate || 0) >= 60 },
      { icon:'🏅', label:'Win Rate 70%',         desc:'70%+ sur 10 trades min.',               done: closed.length >= 10 && (s.winRate || 0) >= 70 },
      { icon:'🔥', label:'3 wins consécutifs',   desc:'3 trades gagnants d\'affilée',           done: maxConsec >= 3 },
      { icon:'💥', label:'5 wins consécutifs',   desc:'5 trades gagnants d\'affilée',           done: maxConsec >= 5 },
      { icon:'🛡', label:'Discipliné',           desc:'Chaque trade a un setup noté',           done: trades.length >= 5 && trades.every(t => t.setup && t.setup.trim()) },
      { icon:'📅', label:'Semaine complète',     desc:'5 jours tradés en une semaine',          done: (() => { const days = new Set(trades.map(t => UI.localDay(t.date))); return days.size >= 5; })() },
    ];

    const done = badges.filter(b => b.done).length;
    return `<div class="goal-card">
      <div class="goal-card-header" style="margin-bottom:18px">
        <span style="font-size:14px;font-weight:700">🏆 Récompenses</span>
        <span style="font-size:12px;color:var(--muted)">${done} / ${badges.length} obtenus</span>
      </div>
      <div class="achievements-grid">
        ${badges.map(b => `
          <div class="achievement-badge ${b.done ? 'ach-done' : 'ach-locked'}">
            <div class="ach-icon">${b.icon}</div>
            <div class="ach-label">${b.label}</div>
            <div class="ach-desc">${b.desc}</div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  UI.renderGoals = function () {
    const el     = $('goalsContent');
    const accs   = Store.getMyAccounts();
    const trades = Store.getTrades();
    const today  = new Date().toISOString().split('T')[0];

    if (!accs.length) {
      el.innerHTML = `<div class="page-title">Objectifs & Récompenses</div>
        <div class="goal-card" style="text-align:center;padding:48px 24px">
          <div style="font-size:32px;margin-bottom:12px">🎯</div>
          <p style="color:var(--muted);margin-bottom:4px">Aucun compte configuré.</p>
          <p style="font-size:12px;color:var(--muted2)">Crée tes comptes dans <strong style="color:var(--text)">Réglages → Mes Comptes</strong>.</p>
        </div>`;
      return;
    }

    const evalAccs   = accs.filter(a => a.status !== 'funded');
    const fundedAccs = accs.filter(a => a.status === 'funded');

    let html = '<div class="page-title">Objectifs & Récompenses</div>';

    if (evalAccs.length) {
      html += `<div class="goal-section-title">Comptes en Évaluation</div>`;
      evalAccs.forEach(acc => {
        html += evalCard(acc, trades.filter(t => t.apex === acc.name), today);
      });
    }

    if (fundedAccs.length) {
      html += `<div class="goal-section-title">Comptes Funded (PA)</div>`;
      fundedAccs.forEach(acc => {
        html += fundedCard(acc, trades.filter(t => t.apex === acc.name), today);
      });
    }

    html += achievementsCard(trades);
    el.innerHTML = html;
  };
})();
