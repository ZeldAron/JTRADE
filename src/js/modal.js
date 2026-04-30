// ─── MODAL / WIZARD ───────────────────────────────────────────────────────────
// Wizard 3 étapes : Direction → Screenshot (IA) → Détails + calcul

const Modal = (() => {
  let editingId     = null;
  let onSaved       = null;
  let direction     = null;    // 'long' | 'short'
  let capturedImage = null;    // base64
  let parsedTrade   = null;    // { entry, sl, tp1, tp2, tp3, instrument }
  let capital       = 50000;
  let feePerSide    = 2.14;
  let spreadCost    = 0;
  let firmKey       = 'apex';

  function getSpreadForInstrument(fk, instr) {
    const sp = Store.getSpreadsByFirm(fk || 'apex');
    return sp[instr] != null ? sp[instr] : 0;
  }

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const STATUS_LABEL = { evaluation: 'EVAL', funded: 'PA' };

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goToStep(n) {
    [1, 2, 3].forEach(i => {
      $('wp' + i).style.display = i === n ? '' : 'none';
      const dot = $('wdot' + i);
      dot.className = 'wdot' + (i < n ? ' done' : i === n ? ' active' : '');
    });
    if ($('wline12')) $('wline12').className = 'wdot-line' + (n > 1 ? ' done' : '');
    if ($('wline23')) $('wline23').className = 'wdot-line' + (n > 2 ? ' done' : '');
  }

  // ── Étape 1 : Direction ──────────────────────────────────────────────────────
  function setDirection(d) {
    direction = d;
    $('wBtnLong').className  = 'dir-btn' + (d === 'long'  ? ' active-long'  : '');
    $('wBtnShort').className = 'dir-btn' + (d === 'short' ? ' active-short' : '');
    const badge = $('wDirBadge');
    badge.textContent      = d === 'long' ? 'LONG' : 'SHORT';
    badge.style.color      = d === 'long' ? 'var(--green)' : 'var(--red)';
    badge.style.background = d === 'long' ? 'var(--green-dim)' : 'var(--red-dim)';
    goToStep(2);
    const groqBadge = $('groqStatusBadge');
    if (groqBadge) {
      groqBadge.textContent = i18n.t('modal.groq.active');
      groqBadge.style.color = 'var(--green)';
    }
    setTimeout(() => $('wDropZone').focus?.(), 150);
  }

  // ── Étape 2 : Image ─────────────────────────────────────────────────────────

  function loadImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target.result.split(',')[1];
      capturedImage = b64;
      $('wPreviewImg').src             = 'data:image/png;base64,' + b64;
      $('wDropPrompt').style.display   = 'none';
      $('wImagePreview').style.display = '';
      $('wDropZone').classList.add('has-image');
      analyzeImage();
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    capturedImage = null;
    parsedTrade   = null;
    $('wDropZone').classList.remove('has-image');
    $('wDropPrompt').style.display   = '';
    $('wImagePreview').style.display = 'none';
    $('wPreviewImg').src             = '';
    $('wAnalysisStatus').style.display = 'none';
    $('wAnalysisResult').style.display = 'none';
  }

  function parseTextHint(text) {
    const t = text.toLowerCase();
    const r = { entry: null, sl: null, tp1: null, tp2: null, tp3: null, contracts: 1 };
    const findNum = (keys) => {
      for (const k of keys) {
        const m = t.match(new RegExp(k + '[\\s:=]+([\\d.]+)', 'i'));
        if (m) return parseFloat(m[1]);
      }
      return null;
    };
    r.entry     = findNum(['entry', 'entrée', 'entree', 'e']);
    r.sl        = findNum(['sl', 'stop']);
    r.tp1       = findNum(['tp1', 'tp', 'target', 'profit']);
    r.tp2       = findNum(['tp2']);
    r.tp3       = findNum(['tp3']);
    const lotsM = t.match(/(\d+)\s*(lots?|contrats?)/i);
    if (lotsM) r.contracts = parseInt(lotsM[1]);
    return (r.entry || r.sl || r.tp1) ? r : null;
  }

  // ── Groq Vision API ──────────────────────────────────────────────────────────
  async function analyzeWithGroq(imageB64, apiKey) {
    const prompt =
      `Look at this TradingView screenshot. Read these 3 values exactly:\n` +
      `- "Prix d'entrée" row value → entry\n` +
      `- "Prix" row inside "NIVEAU DE PROFIT" → tp1\n` +
      `- "Prix" row inside "NIVEAU DU STOP" → sl\n` +
      `Respond with ONLY this JSON on a single line, no other text:\n` +
      `{"entry":7172.50,"sl":7150.50,"tp1":7194.50}\n` +
      `Replace those numbers with the actual values from the image.`;

    const GROQ_MODELS = [
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
    ];

    for (const model of GROQ_MODELS) {
      let res;
      try {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body:    JSON.stringify({
            model,
            temperature: 0,
            max_tokens:  120,
            messages: [{
              role:    'user',
              content: [
                { type: 'text',      text: prompt },
                { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
              ],
            }],
          }),
          signal: AbortSignal.timeout(30000),
        });
      } catch { continue; }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || '';
        if (res.status === 401) throw new Error(i18n.t('modal.groq.invalid'));
        if (msg.includes('not found') || msg.includes('decommissioned')) continue;
        throw new Error('Groq : ' + msg);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';

      // Parsing robuste : JSON dans markdown ou brut
      const jsonStr = (text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || [])[1]
                   || (text.match(/(\{[\s\S]*?\})/) || [])[1]
                   || '';
      if (!jsonStr) {
        // Fallback : extraire les nombres directement du texte
        const nums = [...text.matchAll(/\b(\d{4,6}(?:\.\d+)?)\b/g)].map(m => parseFloat(m[1]));
        if (nums.length >= 3) {
          nums.sort((a, b) => a - b);
          return {
            sl:    nums[0],
            entry: nums[Math.floor(nums.length / 2)],
            tp1:   nums[nums.length - 1],
          };
        }
        continue;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.entry || parsed.sl || parsed.tp1) return parsed;
      } catch { continue; }
    }

    throw new Error(i18n.t('modal.groq.nomodel'));
  }

  async function analyzeImage() {
    if (!capturedImage) return;

    const statusEl = $('wAnalysisStatus');
    const retryBtn = $('wBtnRetry');
    const groqKey  = Store.getGroqKey();
    const textHint = ($('wTextHint').value || '').trim();

    statusEl.style.display  = 'block';
    statusEl.innerHTML      = `<span style="color:var(--muted)">${i18n.t('modal.groq.analyzing')}</span>`;
    $('wBtnNext2').disabled = true;
    $('wAnalysisResult').style.display = 'none';
    retryBtn.style.display  = 'none';

    try {

      if (!Store.canAnalyzeToday()) {
        statusEl.innerHTML = `<span style="color:var(--red)">${i18n.t('err.limit.ai')}</span>
          <span style="color:var(--muted)"> <a href="#" id="goOffersLink" style="color:var(--accent)">${i18n.t('err.limit.ai.cta')}</a></span>`;
        const lk = document.getElementById('goOffersLink');
        if (lk) lk.addEventListener('click', e => {
          e.preventDefault();
          Modal.close();
          document.querySelector('[data-page="offers"]').click();
        });
        $('wBtnNext2').disabled = false;
        retryBtn.style.display = 'none';
        return;
      }

      Store.recordAnalysis();
      const result = await analyzeWithGroq(capturedImage, groqKey);
      let { entry, sl, tp1 } = result;
      entry = entry || null; sl = sl || null; tp1 = tp1 || null;

      // Complète avec le hint texte si valeurs manquantes
      if (textHint) {
        const hint = parseTextHint(textHint);
        if (hint) {
          if (!entry && hint.entry) entry = hint.entry;
          if (!sl    && hint.sl)    sl    = hint.sl;
          if (!tp1   && hint.tp1)   tp1   = hint.tp1;
        }
      }

      if (!entry && !sl && !tp1) {
        const hint = parseTextHint(textHint);
        if (hint) {
          parsedTrade = hint;
          statusEl.innerHTML = `<span style="color:var(--amber)">${i18n.t('modal.img.unreadable')}</span>`;
        } else {
          throw new Error(i18n.t('modal.groq.notfound'));
        }
      } else {
        parsedTrade = { entry, sl, tp1, tp2: null, tp3: null, instrument: null, contracts: 1 };
        // Swap si incohérent avec la direction
        if (parsedTrade.entry && parsedTrade.sl && parsedTrade.tp1) {
          if (direction === 'long'  && parsedTrade.sl > parsedTrade.entry)
            [parsedTrade.sl, parsedTrade.tp1] = [parsedTrade.tp1, parsedTrade.sl];
          if (direction === 'short' && parsedTrade.sl < parsedTrade.entry)
            [parsedTrade.sl, parsedTrade.tp1] = [parsedTrade.tp1, parsedTrade.sl];
        }
        const missing = (!entry || !sl || !tp1) ? ` <span style="color:var(--amber)">${i18n.t('modal.complete.step3')}</span>` : '';
        statusEl.innerHTML = `<span style="color:var(--green)">${i18n.t('modal.levels.detected')}</span>${missing} <span style="color:var(--muted);font-size:10px">via Groq</span>`;
      }

      const f = v => { const n = Number(v); return (v !== null && !isNaN(n) && n !== 0) ? `<b>${n}</b>` : '<span style="color:var(--red)">✗</span>'; };
      $('wAnalysisResult').innerHTML =
        `<div class="wpill"><span>Entry</span>${f(parsedTrade.entry)}</div>` +
        `<div class="wpill wpill-sl"><span>SL</span>${f(parsedTrade.sl)}</div>` +
        `<div class="wpill wpill-tp"><span>TP1</span>${f(parsedTrade.tp1)}</div>` +
        (parsedTrade.tp2 ? `<div class="wpill wpill-tp"><span>TP2</span><b>${Number(parsedTrade.tp2)}</b></div>` : '') +
        (parsedTrade.tp3 ? `<div class="wpill wpill-tp"><span>TP3</span><b>${Number(parsedTrade.tp3)}</b></div>` : '') +
        (parsedTrade.contracts > 1 ? `<div class="wpill"><span>Lots</span><b>${parseInt(parsedTrade.contracts, 10)}</b></div>` : '');
      $('wAnalysisResult').style.display = 'flex';
      $('wBtnNext2').disabled = false;
      retryBtn.style.display  = 'inline-flex';

    } catch (e) {
      statusEl.innerHTML = '';
      const _errSpan = document.createElement('span');
      _errSpan.style.color = 'var(--red)';
      _errSpan.textContent = '✗ ' + (e.message || i18n.t('modal.unknown.error'));
      statusEl.appendChild(_errSpan);
      $('wBtnNext2').disabled = false;
      retryBtn.style.display  = 'inline-flex';
    }
  }

  // ── Étape 3 : Calcul ────────────────────────────────────────────────────────
  function populateApexSelect(currentVal) {
    const accounts = Store.getMyAccounts();
    const grps     = Store.getGroups();
    const sel      = $('wApex');

    let html = `<option value="">${i18n.t('modal.account.ph')}</option>`;
    if (accounts.length) {
      html += accounts.map(a => {
        const badge = STATUS_LABEL[a.status] || '?';
        return `<option value="${esc(a.name)}"${a.name === currentVal ? ' selected' : ''}>[${badge}] ${esc(a.name)}</option>`;
      }).join('');
    }
    if (grps.length) {
      html += '<optgroup label="── Groupes ──">';
      html += grps.map(g => {
        const val = 'grp:' + g.id;
        return `<option value="${esc(val)}"${val === currentVal ? ' selected' : ''}>⬡ ${esc(g.name)}</option>`;
      }).join('');
      html += '</optgroup>';
    }
    if (!accounts.length && !grps.length)
      html += `<option value="" disabled>${i18n.t('modal.configure.settings')}</option>`;
    sel.innerHTML = html;
    sel.value = currentVal || '';
  }

  function fillStep3FromParsed() {
    if (!parsedTrade) return;
    const instr = parsedTrade.instrument;
    if (instr && ['MES1','ES1','MNQ1','NQ1'].includes(instr)) $('wInstr').value = instr;
    if (parsedTrade.contracts > 1) $('wContracts').value = parseInt(parsedTrade.contracts);
    $('wEntry').value = parsedTrade.entry || '';
    $('wSL').value    = parsedTrade.sl    || '';
    $('wTP1').value   = parsedTrade.tp1   || '';
    $('wTP2').value   = parsedTrade.tp2   || '';
    $('wTP3').value   = parsedTrade.tp3   || '';
    spreadCost = getSpreadForInstrument(firmKey, $('wInstr').value);
    wRecalc();
  }

  function wRecalc() {
    const entry      = parseFloat($('wEntry').value);
    const sl         = parseFloat($('wSL').value);
    const tp1        = parseFloat($('wTP1').value);
    const contracts  = parseInt($('wContracts').value) || 1;
    const instrument = $('wInstr').value;
    const lc         = $('wLiveCalc');

    if (!entry || !sl || !tp1) { lc.style.display = 'none'; return; }
    lc.style.display = 'flex';

    const c = Calc.fromForm(direction, entry, sl, tp1, instrument, contracts, capital, feePerSide, spreadCost);

    const rrEl = $('lcRR');
    rrEl.textContent = c.rr.toFixed(2) + 'R';
    rrEl.style.color = Calc.rrColor(c.rr);

    $('lcRisk').textContent   = '-$' + c.riskUSD.toFixed(0);
    $('lcReward').textContent = '+$' + c.rewardUSD.toFixed(0);

    const rpcEl = $('lcRiskPct');
    rpcEl.textContent = c.riskPct.toFixed(2) + '%';
    rpcEl.style.color = Calc.riskColor(c.riskPct);

    $('lcFees').textContent = '-$' + c.totalFees.toFixed(2);

    const netEl = $('lcNet');
    netEl.textContent = (c.netRewardUSD >= 0 ? '+' : '-') + '$' + Math.abs(c.netRewardUSD).toFixed(0);
    netEl.style.color = c.netRewardUSD >= 0 ? 'var(--green)' : 'var(--red)';

    const warnEl  = $('lcApexWarn');
    const account = Store.getMyAccountByName($('wApex').value);
    if (account) {
      warnEl.textContent   = i18n.t('modal.warn.daily', { name: account.name });
      warnEl.style.display = c.riskUSD > account.dailyLossLimit ? 'inline' : 'none';
    } else {
      warnEl.textContent   = i18n.t('modal.warn.apex');
      warnEl.style.display = c.riskPct > 2 ? 'inline' : 'none';
    }
  }

  // ── Open / Close ────────────────────────────────────────────────────────────
  function open(id = null, savedCallback = null) {
    editingId = id;
    onSaved   = savedCallback;

    // Reset
    capturedImage = null;
    parsedTrade   = null;
    capital       = Store.getSettings().capital || 50000;
    feePerSide    = 2.14;
    spreadCost    = 0;
    firmKey       = 'apex';

    clearImage();
    $('wOptFields').style.display  = 'none';
    $('wOptToggle').textContent    = i18n.t('wiz.setup');
    $('wExitField').style.display  = 'none';
    $('wOutcome').value            = 'open';
    $('wSetup').value              = '';
    $('wNotes').value              = '';
    $('wExit').value               = '';
    $('wContracts').value          = Store.getSettings().contracts || 1;
    // Date + heure par défaut = maintenant (heure locale)
    const nowLocal = new Date();
    $('wTradeDate').value = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,'0')}-${String(nowLocal.getDate()).padStart(2,'0')}`;
    $('wTradeTime').value = `${String(nowLocal.getHours()).padStart(2,'0')}:${String(nowLocal.getMinutes()).padStart(2,'0')}`;

    if (id) {
      // Mode édition : remplir depuis le trade existant et aller à l'étape 3
      const t = Store.getTradeById(id);
      if (!t) { close(); return; }
      direction    = t.direction;
      parsedTrade  = { entry: t.entry, sl: t.sl, tp1: t.tp1, tp2: t.tp2, tp3: t.tp3, instrument: t.instrument };
      capital      = t.capital || capital;
      feePerSide   = t.feePerSide || 2.14;
      spreadCost   = t.spreadCost != null ? t.spreadCost : (Store.getSpreads()[t.instrument] || 0);

      $('wContracts').value  = t.contracts;
      $('wSetup').value      = t.setup  || '';
      $('wNotes').value      = t.notes  || '';
      $('wOutcome').value    = t.outcome;
      $('wExit').value       = t.exitPrice || '';
      // Pré-remplir la date + heure depuis le trade existant
      const td = t.date ? t.date.slice(0, 10) : $('wTradeDate').value;
      const tt = t.date && t.date.length > 10 ? t.date.slice(11, 16) : '';
      $('wTradeDate').value  = td;
      $('wTradeTime').value  = tt;
      if (t.outcome !== 'open') { $('wExitField').style.display = ''; $('wOptFields').style.display = ''; }

      // Badge direction
      const badge = $('wDirBadge');
      badge.textContent      = direction === 'long' ? 'LONG' : 'SHORT';
      badge.style.color      = direction === 'long' ? 'var(--green)' : 'var(--red)';
      badge.style.background = direction === 'long' ? 'var(--green-dim)' : 'var(--red-dim)';

      populateApexSelect(t.apex || '');
      const acc = Store.getMyAccountByName(t.apex || '');
      if (acc) { capital = acc.capital; feePerSide = acc.feePerSide || 2.14; firmKey = acc.firmKey || 'apex'; }
      fillStep3FromParsed();
      goToStep(3);
    } else {
      // Mode création : étape 1
      $('wBtnLong').className  = 'dir-btn';
      $('wBtnShort').className = 'dir-btn';
      const accounts    = Store.getMyAccounts();
      const defaultAcc  = accounts[0] || null;
      populateApexSelect(defaultAcc ? defaultAcc.name : '');
      if (defaultAcc) {
        capital    = defaultAcc.capital;
        feePerSide = defaultAcc.feePerSide || 2.14;
        firmKey    = defaultAcc.firmKey || 'apex';
      }
      goToStep(1);
    }

    $('modalOverlay').classList.add('open');
  }

  function close() {
    $('modalOverlay').classList.remove('open');
    editingId     = null;
    capturedImage = null;
    parsedTrade   = null;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const VALID_OUTCOMES  = new Set(['win', 'loss', 'be', 'open']);
  const VALID_INSTRS    = new Set(['MES1','ES1','MNQ1','NQ1','MYM1','YM1','M2K1','RTY1','MGC1','GC1','MCL1','CL1','ZN1',
                                    'US500','US100','US30','GER40','UK100','XAUUSD','EURUSD','GBPUSD','USDJPY','USOIL']);

  function save() {
    const entry = parseFloat($('wEntry').value);
    const sl    = parseFloat($('wSL').value);
    const tp1   = parseFloat($('wTP1').value);
    if (!entry || !sl || !tp1) { UI.toast(i18n.t('modal.required'), true); return; }

    const rawInstr   = $('wInstr').value;
    const rawOutcome = $('wOutcome').value;
    const safeDir    = direction === 'long' ? 'long' : 'short';
    const safeOutcome = VALID_OUTCOMES.has(rawOutcome) ? rawOutcome : 'open';
    const safeInstr   = VALID_INSTRS.has(rawInstr) ? rawInstr : 'MES1';

    const dateVal = $('wTradeDate').value;
    const timeVal = $('wTradeTime').value;
    const dateStr = dateVal ? (timeVal ? `${dateVal}T${timeVal}:00` : dateVal) : undefined;

    const data = {
      instrument: safeInstr,
      direction:  safeDir,
      date:       dateStr,
      contracts:  Math.max(1, Math.min(999, parseInt($('wContracts').value) || 1)),
      capital,
      apex:       $('wApex').value,
      feePerSide,
      spreadCost,
      entry, sl, tp1,
      tp2:        parseFloat($('wTP2').value)  || null,
      tp3:        parseFloat($('wTP3').value)  || null,
      setup:      $('wSetup').value.trim().slice(0, 500),
      notes:      $('wNotes').value.trim().slice(0, 2000),
      outcome:    safeOutcome,
      exitPrice:  parseFloat($('wExit').value) || null,
    };

    let saved;
    if (editingId) {
      saved = Store.updateTrade(editingId, data);
      UI.toast(i18n.t('modal.trade.updated'));
    } else if (data.apex && data.apex.startsWith('grp:')) {
      // Sauvegarde sur tous les comptes du groupe
      const groupId = data.apex.slice(4);
      const grp     = Store.getGroupById(groupId);
      if (grp && grp.accountIds && grp.accountIds.length) {
        const trades = grp.accountIds.map(accId => {
          const acc = Store.getMyAccountById(accId);
          if (!acc) return null;
          return Store.addTrade({
            ...data,
            apex:       acc.name,
            capital:    acc.capital,
            feePerSide: acc.feePerSide || 2.14,
            spreadCost: Store.getSpreadsByFirm(acc.firmKey || 'apex')[data.instrument] || 0,
            groupId,
          });
        }).filter(Boolean);
        saved = trades[0];
        UI.toast(i18n.t('modal.trade.group', { n: trades.length, name: grp.name }));
      } else {
        UI.toast(i18n.t('modal.group.empty'), true);
        return;
      }
    } else {
      saved = Store.addTrade(data);
      UI.toast(i18n.t('modal.trade.saved'));
    }
    close();
    if (onSaved) onSaved(saved);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    // Step 1
    $('wBtnLong').addEventListener('click',  () => setDirection('long'));
    $('wBtnShort').addEventListener('click', () => setDirection('short'));

    // Step 2
    $('wBtnBack1').addEventListener('click', () => goToStep(1));
    $('wBtnRetry').addEventListener('click', analyzeImage);
    $('wTextHint').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); analyzeImage(); }
    });
    $('wBtnNext2').addEventListener('click', () => {
      if (!parsedTrade) {
        const hint = ($('wTextHint').value || '').trim();
        if (hint) parsedTrade = parseTextHint(hint);
      }
      if (parsedTrade) fillStep3FromParsed();
      populateApexSelect('');
      goToStep(3);
      $('wContracts').focus();
    });

    $('wDropZone').addEventListener('click', e => {
      if (e.target === $('wBtnClearImg') || $('wBtnClearImg').contains(e.target)) return;
      $('wImageFile').click();
    });
    $('wBtnClearImg').addEventListener('click', e => { e.stopPropagation(); clearImage(); });
    $('wImageFile').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) { loadImageFile(file); e.target.value = ''; }
    });

    // Drag-and-drop
    $('wDropZone').addEventListener('dragover', e => {
      e.preventDefault();
      $('wDropZone').classList.add('dz-dragover');
    });
    $('wDropZone').addEventListener('dragleave', e => {
      if (!$('wDropZone').contains(e.relatedTarget))
        $('wDropZone').classList.remove('dz-dragover');
    });
    $('wDropZone').addEventListener('drop', e => {
      e.preventDefault();
      $('wDropZone').classList.remove('dz-dragover');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) loadImageFile(file);
    });

    // Paste global (⌘V) → capture image
    document.addEventListener('paste', e => {
      if (!$('modalOverlay').classList.contains('open')) return;
      if ($('wp2').style.display === 'none') return;
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          loadImageFile(item.getAsFile());
          break;
        }
      }
    });

    // Step 3
    $('wBtnBack2').addEventListener('click', () => goToStep(2));
    $('wBtnSave').addEventListener('click',  save);

    $('wInstr').addEventListener('change', () => {
      spreadCost = getSpreadForInstrument(firmKey, $('wInstr').value);
      wRecalc();
    });

    $('wApex').addEventListener('change', () => {
      const val = $('wApex').value;
      if (val.startsWith('grp:')) {
        // Groupe : on prend le premier compte du groupe pour le calcul
        const grp     = Store.getGroupById(val.slice(4));
        const firstAcc = grp && grp.accountIds && grp.accountIds.length
          ? Store.getMyAccountById(grp.accountIds[0]) : null;
        capital    = firstAcc ? firstAcc.capital    : (Store.getSettings().capital || 50000);
        feePerSide = firstAcc ? (firstAcc.feePerSide || 2.14) : 2.14;
        firmKey    = firstAcc?.firmKey || 'apex';
        if (firstAcc) $('wContracts').max = firstAcc.maxContracts;
      } else {
        const acc = Store.getMyAccountByName(val);
        if (acc) {
          capital              = acc.capital;
          feePerSide           = acc.feePerSide || 2.14;
          firmKey              = acc.firmKey || 'apex';
          $('wContracts').max  = acc.maxContracts;
        } else {
          capital    = Store.getSettings().capital || 50000;
          feePerSide = 2.14;
          firmKey    = 'apex';
        }
      }
      spreadCost = getSpreadForInstrument(firmKey, $('wInstr').value);
      wRecalc();
    });

    ['wContracts', 'wEntry', 'wSL', 'wTP1'].forEach(id => {
      $(id).addEventListener('input',  wRecalc);
      $(id).addEventListener('change', wRecalc);
    });

    $('wOutcome').addEventListener('change', () => {
      $('wExitField').style.display = $('wOutcome').value !== 'open' ? '' : 'none';
    });

    $('wOptToggle').addEventListener('click', () => {
      const open = $('wOptFields').style.display !== 'none';
      $('wOptFields').style.display = open ? 'none' : '';
      $('wOptToggle').textContent   = open ? i18n.t('wiz.setup') : i18n.t('wiz.setup.close');
    });

    // Fermeture
    $('btnWizClose').addEventListener('click', close);
    $('modalOverlay').addEventListener('click', e => {
      if (e.target === $('modalOverlay')) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  return { init, open, close };
})();
