// ─── CHANGELOG ────────────────────────────────────────────────────────────────
// Historique des mises à jour — affiché sur la page Mises à jour

const Changelog = (() => {

  const ENTRIES = [
    {
      version: '0.9.101',
      date: '2026-05-11',
      time: '23:00',
      tags: ['feat'],
      title: 'Sortie partielle (scale-out) — 50% à mi-chemin, reste à BE',
      titleEn: 'Partial close (scale-out) — 50% halfway, rest at BE',
      items: [
        { type: 'feat', text: 'Nouveau toggle "Sortie partielle (scale-out)" dans le step 3 du wizard : permet de prendre X% de la position à un prix donné, le reste tourne jusqu\'à exit/SL/TP/BE. P&L pondéré automatiquement (ex : 50% à 6810 + 50% à BE → profit positif sur trade marqué BE)', textEn: 'New "Partial close (scale-out)" toggle in wizard step 3: take X% of position at a given price, the rest runs until exit/SL/TP/BE. Auto-weighted P&L (e.g. 50% at 6810 + 50% at BE → positive profit on a trade marked BE)' },
        { type: 'feat', text: 'Affichage du partial dans la vue détail Journal : ligne "Partial close: 50% à 6810" visible. P&L recalculé en temps réel dans le wizard. Sauvegardé à vie avec le trade', textEn: 'Partial displayed in Journal detail view: "Partial close: 50% at 6810" line. P&L recalculated live in wizard. Saved forever with the trade' },
      ],
    },
    {
      version: '0.9.98',
      date: '2026-05-11',
      time: '14:00',
      tags: ['feat'],
      title: 'Screenshots persistants par trade (Firebase Storage)',
      titleEn: 'Persistent trade screenshots (Firebase Storage)',
      items: [
        { type: 'feat', text: 'Nouvelle zone "Screenshot du trade" dans le wizard de création/édition : Ctrl+V pour coller, drag&drop ou file picker. Compression automatique en JPEG (max 1920×1080, qualité 0.85→0.4 si nécessaire) pour rester sous 2 MB. Stocké à vie dans Firebase Storage tant que le trade existe', textEn: 'New "Trade screenshot" zone in the create/edit wizard: Ctrl+V to paste, drag&drop or file picker. Auto-compression to JPEG (max 1920×1080, quality 0.85→0.4 as needed) to stay under 2 MB. Stored forever in Firebase Storage as long as the trade exists' },
        { type: 'feat', text: 'Mode édition : le screenshot existant est rechargé automatiquement depuis Storage à l\'ouverture du trade. Boutons Remplacer / Supprimer disponibles', textEn: 'Edit mode: existing screenshot is auto-reloaded from Storage when opening the trade. Replace / Delete buttons available' },
        { type: 'security', text: 'Storage rules : owner only (lecture + écriture limitées à users/{uid}/trades/{tradeId}/), taille max 2 MB, content-type whitelist (jpeg/png/webp), default-deny global', textEn: 'Storage rules: owner only (read + write restricted to users/{uid}/trades/{tradeId}/), 2 MB max, content-type whitelist (jpeg/png/webp), global default-deny' },
        { type: 'security', text: 'deleteUserAccount (admin) supprime aussi tous les screenshots Storage du user. deleteTrade supprime automatiquement le screenshot associé. RGPD : aucune image orpheline après suppression', textEn: 'deleteUserAccount (admin) also deletes all the user\'s Storage screenshots. deleteTrade auto-deletes the associated screenshot. GDPR: no orphan images after deletion' },
      ],
    },
    {
      version: '0.9.97',
      date: '2026-05-10',
      time: '20:00',
      tags: ['security', 'admin', 'rgpd'],
      title: '5e ultraréview — hardening admin chain + RGPD + soft-delete',
      titleEn: '5th ultra-review — admin chain hardening + GDPR + soft-delete',
      items: [
        { type: 'security', text: 'NOUVELLE Cloud Function generateProCode : rate-limit 10 codes/h/admin (anti-abus si compte admin compromis), cap 5 codes actifs par user cible, audit log obligatoire. La génération côté client est désormais bloquée par les rules (proCodeHashes en CF-only)', textEn: 'NEW generateProCode Cloud Function: rate-limit 10 codes/h/admin (anti-abuse if admin account is compromised), cap of 5 active codes per target user, mandatory audit log. Client-side generation now blocked by rules (proCodeHashes is CF-only)' },
        { type: 'security', text: 'deleteUserAccount : SOFT-DELETE — toutes les données du user supprimé sont archivées 30j dans /deletedUsers/{uid}/ avant purge définitive (cron à venir). Permet une restauration manuelle en cas d\'erreur admin', textEn: 'deleteUserAccount: SOFT-DELETE — all deleted user data is archived for 30 days in /deletedUsers/{uid}/ before permanent purge. Allows manual restore if admin made a mistake' },
        { type: 'security', text: 'revokeProCode : audit log "in_progress" écrit AVANT la transaction (traçabilité même si crash en cours)', textEn: 'revokeProCode: "in_progress" audit log written BEFORE the transaction (traceability even on mid-crash)' },
        { type: 'security', text: 'sendContactMessage : throttle réservé EN TRANSACTION ATOMIQUE avant l\'envoi Web3Forms (anti-race : spam-clic en parallèle ne bypass plus le 60s). Logs Web3Forms purgés de la PII (plus de body en clair dans Cloud Logging)', textEn: 'sendContactMessage: throttle reserved in ATOMIC TRANSACTION before Web3Forms call (anti-race: parallel spam-clicks no longer bypass the 60s). Web3Forms logs purged of PII (no more plaintext body in Cloud Logging)' },
        { type: 'security', text: 'Auth.deleteAccount (côté user) supprime aussi les proCodeHashes attribués (RGPD : plus d\'email orphelin après suppression de compte). Rule proCodeHashes : delete autorisé pour le destinataire (self-delete RGPD)', textEn: 'Auth.deleteAccount (user-side) also deletes attributed proCodeHashes (GDPR: no more orphan email after account deletion). proCodeHashes rule: delete allowed for the owner (GDPR self-delete)' },
        { type: 'fix', text: 'Store.fbSet : erreurs Firestore remontent à l\'UI via event store:saveFailed (un user qui dépasse 1 MiB ou perd la connexion est désormais notifié au lieu de croire à un faux sentiment de sécurité)', textEn: 'Store.fbSet: Firestore errors propagate to UI via store:saveFailed event (a user hitting the 1 MiB limit or losing connection is now notified instead of having a false sense of safety)' },
        { type: 'security', text: 'Store : anti-corruption sync — si Firestore renvoie un payload trades anormalement réduit (>50% perte vs cache local sur >10 trades), pas d\'overwrite + event store:syncConflict (anti-bug catastrophique où une mauvaise sync efface l\'historique)', textEn: 'Store: anti-corruption sync — if Firestore returns an abnormally reduced trades payload (>50% loss vs local cache on >10 trades), no overwrite + store:syncConflict event (protects against catastrophic bug erasing history)' },
        { type: 'feat', text: 'Store.exportFullJSON : export RGPD complet (trades + settings + comptes + groupes + spreads + plan) pour le droit à la portabilité', textEn: 'Store.exportFullJSON: complete GDPR export (trades + settings + accounts + groups + spreads + plan) for the right to data portability' },
        { type: 'rgpd', text: 'privacy.html enrichi : déclaration explicite de Web3Forms (envoi messages), hCaptcha (anti-bot), reCAPTCHA Enterprise (App Check), GitHub Pages (hébergement). Mention du Data Privacy Framework EU-US et des CCT. Mention "pas de DPO" justifiée par l\'absence de traitement à grande échelle', textEn: 'privacy.html enriched: explicit declaration of Web3Forms (message sending), hCaptcha (anti-bot), reCAPTCHA Enterprise (App Check), GitHub Pages (hosting). Mention of EU-US Data Privacy Framework and SCCs. "No DPO" mention justified by absence of large-scale processing' },
      ],
    },
    {
      version: '0.9.96',
      date: '2026-05-10',
      time: '16:00',
      tags: ['security', 'hardening'],
      title: '4e ultraréview — hardening résiduel post-audit',
      titleEn: '4th ultra-review — residual hardening post-audit',
      items: [
        { type: 'security', text: 'addGroup/updateGroup : strict spread (anti-injection champs depuis DevTools), nouveau _sanitizeGroupData (whitelist name + accountIds avec regex), nom de groupe whitelist alphanumérique strict', textEn: 'addGroup/updateGroup: strict spread (anti DevTools field injection), new _sanitizeGroupData (whitelist name + accountIds with regex), strict alphanumeric group name whitelist' },
        { type: 'security', text: '_plan : whitelist STRICTE des champs lus depuis Firestore (anti-injection si une future CF écrivait isAdmin/unlimited/etc.)', textEn: '_plan: strict whitelist of fields loaded from Firestore (prevents injection if a future CF wrote isAdmin/unlimited/etc.)' },
        { type: 'security', text: 'localStorage tampering : trades/myAccounts/groups sanitisés au load (un attaquant qui modifie localStorage à la main ne peut plus injecter de données non-validées)', textEn: 'localStorage tampering: trades/myAccounts/groups sanitized at load (an attacker modifying localStorage manually can no longer inject unvalidated data)' },
        { type: 'security', text: 'revokeProCode étendu : tronque myAccounts à 1 élément lors du downgrade Pro→Basic (évite l\'UX cassée où le user a 100 comptes en lecture seule)', textEn: 'revokeProCode extended: truncates myAccounts to 1 item on Pro→Basic downgrade (avoids broken UX where the user has 100 read-only accounts)' },
        { type: 'security', text: 'Cloud Functions : maxInstances ajouté (analyzeChart:10, contact:5, signup:5, delete:2, revoke:2) — budget DoS plafonné. consumeAppCheckToken:true sur toutes (token utilisable 1 fois, anti-replay). Retrait de localhost:8080 d\'ALLOWED_ORIGINS', textEn: 'Cloud Functions: maxInstances added (analyzeChart:10, contact:5, signup:5, delete:2, revoke:2) — DoS budget capped. consumeAppCheckToken:true on all (token usable once, anti-replay). localhost:8080 removed from ALLOWED_ORIGINS' },
        { type: 'security', text: 'deleteUserAccount : audit log écrit AVANT toute action destructive (in_progress status) puis mis à jour à la fin (completed/partial) — garantit la traçabilité même si la fonction crash en cours', textEn: 'deleteUserAccount: audit log written BEFORE any destructive action (in_progress status) then updated at end (completed/partial) — guarantees traceability even if the function crashes mid-way' },
        { type: 'fix', text: '_sanitizeTrade : dates antérieures à 2010-01-01 rejetées (anti pollution stats via epoch=0), addMyAccount : check canAddAccount() côté Store (cohérence Pro côté client). payment.html ?v= aligné sur la version courante', textEn: '_sanitizeTrade: dates before 2010-01-01 rejected (anti stats pollution via epoch=0), addMyAccount: canAddAccount() check at Store level (Pro consistency client-side). payment.html ?v= aligned with current version' },
      ],
    },
    {
      version: '0.9.95',
      date: '2026-05-10',
      time: '10:00',
      tags: ['security', 'fix'],
      title: '3e ultraréview — hardening complet backend + client',
      titleEn: '3rd ultra-review — full backend + client hardening',
      items: [
        { type: 'security', text: 'deleteUserAccount durci : ordre inversé (Auth.deleteUser + revokeRefreshTokens AVANT cascade Firestore — empêche les writes zombies du user pendant la suppression), listDocuments dynamique au lieu de liste hardcodée (pas d\'orphelins futurs), protection anti-suppression d\'un autre admin, audit log immuable dans /auditLogs', textEn: 'deleteUserAccount hardened: reversed order (Auth.deleteUser + revokeRefreshTokens BEFORE Firestore cascade — prevents zombie writes during deletion), dynamic listDocuments (no future orphans), protection against admin-deleting-admin, immutable audit log in /auditLogs' },
        { type: 'security', text: 'Cloud Function revokeProCode (transactionnelle) — révocation atomique du code Pro ET du plan en une seule opération. Plus de window d\'incohérence où le code reste valide alors que le plan est révoqué', textEn: 'revokeProCode Cloud Function (transactional) — atomic revocation of both Pro code AND plan in one operation. No more inconsistency window where the code stays valid while the plan is revoked' },
        { type: 'security', text: 'analyzeChart : try/catch sur fetch Groq (rollback quota sur timeout réseau, plus de quota perdu pour rien), system prompt anti-prompt-injection, validation regex base64, réponse trimmée (pas de leak metadata Groq au client)', textEn: 'analyzeChart: try/catch on Groq fetch (quota rollback on network timeout, no more wasted quota), anti prompt-injection system prompt, base64 regex validation, trimmed response (no Groq metadata leak to client)' },
        { type: 'security', text: 'Firestore rules : isAdmin() exige email_verified, fix bug spreadsByFirm (request.resource.size() → data.size() valide), validation userEmails username regex stricte + blocklist (admin, zeldtrade, support…), proCodeHashes en create-only avec validation des champs, nouvelle collection /auditLogs (read admin, write impossible côté client)', textEn: 'Firestore rules: isAdmin() now requires email_verified, fix spreadsByFirm bug (request.resource.size() → data.size()), strict userEmails username regex + blocklist (admin, zeldtrade, support…), proCodeHashes create-only with field validation, new /auditLogs collection (admin-read, no client write)' },
        { type: 'security', text: '_sanitizeTrade : escape HTML setup/notes dès le stockage (fail-safe — même si un renderer oublie escHtml, pas de XSS stocké), manualPnl borné dynamiquement à 50× le risque calculé (au lieu de ±1 milliard absurde), reject dates futures', textEn: '_sanitizeTrade: HTML escape setup/notes at storage (fail-safe — even if a renderer forgets escHtml, no stored XSS), manualPnl bounded dynamically to 50× calculated risk (instead of absurd ±1B), reject future dates' },
        { type: 'security', text: '_safeNum gère la virgule décimale (cohérent avec CSV import), addMyAccount/updateMyAccount strict spread (plus de bypass via champs injectés depuis DevTools), _sanitizeAccountName whitelist alphanumérique strict', textEn: '_safeNum handles decimal comma (consistent with CSV import), addMyAccount/updateMyAccount strict spread (no more bypass via DevTools-injected fields), _sanitizeAccountName strict alphanumeric whitelist' },
        { type: 'security', text: 'activatePro : lock anti-double-clic (empêche 2 activations parallèles qui désynchronisaient l\'UI). Store.purgeForeignCache au login : supprime les clés ztrade_* d\'autres uids dans localStorage (anti data-leakage sur appareil partagé)', textEn: 'activatePro: anti-double-click lock (prevents 2 parallel activations that would desync the UI). Store.purgeForeignCache on login: removes ztrade_* keys of other uids from localStorage (anti data-leakage on shared device)' },
        { type: 'security', text: 'Console admin : révocation Pro passe par la Cloud Function transactionnelle revokeProCode (atomicité garantie côté serveur)', textEn: 'Admin console: Pro revocation now goes through the transactional revokeProCode Cloud Function (server-side atomicity guaranteed)' },
      ],
    },
    {
      version: '0.9.94',
      date: '2026-05-09',
      time: '14:00',
      tags: ['feat', 'admin'],
      title: 'Console admin : suppression complète d\'un utilisateur',
      titleEn: 'Admin console: full user deletion',
      items: [
        { type: 'feat', text: 'Bouton "Supprimer" dans la liste des utilisateurs (admin) — confirmation par saisie de SUPPRIMER, supprime Firestore (trades, comptes, settings, plan, codes) + compte Firebase Auth via Cloud Function deleteUserAccount', textEn: 'New "Delete" button in admin user list — type SUPPRIMER to confirm, deletes Firestore data (trades, accounts, settings, plan, codes) + Firebase Auth account via deleteUserAccount Cloud Function' },
        { type: 'security', text: 'Cloud Function deleteUserAccount : admin uniquement, App Check obligatoire, garde-fou anti auto-suppression, validation stricte de l\'uid', textEn: 'deleteUserAccount Cloud Function: admin only, App Check required, anti-self-deletion guard, strict uid validation' },
      ],
    },
    {
      version: '0.9.93',
      date: '2026-05-09',
      time: '12:00',
      tags: ['fix'],
      title: 'Fix critique : activation Pro bloquée pour comptes existants',
      titleEn: 'Critical fix: Pro activation blocked for existing accounts',
      items: [
        { type: 'fix', text: 'Règle Firestore plan : create-only bloquait l\'activation Pro si un doc plan existait déjà (legacy). Passage en write avec mêmes validations (codeHash → uid)', textEn: 'plan Firestore rule: create-only was blocking Pro activation if a plan doc already existed (legacy). Switched to write with same validations (codeHash → uid)' },
      ],
    },
    {
      version: '0.9.90',
      date: '2026-05-08',
      time: '10:00',
      tags: ['security', 'fix'],
      title: '2e ultraréview — failles régression colmatées',
      titleEn: '2nd ultra-review — regression flaws patched',
      items: [
        { type: 'fix', text: 'Bug critique : la lecture config/groq cassait tout le chargement Firestore depuis v0.9.89 (sync cross-device perdue). Supprimée — la clé Groq vit dans Secret Manager', textEn: 'Critical bug: config/groq read was breaking all Firestore loading since v0.9.89 (cross-device sync lost). Removed — Groq key lives in Secret Manager' },
        { type: 'fix', text: 'firebase.json : ajout de la section firestore (sinon les rules ne se déploient pas avec firebase deploy)', textEn: 'firebase.json: added firestore section (rules were not deployed with firebase deploy)' },
        { type: 'fix', text: 'updateTrade : merge des données partielles AVANT sanitize (ne plus écraser apex/setup/notes/contracts par les valeurs par défaut)', textEn: 'updateTrade: partial data merge BEFORE sanitize (no longer overwrites apex/setup/notes/contracts with defaults)' },
        { type: 'fix', text: 'importTrades passe maintenant par _sanitizeTrade — validation stricte identique à addTrade (anti-injection JSON)', textEn: 'importTrades now goes through _sanitizeTrade — same strict validation as addTrade (JSON injection-proof)' },
        { type: 'security', text: 'Validation d\'unicité du nom de compte (impossible de créer 2 comptes avec le même nom — empêchait le rattachement correct des trades)', textEn: 'Account name uniqueness validation (cannot create 2 accounts with the same name — was breaking trade-account linking)' },
        { type: 'security', text: 'IDs trades anti-collision : timestamp + 6 chars random (avant : Date.now() seul → collisions sur enregistrement de groupes)', textEn: 'Anti-collision trade IDs: timestamp + 6 random chars (before: Date.now() alone → collisions on group save)' },
        { type: 'security', text: 'Cloud Function analyzeChart : rollback du quota si Groq échoue (ne plus consommer le quota du user pour rien)', textEn: 'analyzeChart Cloud Function: quota rollback if Groq fails (no longer wastes user quota)' },
        { type: 'security', text: 'Cloud Function notifyNewSignup : flag idempotent posé AVANT envoi (anti race-condition double-clic) + vérification creationTime (immuable, contrairement à auth_time)', textEn: 'notifyNewSignup Cloud Function: idempotent flag set BEFORE send (anti double-click race) + creationTime check (immutable, unlike auth_time)' },
        { type: 'security', text: 'Cloud Function sendContactMessage : email_verified obligatoire (anti-spoofing renforcé)', textEn: 'sendContactMessage Cloud Function: email_verified required (reinforced anti-spoofing)' },
        { type: 'fix', text: 'manualPnl forcé à null si outcome=open dans _sanitizeTrade (ne plus polluer les stats si l\'utilisateur passe le trade à win/loss plus tard)', textEn: 'manualPnl forced to null if outcome=open in _sanitizeTrade (no longer pollutes stats if user later switches to win/loss)' },
        { type: 'fix', text: 'Migration auto au login : firmKey legacy ftmo→ftmo1step pour FTMO 1-Step + hydratation capital/feePerSide pour anciens trades', textEn: 'Auto-migration on login: legacy ftmo→ftmo1step firmKey for FTMO 1-Step + capital/feePerSide hydration for old trades' },
        { type: 'fix', text: 'feePerSide=0 (Funding Pips) maintenant correctement géré partout (avant : remplacé par 2.14 à cause des `||`)', textEn: 'feePerSide=0 (Funding Pips) now correctly handled everywhere (before: replaced by 2.14 due to `||`)' },
        { type: 'fix', text: 'Calc.trailingFloor : drawdown statique pour FTMO 2-Step et Funding Pips (au lieu de trailing partout)', textEn: 'Calc.trailingFloor: static drawdown for FTMO 2-Step and Funding Pips (instead of trailing everywhere)' },
        { type: 'fix', text: 'Filtres de date : utilisation de UI.localDay() partout (cohérence client/serveur sur les bordures de fuseau)', textEn: 'Date filters: UI.localDay() used everywhere (client/server consistency on timezone borders)' },
        { type: 'fix', text: 'Null-check sur _fbFunctions (message d\'erreur clair si SDK Functions ne charge pas)', textEn: 'Null-check on _fbFunctions (clear error if Functions SDK fails to load)' },
        { type: 'fix', text: 'Clés i18n manquantes ajoutées (auth.err.username.length/chars, contact.err.wait)', textEn: 'Missing i18n keys added (auth.err.username.length/chars, contact.err.wait)' },
      ],
    },
    {
      version: '0.9.89',
      date: '2026-05-07',
      time: '21:30',
      tags: ['security', 'fix'],
      title: 'Audit ultraréview — failles critiques colmatées',
      titleEn: 'Ultra-review audit — critical flaws patched',
      items: [
        { type: 'security', text: 'Quota IA : transaction atomique côté serveur (impossible à bypasser via multi-onglets ou DevTools delete/recreate)', textEn: 'AI quota: server-side atomic transaction (impossible to bypass via multi-tab or DevTools delete/recreate)' },
        { type: 'security', text: 'Cap journalier Pro ajouté (200 analyses/jour) — protège contre les coûts Groq incontrôlés', textEn: 'Pro daily cap added (200 analyses/day) — protects against uncontrolled Groq costs' },
        { type: 'security', text: 'Rule Firestore config/groq supprimée (la clé Groq n\'est plus du tout en Firestore — uniquement Secret Manager)', textEn: 'Firestore rule config/groq removed (Groq key is no longer in Firestore at all — only in Secret Manager)' },
        { type: 'security', text: 'Email du formulaire de contact forcé depuis le token Firebase (anti-spoofing — un user ne peut plus écrire au nom d\'une autre adresse)', textEn: 'Contact form email forced from Firebase token (anti-spoofing — a user can no longer write on behalf of another address)' },
        { type: 'security', text: 'Idempotence sur notifyNewSignup — impossible de déclencher 2x la notif d\'inscription', textEn: 'Idempotency on notifyNewSignup — cannot trigger signup notif twice' },
        { type: 'fix', text: 'Bug critique : capital, feePerSide, spreadCost, groupId étaient silencieusement perdus à la sauvegarde du trade — corrigé', textEn: 'Critical bug: capital, feePerSide, spreadCost, groupId were silently lost on trade save — fixed' },
        { type: 'fix', text: 'manualPnl ne s\'applique plus aux trades Open (évite que ça compte dans le P&L cumulé)', textEn: 'manualPnl no longer applies to Open trades (prevents counting in cumulative P&L)' },
        { type: 'fix', text: 'CSV import : les CFD avec lots fractionnaires (0.5 lot, etc.) sont maintenant correctement importés', textEn: 'CSV import: CFDs with fractional lots (0.5 lot, etc.) are now correctly imported' },
        { type: 'fix', text: 'Édition d\'un trade : feePerSide historique préservé (ne change plus si tu modifies les fees du compte)', textEn: 'Trade edit: historical feePerSide preserved (no longer changes if you modify account fees)' },
        { type: 'fix', text: 'firmKey corrigé pour FTMO 1-Step (était ftmo, maintenant ftmo1step) — bonnes règles trailing/daily appliquées', textEn: 'firmKey fixed for FTMO 1-Step (was ftmo, now ftmo1step) — correct trailing/daily rules applied' },
      ],
    },
    {
      version: '0.9.88',
      date: '2026-05-07',
      time: '20:00',
      tags: ['fix'],
      title: 'Fix boutons de connexion sur la landing',
      titleEn: 'Fix login buttons on landing page',
      items: [
        { type: 'fix', text: 'Les boutons d\'inscription/connexion fonctionnent maintenant à 100% (avant : "1 fois sur 3"). Causes : type="button" manquant, propagation d\'event vers le backdrop, Escape global qui interférait', textEn: 'Sign-up/login buttons now work 100% of the time (was "1 in 3"). Causes: missing type="button", event bubbling to backdrop, global Escape interfering' },
        { type: 'fix', text: 'closeModal ne s\'exécute plus si la modal est déjà fermée (évitait de vider des champs par accident)', textEn: 'closeModal no longer runs if modal already closed (was clearing fields accidentally)' },
        { type: 'fix', text: 'Le clic sur le backdrop ne ferme plus la modal si on clique sur un enfant (anti-bubble)', textEn: 'Backdrop click no longer closes modal when clicking on a child element (anti-bubble)' },
      ],
    },
    {
      version: '0.9.87',
      date: '2026-05-07',
      time: '19:00',
      tags: ['feat', 'fix'],
      title: 'P&L net manuel + fix sauvegarde de exitPrice / tp3',
      titleEn: 'Manual net P&L + fix exitPrice / tp3 saving',
      items: [
        { type: 'feat', text: 'Nouveau champ "P&L net réel ($)" dans le wizard de trade — si rempli, prend le dessus sur le P&L calculé (utile quand le broker affiche un P&L différent à cause des frais réels, slippage, etc.)', textEn: 'New "Actual net P&L ($)" field in the trade wizard — if filled, overrides the calculated P&L (useful when the broker shows a different P&L due to actual fees, slippage, etc.)' },
        { type: 'fix', text: 'Les champs exitPrice et tp3 étaient perdus à la sauvegarde du trade — corrigé', textEn: 'exitPrice and tp3 fields were lost on trade save — fixed' },
      ],
    },
    {
      version: '0.9.85',
      date: '2026-05-07',
      time: '17:30',
      tags: ['fix', 'security'],
      title: 'Fix Cloud Functions — captcha forwardé + rate-limit corrigé',
      titleEn: 'Cloud Functions fix — captcha forwarded + rate-limit corrected',
      items: [
        { type: 'fix', text: 'Le contact form transmet maintenant le token hCaptcha à la Cloud Function (qui le forward à Web3Forms) — le 403 Web3Forms est résolu', textEn: 'Contact form now forwards the hCaptcha token to the Cloud Function (which forwards it to Web3Forms) — fixes the 403 error' },
        { type: 'fix', text: 'Rate-limit serveur ne marque plus le timestamp lors d\'un échec — un envoi qui rate ne bloque plus pendant 60s', textEn: 'Server rate-limit no longer marks timestamp on failure — a failed send no longer blocks for 60s' },
        { type: 'security', text: 'CSP : ajout de apis.google.com (utilisé en interne par reCAPTCHA Enterprise)', textEn: 'CSP: added apis.google.com (used internally by reCAPTCHA Enterprise)' },
      ],
    },
    {
      version: '0.9.84',
      date: '2026-05-07',
      time: '09:00',
      tags: ['security'],
      title: 'Web3Forms via Cloud Function — clé jamais exposée',
      titleEn: 'Web3Forms via Cloud Function — key never exposed',
      items: [
        { type: 'security', text: 'Le formulaire de contact passe maintenant par une Cloud Function — la clé Web3Forms est stockée comme secret côté serveur, jamais visible côté client', textEn: 'The contact form now goes through a Cloud Function — the Web3Forms key is stored as a server-side secret, never visible client-side' },
        { type: 'security', text: 'La notification admin (nouvelle inscription) passe aussi par une Cloud Function dédiée', textEn: 'Admin notification (new signup) also goes through a dedicated Cloud Function' },
        { type: 'security', text: 'Rate-limiting côté serveur sur le contact (1 message / 60s par utilisateur, stocké dans Firestore — impossible à bypasser)', textEn: 'Server-side rate-limiting on contact (1 message / 60s per user, stored in Firestore — impossible to bypass)' },
        { type: 'security', text: 'CSP : api.web3forms.com retiré de connect-src et form-action — plus aucun appel direct depuis le client', textEn: 'CSP: api.web3forms.com removed from connect-src and form-action — no direct client calls anymore' },
      ],
    },
    {
      version: '0.9.82',
      date: '2026-05-07',
      time: '08:00',
      tags: ['security'],
      title: 'Cloud Function Groq — clé API jamais exposée',
      titleEn: 'Cloud Function Groq — API key never exposed',
      items: [
        { type: 'security', text: 'Les analyses IA passent désormais par une Cloud Function Firebase (proxy serveur) — la clé Groq n\'est plus jamais visible côté navigateur', textEn: 'AI analyses now go through a Firebase Cloud Function (server proxy) — the Groq key is no longer visible client-side' },
        { type: 'security', text: 'Quota IA enforcé côté serveur (impossible à bypasser via DevTools) — la fonction vérifie le plan et le compteur avant chaque appel', textEn: 'AI quota enforced server-side (no longer bypassable via DevTools) — function verifies plan and counter before each call' },
        { type: 'security', text: 'CSP retire api.groq.com (plus appelée directement) et ajoute le domaine cloudfunctions.net', textEn: 'CSP removed api.groq.com (no longer called directly) and added cloudfunctions.net domain' },
        { type: 'security', text: 'SDK Firebase Functions chargé avec SRI (Subresource Integrity)', textEn: 'Firebase Functions SDK loaded with SRI (Subresource Integrity)' },
      ],
    },
    {
      version: '0.9.81',
      date: '2026-05-07',
      time: '07:00',
      tags: ['security'],
      title: 'Pentester pass — durcissement avancé',
      titleEn: 'Pentester pass — advanced hardening',
      items: [
        { type: 'security', text: 'Permissions-Policy étendue à 25+ APIs (idle-detection, screen-wake-lock, autoplay, picture-in-picture, encrypted-media, FedCM, browsing-topics, ad APIs…)', textEn: 'Permissions-Policy extended to 25+ APIs (idle-detection, screen-wake-lock, autoplay, picture-in-picture, encrypted-media, FedCM, browsing-topics, ad APIs…)' },
        { type: 'security', text: 'Validation par magic bytes des screenshots uploadés — empêche un attaquant de renommer un fichier malveillant en .png', textEn: 'Magic bytes validation on uploaded screenshots — prevents an attacker from renaming a malicious file as .png' },
        { type: 'security', text: 'Déconnexion automatique après 30 minutes d\'inactivité (mouseover / clavier / scroll resettent le timer)', textEn: 'Automatic logout after 30 minutes of inactivity (mouseover / keyboard / scroll reset the timer)' },
        { type: 'security', text: 'Cache-Control: no-cache, no-store ajouté — empêche le cache HTTP de retenir des pages avec données sensibles', textEn: 'Cache-Control: no-cache, no-store added — prevents HTTP cache from holding pages with sensitive data' },
        { type: 'security', text: 'format-detection meta : empêche les navigateurs de détecter automatiquement les emails/téléphones et de créer des liens cliquables', textEn: 'format-detection meta: prevents browsers from auto-detecting emails/phones and creating clickable links' },
      ],
    },
    {
      version: '0.9.80',
      date: '2026-05-07',
      time: '06:00',
      tags: ['security', 'feat'],
      title: 'Polish sécurité + SEO + email verification',
      titleEn: 'Security polish + SEO + email verification',
      items: [
        { type: 'feat', text: 'Modal HTML stylé pour confirmer la suppression de tous les trades (remplace le prompt natif)', textEn: 'Styled HTML modal to confirm clearing all trades (replaces native prompt)' },
        { type: 'security', text: 'Email de vérification envoyé automatiquement à l\'inscription (mode soft, n\'empêche pas l\'utilisation)', textEn: 'Verification email sent automatically on signup (soft mode, does not block usage)' },
        { type: 'security', text: 'Rate-limiting sur la suppression de compte : 3 tentatives échouées → blocage 5 min', textEn: 'Rate-limiting on account deletion: 3 failed attempts → 5min lock' },
        { type: 'feat', text: 'Meta description, Open Graph et Twitter Card ajoutés (meilleur partage social + SEO)', textEn: 'Meta description, Open Graph and Twitter Card added (better social sharing + SEO)' },
        { type: 'feat', text: 'Favicon SVG ajouté (logo ZeldTrade)', textEn: 'SVG favicon added (ZeldTrade logo)' },
        { type: 'security', text: 'Code de la Cloud Function "proxy Groq" préparé dans /cloud-functions/ (à déployer manuellement pour protéger la clé Groq)', textEn: 'Cloud Function "Groq proxy" code prepared in /cloud-functions/ (to deploy manually to protect the Groq key)' },
      ],
    },
    {
      version: '0.9.79',
      date: '2026-05-07',
      time: '05:00',
      tags: ['fix', 'security'],
      title: 'Audit frais — corrections critiques + durcissement',
      titleEn: 'Fresh audit — critical fixes + extra hardening',
      items: [
        { type: 'fix', text: 'Correction du bouton "Commencer" du Guide qui ne fonctionnait pas (handler inline bloqué par la CSP) — désormais branché proprement', textEn: 'Fixed "Start" button on the Guide page that was broken (inline handler blocked by CSP) — now properly wired' },
        { type: 'fix', text: 'Correction des règles Firestore pour les spreads — FTMO 1-Step et Funding Pips étaient refusés', textEn: 'Fixed Firestore rules for spreads — FTMO 1-Step and Funding Pips were being rejected' },
        { type: 'security', text: 'Activation Pro : compteur de tentatives renforcé (couvre maintenant aussi les erreurs Firestore)', textEn: 'Pro activation: stricter attempt counter (now also covers Firestore errors)' },
        { type: 'security', text: 'Mot de passe : longueur minimum portée à 10 caractères + rejet d\'une liste de mots de passe trop communs', textEn: 'Password: minimum length raised to 10 characters + rejection of common passwords list' },
        { type: 'security', text: 'Limite de longueur sur le champ "indice IA" (anti-DoS regex)', textEn: 'Length limit on "AI hint" field (anti-DoS regex)' },
        { type: 'security', text: 'Validation de taille des spreads dans Firestore (anti-pollution storage)', textEn: 'Spreads size validation in Firestore (anti-storage-pollution)' },
      ],
    },
    {
      version: '0.9.78',
      date: '2026-05-07',
      time: '04:30',
      tags: ['security'],
      title: 'Firebase App Check (reCAPTCHA Enterprise) activé',
      titleEn: 'Firebase App Check (reCAPTCHA Enterprise) enabled',
      items: [
        { type: 'security', text: 'App Check activé : chaque requête vers Firestore et Auth est désormais vérifiée par reCAPTCHA Enterprise — bloque les bots et requêtes non légitimes depuis d\'autres domaines', textEn: 'App Check enabled: every request to Firestore and Auth is now verified by reCAPTCHA Enterprise — blocks bots and illegitimate requests from other domains' },
        { type: 'security', text: 'SDK Firebase App Check ajouté avec SRI (intégrité du script vérifiée)', textEn: 'Firebase App Check SDK added with SRI (script integrity verified)' },
        { type: 'security', text: 'CSP étendue pour autoriser google.com et recaptcha.net (nécessaires au fonctionnement de reCAPTCHA Enterprise)', textEn: 'CSP extended to allow google.com and recaptcha.net (required by reCAPTCHA Enterprise)' },
      ],
    },
    {
      version: '0.9.77',
      date: '2026-05-07',
      time: '04:00',
      tags: ['security'],
      title: 'hCaptcha intégré sur les formulaires',
      titleEn: 'hCaptcha integrated on forms',
      items: [
        { type: 'security', text: 'Widget hCaptcha ajouté sur les formulaires d\'inscription et de contact — bloque les bots automatisés', textEn: 'hCaptcha widget added on sign-up and contact forms — blocks automated bots' },
        { type: 'security', text: 'CSP mise à jour pour autoriser les domaines hCaptcha (script, frame, style, connect)', textEn: 'CSP updated to allow hCaptcha domains (script, frame, style, connect)' },
        { type: 'security', text: 'Message d\'erreur si la case captcha n\'est pas cochée + reset automatique en cas d\'échec d\'envoi', textEn: 'Error message if captcha not checked + automatic reset on send failure' },
      ],
    },
    {
      version: '0.9.76',
      date: '2026-05-07',
      time: '03:30',
      tags: ['security'],
      title: 'Audit ligne par ligne — durcissement supplémentaire',
      titleEn: 'Line-by-line audit — extra hardening',
      items: [
        { type: 'security', text: 'Codes Pro : lecture restreinte au destinataire dans les règles Firestore (anti-énumération)', textEn: 'Pro codes: read restricted to the assigned recipient in Firestore rules (anti-enumeration)' },
        { type: 'security', text: 'CSP : restriction de connect-src aux hosts Firebase précis (au lieu de *.googleapis.com large)', textEn: 'CSP: connect-src restricted to specific Firebase hosts (instead of broad *.googleapis.com)' },
        { type: 'security', text: 'SRI (Subresource Integrity) ajouté sur les scripts Firebase SDK — protection contre une compromission du CDN', textEn: 'SRI (Subresource Integrity) added on Firebase SDK scripts — protection against CDN compromise' },
        { type: 'security', text: 'Login admin : protection anti-timing-attack (durée minimale uniforme de 1.5s, peu importe le résultat)', textEn: 'Admin login: anti-timing-attack protection (uniform 1.5s minimum duration regardless of outcome)' },
        { type: 'security', text: 'Activation Pro : comparaison d\'UID en temps constant (défense en profondeur)', textEn: 'Pro activation: constant-time UID comparison (defense in depth)' },
        { type: 'security', text: 'Suppression de tous les trades : seconde confirmation textuelle "EFFACER" requise (anti-vandalisme session)', textEn: 'Clear all trades: second textual confirmation "EFFACER" required (session anti-vandalism)' },
        { type: 'security', text: 'Modal d\'authentification : effacement automatique des mots de passe à la fermeture', textEn: 'Auth modal: automatic password clearing on close' },
        { type: 'security', text: 'Timeouts réseau ajoutés sur tous les fetch (Web3Forms 15s, Frankfurter 10s, Groq 30s déjà en place)', textEn: 'Network timeouts added on all fetches (Web3Forms 15s, Frankfurter 10s, Groq 30s already in place)' },
        { type: 'security', text: 'Anti-injection CRLF : nettoyage des sauts de ligne dans le pseudo et l\'email avant envoi à Web3Forms', textEn: 'Anti-CRLF-injection: line-breaks stripped from username/email before sending to Web3Forms' },
        { type: 'security', text: 'Liens "_blank" : ajout de rel="noopener noreferrer" partout (anti-tabnabbing)', textEn: '"_blank" links: rel="noopener noreferrer" added everywhere (anti-tabnabbing)' },
        { type: 'security', text: 'Null-check sur email.split() — l\'app ne peut plus crasher si Firebase renvoie un user sans email', textEn: 'Null-check on email.split() — app no longer crashes if Firebase returns a user without email' },
      ],
    },
    {
      version: '0.9.75',
      date: '2026-05-07',
      time: '02:30',
      tags: ['feat'],
      title: 'Refonte landing page — DA minimaliste éditoriale',
      titleEn: 'Landing page redesign — minimalist editorial DA',
      items: [
        { type: 'feat', text: 'Hero épuré : titre simple sans buzzword, CTA unique blanc, lien secondaire texte, mention discrète des prop firms supportées', textEn: 'Clean hero: simple title without buzzwords, single white CTA, text-link secondary, discreet mention of supported prop firms' },
        { type: 'feat', text: 'Nouvelle section preview : mockup du dashboard avec stats fictives + courbe d\'equity SVG', textEn: 'New preview section: dashboard mockup with sample stats + SVG equity curve' },
        { type: 'feat', text: 'Features réorganisées en grid 2×2 sans cards bordées, icones SVG monochrome (plus d\'emojis)', textEn: 'Features reorganised in 2×2 grid without bordered cards, monochrome SVG icons (no more emojis)' },
        { type: 'feat', text: 'Pricing : eyebrow "Tarifs", titre "Commence gratuitement.", textes plus naturels (suppression des 🔒 et "→")', textEn: 'Pricing: "Tarifs" eyebrow, "Commence gratuitement." title, more natural copy (removed 🔒 and "→")' },
        { type: 'feat', text: 'Nouvelle section FAQ avec 4 questions clés (sécurité, mobile, accès Pro, fondateur)', textEn: 'New FAQ section with 4 key questions (security, mobile, Pro access, founder)' },
        { type: 'feat', text: 'Footer 2 colonnes (brand · liens) au lieu de centré, plus aéré', textEn: 'Footer in 2 columns (brand · links) instead of centered, more breathing room' },
      ],
    },
    {
      version: '0.9.74',
      date: '2026-05-07',
      time: '01:30',
      tags: ['feat'],
      title: 'Landing — DA harmonisée avec la page Offres',
      titleEn: 'Landing — DA harmonised with the Offers page',
      items: [
        { type: 'feat', text: 'La section tarifs de la landing reprend exactement la même direction artistique que la page Offres (cartes, badges, couleurs Pro violet / Lifetime ambre, CTAs alignés)', textEn: 'The landing pricing section now uses the exact same design as the Offers page (cards, badges, Pro purple / Lifetime amber colors, aligned CTAs)' },
        { type: 'feat', text: 'CSS landing simplifié : suppression des classes lp-plan dupliquées au profit des classes offer-card unifiées', textEn: 'Simplified landing CSS: removed duplicate lp-plan classes in favor of unified offer-card classes' },
      ],
    },
    {
      version: '0.9.73',
      date: '2026-05-07',
      time: '00:30',
      tags: ['feat'],
      title: 'Landing page — 3 offres affichées (Basic / Pro / Lifetime)',
      titleEn: 'Landing page — 3 plans displayed (Basic / Pro / Lifetime)',
      items: [
        { type: 'feat', text: 'Ajout de l\'offre Lifetime sur la landing page (3 cartes côte à côte au lieu de 2)', textEn: 'Added Lifetime plan on the landing page (3 cards side by side instead of 2)' },
        { type: 'feat', text: 'Badges visuels harmonisés avec la page Offres (BASIC, LE PLUS POPULAIRE, LIFETIME)', textEn: 'Visual badges harmonised with the Offers page (BASIC, MOST POPULAR, LIFETIME)' },
        { type: 'feat', text: 'Mention plus précise des fonctionnalités par plan (calculatrice de position, simulateur fiscal, vote roadmap…)', textEn: 'More precise feature listing per plan (position calculator, tax simulator, roadmap vote…)' },
      ],
    },
    {
      version: '0.9.72',
      date: '2026-05-06',
      time: '17:30',
      tags: ['security', 'fix'],
      title: 'Sécurité — durcissement complet du site',
      titleEn: 'Security — full site hardening',
      items: [
        { type: 'security', text: 'Politique de sécurité (CSP) renforcée : protection anti-clickjacking, restriction des destinations de formulaires, blocage strict des scripts externes', textEn: 'Hardened Content Security Policy: anti-clickjacking, restricted form destinations, strict external script blocking' },
        { type: 'security', text: 'Honeypot anti-bots sur les formulaires d\'inscription et de contact — bloque les bots de spam invisibles à l\'œil humain', textEn: 'Anti-bot honeypot on sign-up and contact forms — blocks spam bots invisibly' },
        { type: 'security', text: 'Limitation de tentatives : 5 tentatives de connexion → blocage 60s · 3 tentatives admin → blocage 5min · inscription/reset → 30-60s entre essais', textEn: 'Rate limiting: 5 login attempts → 60s lock · 3 admin attempts → 5min lock · register/reset → 30-60s between tries' },
        { type: 'security', text: 'Audit XSS complet — 8 vulnérabilités potentielles colmatées (échappement renforcé sur les IDs et classes générées dynamiquement)', textEn: 'Full XSS audit — 8 potential vulnerabilities patched (reinforced escaping on dynamically-generated IDs and classes)' },
        { type: 'security', text: 'Validation stricte des champs : longueurs maximales (email 254, password 128, message 5000…), regex pseudo, mot de passe avec lettre + chiffre obligatoires', textEn: 'Strict input validation: max lengths (email 254, password 128, message 5000…), username regex, password requires letter + digit' },
        { type: 'security', text: 'Nettoyage automatique des données locales à la déconnexion — sur appareil partagé, plus aucune donnée trace après logout', textEn: 'Automatic local data cleanup on logout — no traces left on shared devices' },
        { type: 'security', text: 'Pages /admin et /payment exclues des moteurs de recherche · Permissions-Policy étendue (capteurs, USB, Bluetooth, etc. désactivés)', textEn: '/admin and /payment pages excluded from search engines · Extended Permissions-Policy (sensors, USB, Bluetooth, etc. disabled)' },
        { type: 'fix', text: 'Messages d\'erreur génériques sur l\'admin (ne révèle plus si l\'email existe ou pas)', textEn: 'Generic error messages on admin (no longer leaks email existence)' },
      ],
    },
    {
      version: '0.9.71',
      date: '2026-05-06',
      time: '16:00',
      tags: ['fix', 'feat', 'security'],
      title: 'Audit complet — corrections de bugs critiques + nettoyage',
      titleEn: 'Full audit — critical bug fixes + cleanup',
      items: [
        { type: 'fix', text: 'Correction du calcul de "perte du jour" qui utilisait l\'heure UTC au lieu de l\'heure locale — impactait les règles Prop Firm pour les trades en soirée', textEn: 'Fixed "daily loss" calculation that was using UTC instead of local time — affected Prop Firm rules for evening trades' },
        { type: 'fix', text: 'Correction d\'une fuite mémoire dans la page Réglages : les boutons (Export, Import, Effacer…) déclenchaient plusieurs actions à la fois après une synchronisation cloud', textEn: 'Fixed a memory leak in the Settings page: buttons (Export, Import, Clear…) were triggering multiple actions after a cloud sync' },
        { type: 'fix', text: 'Le titre de la page Micro-Entrepreneur affichait "page.micro" brut au lieu du vrai titre traduit', textEn: 'The Tax Calculator page was displaying the raw key "page.micro" instead of the translated title' },
        { type: 'feat', text: 'La page Guide est maintenant entièrement bilingue (FR/EN) — traduction qui n\'était pas branchée', textEn: 'The Guide page is now fully bilingual (FR/EN) — translation was not wired up' },
        { type: 'security', text: 'Pages /admin et /payment maintenant exclues des moteurs de recherche (noindex + robots.txt)', textEn: '/admin and /payment pages now excluded from search engines (noindex + robots.txt)' },
        { type: 'feat', text: 'Ajout de l\'entrée changelog v0.9.69 manquante (changelog bilingue + déploiement auto-commit)', textEn: 'Added missing v0.9.69 changelog entry (bilingual changelog + auto-commit deploy)' },
      ],
    },
    {
      version: '0.9.70',
      date: '2026-05-05',
      time: '03:30',
      tags: ['feat'],
      title: 'Onglet Outils — Calculatrice de position + Micro-Entrepreneur',
      titleEn: 'Tools tab — Position calculator + Tax calc',
      items: [
        { type: 'feat', text: 'Nouvel onglet "Outils" dans la barre latérale remplaçant l\'ancien onglet "Micro"', textEn: 'New "Tools" tab in the sidebar replacing the old "Tax Calc" tab' },
        { type: 'feat', text: 'Calculatrice de position intégrée : calcule automatiquement la taille de position en contrats ou lots', textEn: 'Integrated position calculator: automatically computes position size in contracts or lots' },
        { type: 'feat', text: '23 instruments supportés : futures CME (MES, ES, MNQ, NQ, GC, CL…) et CFD/Forex (US30, US100, XAUUSD, EUR/USD…)', textEn: '23 instruments supported: CME futures (MES, ES, MNQ, NQ, GC, CL…) and CFD/Forex (US30, US100, XAUUSD, EUR/USD…)' },
        { type: 'feat', text: 'Lien automatique avec le compte sélectionné : capital pré-rempli, budget journalier restant, avertissement si dépassement du max contrats', textEn: 'Auto-link with the selected account: pre-filled capital, remaining daily budget, warning if max contracts exceeded' },
        { type: 'feat', text: 'Le simulateur Micro-Entrepreneur est maintenant un sous-onglet dans Outils', textEn: 'The Micro-Entrepreneur simulator is now a sub-tab inside Tools' },
      ],
    },
    {
      version: '0.9.69',
      date: '2026-05-05',
      time: '03:00',
      tags: ['feat', 'fix'],
      title: 'Changelog bilingue + page paiement bilingue + déploiement auto-commit',
      titleEn: 'Bilingual changelog + bilingual payment page + auto-commit deploy',
      items: [
        { type: 'feat', text: 'Le changelog s\'affiche maintenant en français ou anglais selon la langue choisie', textEn: 'The changelog now displays in French or English depending on the selected language' },
        { type: 'feat', text: 'La page de paiement s\'adapte aussi à la langue (lecture du localStorage)', textEn: 'The payment page also adapts to the language (reads from localStorage)' },
        { type: 'fix', text: 'Le script de release commit automatiquement les changements en attente avant de déployer — fini les déploiements qui poussent du vieux code', textEn: 'The release script automatically commits pending changes before deploying — no more deployments pushing stale code' },
      ],
    },
    {
      version: '0.9.68',
      date: '2026-05-05',
      time: '02:15',
      tags: ['fix'],
      title: 'Carte Basic harmonisée avec Pro et Lifetime',
      titleEn: 'Basic card harmonised with Pro and Lifetime',
      items: [
        { type: 'fix', text: 'La carte Basic avait une grande police "Gratuit" incohérente avec les autres cartes — mise en forme unifiée', textEn: 'The Basic card had a large "Free" heading inconsistent with the other cards — unified layout' },
        { type: 'feat', text: 'Badge "BASIC" ajouté en haut de la carte pour correspondre aux badges Pro et Lifetime', textEn: '"BASIC" badge added at the top of the card to match the Pro and Lifetime badges' },
      ],
    },
    {
      version: '0.9.67',
      date: '2026-05-05',
      time: '02:05',
      tags: ['fix'],
      title: 'Titre "Mises à jour" corrigé',
      titleEn: '"Updates" page title fixed',
      items: [
        { type: 'fix', text: 'Le titre de la page Mises à jour s\'affichait en double (dans la topbar ET dans le contenu) — corrigé', textEn: 'The Updates page title was showing twice (in the topbar AND in the content) — fixed' },
      ],
    },
    {
      version: '0.9.66',
      date: '2026-05-05',
      time: '01:45',
      tags: ['feat'],
      title: 'Page Offres restructurée — 3 paliers + code promo bêta',
      titleEn: 'Offers page restructured — 3 tiers + beta promo code',
      items: [
        { type: 'feat', text: '3 paliers : Gratuit, Pro (le plus populaire), Lifetime — avec liste de fonctionnalités détaillée', textEn: '3 tiers: Free, Pro (most popular), Lifetime — with detailed feature list' },
        { type: 'feat', text: 'Prix masqués pendant la bêta — affichage "🔒 Prix bientôt disponible"', textEn: 'Prices hidden during beta — showing "🔒 Price coming soon"' },
        { type: 'feat', text: 'Section "Code bêta / Code promo" en bas de page pour activer l\'accès Pro', textEn: '"Beta / Promo code" section at the bottom of the page to activate Pro access' },
        { type: 'feat', text: 'Boutons Pro et Lifetime → page "En cours de construction" dédiée (payment.html)', textEn: 'Pro and Lifetime buttons → dedicated "Under construction" page (payment.html)' },
        { type: 'feat', text: 'Tableau comparatif 3 colonnes (Gratuit / Pro / Lifetime)', textEn: '3-column comparison table (Free / Pro / Lifetime)' },
        { type: 'feat', text: 'Toutes les chaînes de la page Offres traduites en FR et EN parfait', textEn: 'All Offers page strings fully translated in perfect FR and EN' },
      ],
    },
    {
      version: '0.9.65',
      date: '2026-05-05',
      time: '01:12',
      tags: ['fix'],
      title: 'Traductions complètes FR/EN',
      titleEn: 'Complete FR/EN translations',
      items: [
        { type: 'fix', text: 'Dashboard : "Solde", "depuis le départ", étiquettes stats (Espérance, Meilleur, Pire, série) correctement traduites', textEn: 'Dashboard: "Balance", "since start", stats labels (Expectancy, Best trade, Worst trade, Streak) properly translated' },
        { type: 'fix', text: 'Wizard : labels P&L brut/net et Reward $ traduits selon la langue active', textEn: 'Wizard: Gross/Net P&L and Reward $ labels translated based on active language' },
        { type: 'fix', text: 'Offres : message d\'erreur de limitation de tentatives traduit en anglais', textEn: 'Offers: throttle error message properly translated into English' },
      ],
    },
    {
      version: '0.9.63',
      date: '2026-05-05',
      time: '00:46',
      tags: ['fix', 'data'],
      title: 'Règles FTMO corrigées et complétées',
      titleEn: 'FTMO rules corrected and completed',
      items: [
        { type: 'fix',  text: 'FTMO : commissions corrigées à $2.50/côté/lot (était $3.00)', textEn: 'FTMO: commission corrected to $2.50/side/lot (was $3.00)' },
        { type: 'fix',  text: 'FTMO : max lots mis à jour — jusqu\'à 50 lots (était 2–10)', textEn: 'FTMO: max lots updated — up to 50 lots (was 2–10)' },
        { type: 'feat', text: 'FTMO $10K ajouté (taille manquante)', textEn: 'FTMO $10K added (missing size)' },
        { type: 'feat', text: 'FTMO 1-Step ajouté ($10K–$200K) : daily loss 3%, drawdown trailing, 90% split, 0 jours minimum', textEn: 'FTMO 1-Step added ($10K–$200K): 3% daily loss, trailing drawdown, 90% split, 0 minimum days' },
        { type: 'feat', text: 'Badge TRAIL dans les Réglages pour les drawdowns trailing', textEn: 'TRAIL badge in Settings for trailing drawdowns' },
        { type: 'feat', text: 'Funding Pips et FTMO 1-Step apparaissent dans les onglets Réglages', textEn: 'Funding Pips and FTMO 1-Step now appear in Settings tabs' },
      ],
    },
    {
      version: '0.9.62',
      date: '2026-05-05',
      time: '00:36',
      tags: ['feat'],
      title: 'Lots décimaux + support CFD complet',
      titleEn: 'Decimal lots + full CFD support',
      items: [
        { type: 'feat', text: 'Lots décimaux : entrer 0.01, 0.1, 0.5… pour toutes les props firms CFD', textEn: 'Decimal lots: enter 0.01, 0.1, 0.5… for all CFD prop firms' },
        { type: 'feat', text: 'Calculs corrects par instrument CFD (EURUSD $10/pip/lot, XAUUSD $100/lot, US30 $5/lot…)', textEn: 'Correct calculations per CFD instrument (EURUSD $10/pip/lot, XAUUSD $100/lot, US30 $5/lot…)' },
        { type: 'feat', text: 'Affichage adapté : "0.10 lots" et "pts" au lieu de "contrats" et "ticks" pour les CFDs', textEn: 'Adapted display: "0.10 lots" and "pts" instead of "contracts" and "ticks" for CFDs' },
        { type: 'feat', text: 'Funding Pips ajouté : presets $10K–$200K avec spreads', textEn: 'Funding Pips added: presets $10K–$200K with spreads' },
        { type: 'feat', text: 'Step auto : instrument CFD → step 0.01, instrument futures → entier', textEn: 'Auto step: CFD instrument → step 0.01, futures instrument → integer' },
      ],
    },
    {
      version: '0.9.61',
      date: '2026-05-05',
      time: '00:22',
      tags: ['fix'],
      title: 'Correction version affichée',
      titleEn: 'Displayed version fixed',
      items: [
        { type: 'fix', text: 'La version dans Réglages → À propos était bloquée à 0.9.51 malgré les mises à jour', textEn: 'Version in Settings → About was stuck at 0.9.51 despite updates' },
      ],
    },
    {
      version: '0.9.56–0.9.60',
      date: '2026-05-05',
      time: '00:11',
      tags: ['feat', 'fix'],
      title: 'Responsive mobile & sidebar masquable',
      titleEn: 'Mobile responsive & collapsible sidebar',
      items: [
        { type: 'feat', text: 'Sidebar masquable sur mobile (bouton hamburger en haut à gauche)', textEn: 'Collapsible sidebar on mobile (hamburger button top-left)' },
        { type: 'feat', text: 'Wizard "Nouveau trade" en plein écran sur mobile (header et navigation sticky)', textEn: 'New trade wizard in fullscreen on mobile (sticky header and navigation)' },
        { type: 'feat', text: 'Journal : vue liste/détail séparée sur mobile', textEn: 'Journal: separate list/detail view on mobile' },
        { type: 'fix',  text: 'Tableau des trades récents (dashboard) : colonnes optimisées sur petit écran', textEn: 'Recent trades table (dashboard): optimized columns on small screens' },
        { type: 'fix',  text: 'Fermeture automatique de la sidebar au clic "Nouveau trade" sur mobile', textEn: 'Sidebar auto-closes when tapping "New trade" on mobile' },
        { type: 'fix',  text: 'Correction double flèche "← ← Retour" sur le bouton retour mobile', textEn: 'Fixed double back arrow "← ← Back" on mobile back button' },
        { type: 'fix',  text: 'Inputs 16px minimum pour éviter le zoom automatique sur iOS', textEn: '16px minimum inputs to prevent auto-zoom on iOS' },
      ],
    },
    {
      version: '0.9.54–0.9.55',
      date: '2026-05-04',
      time: '23:43',
      tags: ['feat'],
      title: 'Calcul live sur prix de sortie + auto-fill',
      titleEn: 'Live P&L on exit price + auto-fill',
      items: [
        { type: 'feat', text: 'Saisir un prix de sortie recalcule le P&L brut et net en temps réel (avec frais)', textEn: 'Entering an exit price recalculates gross and net P&L in real time (with fees)' },
        { type: 'feat', text: 'P&L en rouge si sorti avant le TP (perte partielle ou totale)', textEn: 'P&L shown in red if exited before TP (partial or full loss)' },
        { type: 'feat', text: 'Résultat Win → pré-remplit automatiquement le prix de sortie avec le TP', textEn: 'Win outcome → auto-fills exit price with the TP' },
        { type: 'feat', text: 'Résultat Loss → pré-remplit avec le SL', textEn: 'Loss outcome → auto-fills with the SL' },
        { type: 'feat', text: 'Section Notes ouverte par défaut dans le wizard', textEn: 'Notes section open by default in the wizard' },
      ],
    },
    {
      version: '0.9.39–0.9.53',
      date: '2026-05-01',
      time: '17:10',
      tags: ['security'],
      title: 'Audit sécurité complet',
      titleEn: 'Full security audit',
      items: [
        { type: 'security', text: 'Validation côté serveur du plan Pro (règles Firestore)', textEn: 'Server-side Pro plan validation (Firestore rules)' },
        { type: 'security', text: 'CSP durci, protection anti-framing, headers de sécurité', textEn: 'Hardened CSP, anti-framing protection, security headers' },
        { type: 'security', text: 'Protection XSS sur tous les champs utilisateur', textEn: 'XSS protection on all user input fields' },
        { type: 'security', text: 'Protection contre la pollution de prototype (maps Object.create(null))', textEn: 'Prototype pollution protection (maps using Object.create(null))' },
        { type: 'security', text: 'Throttle anti-spam sur les requêtes IA', textEn: 'Anti-spam throttle on AI requests' },
        { type: 'security', text: 'Suppression compte : règles Firestore RGPD + nettoyage données', textEn: 'Account deletion: GDPR Firestore rules + data cleanup' },
        { type: 'security', text: 'Timeout Firestore pour éviter les blocages silencieux', textEn: 'Firestore timeout to prevent silent hangs' },
      ],
    },
    {
      version: '0.9.40',
      date: '2026-05-01',
      time: '17:26',
      tags: ['feat'],
      title: 'Console admin + codes Pro',
      titleEn: 'Admin console + Pro codes',
      items: [
        { type: 'feat', text: 'Console admin pour générer et gérer les codes d\'accès PRO par utilisateur', textEn: 'Admin console to generate and manage PRO access codes per user' },
        { type: 'feat', text: 'Codes Pro individuels : chaque code ne peut être utilisé qu\'une seule fois', textEn: 'Individual Pro codes: each code can only be used once' },
      ],
    },
    {
      version: '0.9.37–0.9.38',
      date: '2026-05-01',
      time: '16:08',
      tags: ['feat'],
      title: 'Plan Basic / Pro',
      titleEn: 'Basic / Pro plan',
      items: [
        { type: 'feat', text: 'Différenciation Basic et Pro : analytics avancées, comptes multiples, IA Vision', textEn: 'Basic and Pro differentiation: advanced analytics, multiple accounts, AI Vision' },
        { type: 'feat', text: 'Presets prop firms verrouillés en Pro', textEn: 'Prop firm presets locked to Pro plan' },
        { type: 'feat', text: 'Badge BASIC/PRO dans la sidebar', textEn: 'BASIC/PRO badge in the sidebar' },
        { type: 'feat', text: 'CTA "Passer Pro" dans la sidebar pour les comptes Basic', textEn: '"Upgrade to Pro" CTA in the sidebar for Basic accounts' },
      ],
    },
    {
      version: '0.9.29–0.9.36',
      date: '2026-05-01',
      time: '02:45',
      tags: ['feat', 'fix'],
      title: 'Instruments par prop firm + spread wizard',
      titleEn: 'Instruments by prop firm + spread wizard',
      items: [
        { type: 'feat', text: 'Liste d\'instruments filtrée par prop firm (FTMO → CFD/Forex, Apex → Futures CME…)', textEn: 'Instrument list filtered by prop firm (FTMO → CFD/Forex, Apex → CME Futures…)' },
        { type: 'feat', text: 'Spread bid/ask affiché dans le wizard selon la prop firm et l\'instrument', textEn: 'Bid/ask spread shown in wizard based on prop firm and instrument' },
        { type: 'feat', text: 'Import CSV de trades dans Réglages → Données', textEn: 'CSV trade import in Settings → Data' },
        { type: 'feat', text: 'Solde réel affiché (capital + offset P&L) dans la liste des comptes', textEn: 'Real balance displayed (capital + P&L offset) in accounts list' },
        { type: 'feat', text: 'Dashboard : solde du compte affiché en grand dans les cartes', textEn: 'Dashboard: account balance shown prominently in account cards' },
        { type: 'feat', text: 'Réorganisation UI : objectifs en grille, sections analytics, layout dashboard', textEn: 'UI reorganization: goals in grid, analytics sections, dashboard layout' },
        { type: 'feat', text: 'FAQ mise à jour : synchronisation Firebase, login par compte', textEn: 'FAQ updated: Firebase sync, account-based login' },
        { type: 'fix',  text: 'Renommage Neutre → B/E dans tout le journal, les filtres et le wizard', textEn: 'Renamed Neutral → B/E across the journal, filters and wizard' },
      ],
    },
    {
      version: '0.9.24–0.9.28',
      date: '2026-04-30',
      time: '23:52',
      tags: ['feat'],
      title: 'Pilules éditables sur l\'étape 2',
      titleEn: 'Editable pills on step 2',
      items: [
        { type: 'feat', text: 'Étape 2 du wizard : cliquer sur Entry, SL ou TP ouvre un input inline pour corriger sans revenir', textEn: 'Wizard step 2: clicking on Entry, SL or TP opens an inline input to correct without going back' },
      ],
    },
    {
      version: '0.9.15–0.9.26',
      date: '2026-04-30',
      time: '23:04',
      tags: ['feat', 'fix'],
      title: 'IA Vision Groq + Tutorial + Landing Pro',
      titleEn: 'Groq AI Vision + Tutorial + Pro landing',
      items: [
        { type: 'feat', text: 'IA Vision (PRO) : analyse automatique de screenshots de trades via Groq', textEn: 'AI Vision (PRO): automatic trade screenshot analysis via Groq' },
        { type: 'feat', text: 'Prompt Groq amélioré : lecture des zones colorées de prix sur l\'axe droit', textEn: 'Improved Groq prompt: reads colored price zones on the right price axis' },
        { type: 'fix',  text: 'Fallback de modèle Groq si un modèle est indisponible', textEn: 'Groq model fallback if a model is unavailable' },
        { type: 'feat', text: 'QO1 (Mini Gold) ajouté aux instruments futures', textEn: 'QO1 (Mini Gold) added to futures instruments' },
        { type: 'feat', text: 'Page Tutorial complète en 5 étapes (comptes, trades, IA, analytics, conseils)', textEn: 'Full 5-step Tutorial page (accounts, trades, AI, analytics, tips)' },
        { type: 'feat', text: 'Bouton PRO sur la landing : connexion puis redirection vers Offres', textEn: 'PRO button on landing page: login then redirect to Offers' },
      ],
    },
    {
      version: '0.9.9–0.9.14',
      date: '2026-04-30',
      time: '20:54',
      tags: ['feat', 'fix'],
      title: 'Wizard — blocages et validations',
      titleEn: 'Wizard — guards and validations',
      items: [
        { type: 'feat', text: 'Blocage du wizard si aucun compte configuré : toast d\'erreur', textEn: 'Wizard blocked if no account configured: error toast' },
        { type: 'feat', text: 'Blocage de la sauvegarde si aucun compte sélectionné dans le wizard', textEn: 'Save blocked if no account selected in the wizard' },
        { type: 'fix',  text: 'Formulaire de contact : remplacement du placeholder "Aaron" par générique', textEn: 'Contact form: replaced "Aaron" placeholder with a generic one' },
      ],
    },
  ];

  const TAG_COLORS = {
    feat:     { bg: 'rgba(99,102,241,0.15)', color: 'var(--accent)' },
    fix:      { bg: 'rgba(250,204,21,0.12)', color: '#facc15' },
    security: { bg: 'rgba(239,68,68,0.12)',  color: 'var(--red)' },
    data:     { bg: 'rgba(34,197,94,0.12)',  color: 'var(--green)' },
    perf:     { bg: 'rgba(99,102,241,0.10)', color: 'var(--accent)' },
  };

  const TYPE_ICONS = {
    feat:     '✦',
    fix:      '⟳',
    security: '⬡',
    perf:     '⚡',
  };

  const TYPE_COLORS = {
    feat:     'var(--accent)',
    fix:      '#facc15',
    security: 'var(--red)',
    perf:     'var(--green)',
  };

  function renderChangelog() {
    const el = document.getElementById('page-changelog');
    if (!el) return;

    const isEn = i18n.getLang() === 'en';

    const tagLabels = isEn
      ? { feat: 'New', fix: 'Fix', security: 'Security', data: 'Data', perf: 'Perf' }
      : { feat: 'Nouveau', fix: 'Correctif', security: 'Sécurité', data: 'Données', perf: 'Perf' };

    const tagChip = tag => {
      const c = TAG_COLORS[tag] || TAG_COLORS.feat;
      return `<span class="cl-tag" style="background:${c.bg};color:${c.color}">${tagLabels[tag] || tag}</span>`;
    };

    const html = ENTRIES.map(e => {
      const title = isEn && e.titleEn ? e.titleEn : e.title;
      const items = e.items.map(item => {
        const text = isEn && item.textEn ? item.textEn : item.text;
        return `
          <li class="cl-item">
            <span class="cl-item-icon" style="color:${TYPE_COLORS[item.type] || 'var(--accent)'}">${TYPE_ICONS[item.type] || '·'}</span>
            <span class="cl-item-text">${text}</span>
          </li>`;
      }).join('');

      return `
        <div class="cl-entry">
          <div class="cl-entry-header">
            <div class="cl-version-row">
              <span class="cl-version">v${e.version}</span>
              <div class="cl-tags">${e.tags.map(tagChip).join('')}</div>
            </div>
            <div class="cl-date">${e.date}${e.time ? ' · ' + e.time : ''}</div>
            <div class="cl-title">${title}</div>
          </div>
          <ul class="cl-items">${items}</ul>
        </div>`;
    }).join('');

    const intro = isEn
      ? 'History of improvements, fixes and new features in ZeldTrade.'
      : 'Historique des améliorations, correctifs et nouvelles fonctionnalités de ZeldTrade.';

    el.innerHTML = `
      <div class="cl-wrapper">
        <p class="cl-intro">${intro}</p>
        <div class="cl-list">${html}</div>
      </div>`;
  }

  return { renderChangelog };
})();
