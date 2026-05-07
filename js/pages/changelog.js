// ─── CHANGELOG ────────────────────────────────────────────────────────────────
// Historique des mises à jour — affiché sur la page Mises à jour

const Changelog = (() => {

  const ENTRIES = [
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
