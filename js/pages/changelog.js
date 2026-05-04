// ─── CHANGELOG ────────────────────────────────────────────────────────────────
// Historique des mises à jour — affiché sur la page Mises à jour

const Changelog = (() => {

  const ENTRIES = [
    {
      version: '0.9.66',
      date: '2026-05-05',
      time: '01:45',
      tags: ['feat'],
      title: 'Page Offres restructurée — 3 paliers + code promo bêta',
      items: [
        { type: 'feat', text: '3 paliers : Gratuit, Pro (le plus populaire), Lifetime — avec liste de fonctionnalités détaillée' },
        { type: 'feat', text: 'Prix masqués pendant la bêta — affichage "🔒 Prix bientôt disponible"' },
        { type: 'feat', text: 'Section "Code bêta / Code promo" en bas de page pour activer l\'accès Pro' },
        { type: 'feat', text: 'Boutons Pro et Lifetime → page "En cours de construction" dédiée (payment.html)' },
        { type: 'feat', text: 'Tableau comparatif 3 colonnes (Gratuit / Pro / Lifetime)' },
        { type: 'feat', text: 'Toutes les chaînes de la page Offres traduites en FR et EN parfait' },
      ],
    },
    {
      version: '0.9.65',
      date: '2026-05-05',
      time: '01:12',
      tags: ['fix'],
      title: 'Traductions complètes FR/EN',
      items: [
        { type: 'fix', text: 'Dashboard : "Solde", "depuis le départ", étiquettes stats (Espérance, Meilleur, Pire, série) correctement traduites' },
        { type: 'fix', text: 'Wizard : labels P&L brut/net et Reward $ traduits selon la langue active' },
        { type: 'fix', text: 'Offres : message d\'erreur de limitation de tentatives traduit en anglais' },
      ],
    },
    {
      version: '0.9.63',
      date: '2026-05-05',
      time: '00:46',
      tags: ['fix', 'data'],
      title: 'Règles FTMO corrigées et complétées',
      items: [
        { type: 'fix',  text: 'FTMO : commissions corrigées à $2.50/côté/lot (était $3.00)' },
        { type: 'fix',  text: 'FTMO : max lots mis à jour — jusqu\'à 50 lots (était 2–10)' },
        { type: 'feat', text: 'FTMO $10K ajouté (taille manquante)' },
        { type: 'feat', text: 'FTMO 1-Step ajouté ($10K–$200K) : daily loss 3%, drawdown trailing, 90% split, 0 jours minimum' },
        { type: 'feat', text: 'Badge TRAIL dans les Réglages pour les drawdowns trailing' },
        { type: 'feat', text: 'Funding Pips et FTMO 1-Step apparaissent dans les onglets Réglages' },
      ],
    },
    {
      version: '0.9.62',
      date: '2026-05-05',
      time: '00:36',
      tags: ['feat'],
      title: 'Lots décimaux + support CFD complet',
      items: [
        { type: 'feat', text: 'Lots décimaux : entrer 0.01, 0.1, 0.5… pour toutes les props firms CFD' },
        { type: 'feat', text: 'Calculs corrects par instrument CFD (EURUSD $10/pip/lot, XAUUSD $100/lot, US30 $5/lot…)' },
        { type: 'feat', text: 'Affichage adapté : "0.10 lots" et "pts" au lieu de "contrats" et "ticks" pour les CFDs' },
        { type: 'feat', text: 'Funding Pips ajouté : presets $10K–$200K avec spreads' },
        { type: 'feat', text: 'Step auto : instrument CFD → step 0.01, instrument futures → entier' },
      ],
    },
    {
      version: '0.9.61',
      date: '2026-05-05',
      time: '00:22',
      tags: ['fix'],
      title: 'Correction version affichée',
      items: [
        { type: 'fix', text: 'La version dans Réglages → À propos était bloquée à 0.9.51 malgré les mises à jour' },
      ],
    },
    {
      version: '0.9.56–0.9.60',
      date: '2026-05-05',
      time: '00:11',
      tags: ['feat', 'fix'],
      title: 'Responsive mobile & sidebar masquable',
      items: [
        { type: 'feat', text: 'Sidebar masquable sur mobile (bouton hamburger en haut à gauche)' },
        { type: 'feat', text: 'Wizard "Nouveau trade" en plein écran sur mobile (header et navigation sticky)' },
        { type: 'feat', text: 'Journal : vue liste/détail séparée sur mobile' },
        { type: 'fix',  text: 'Tableau des trades récents (dashboard) : colonnes optimisées sur petit écran' },
        { type: 'fix',  text: 'Fermeture automatique de la sidebar au clic "Nouveau trade" sur mobile' },
        { type: 'fix',  text: 'Correction double flèche "← ← Retour" sur le bouton retour mobile' },
        { type: 'fix',  text: 'Inputs 16px minimum pour éviter le zoom automatique sur iOS' },
      ],
    },
    {
      version: '0.9.54–0.9.55',
      date: '2026-05-04',
      time: '23:43',
      tags: ['feat'],
      title: 'Calcul live sur prix de sortie + auto-fill',
      items: [
        { type: 'feat', text: 'Saisir un prix de sortie recalcule le P&L brut et net en temps réel (avec frais)' },
        { type: 'feat', text: 'P&L en rouge si sorti avant le TP (perte partielle ou totale)' },
        { type: 'feat', text: 'Résultat Win → pré-remplit automatiquement le prix de sortie avec le TP' },
        { type: 'feat', text: 'Résultat Loss → pré-remplit avec le SL' },
        { type: 'feat', text: 'Section Notes ouverte par défaut dans le wizard' },
      ],
    },
    {
      version: '0.9.39–0.9.53',
      date: '2026-05-01',
      time: '17:10',
      tags: ['security'],
      title: 'Audit sécurité complet',
      items: [
        { type: 'security', text: 'Validation côté serveur du plan Pro (règles Firestore)' },
        { type: 'security', text: 'CSP durci, protection anti-framing, headers de sécurité' },
        { type: 'security', text: 'Protection XSS sur tous les champs utilisateur' },
        { type: 'security', text: 'Protection contre la pollution de prototype (maps Object.create(null))' },
        { type: 'security', text: 'Throttle anti-spam sur les requêtes IA' },
        { type: 'security', text: 'Suppression compte : règles Firestore RGPD + nettoyage données' },
        { type: 'security', text: 'Timeout Firestore pour éviter les blocages silencieux' },
      ],
    },
    {
      version: '0.9.40',
      date: '2026-05-01',
      time: '17:26',
      tags: ['feat'],
      title: 'Console admin + codes Pro',
      items: [
        { type: 'feat', text: 'Console admin pour générer et gérer les codes d\'accès PRO par utilisateur' },
        { type: 'feat', text: 'Codes Pro individuels : chaque code ne peut être utilisé qu\'une seule fois' },
      ],
    },
    {
      version: '0.9.37–0.9.38',
      date: '2026-05-01',
      time: '16:08',
      tags: ['feat'],
      title: 'Plan Basic / Pro',
      items: [
        { type: 'feat', text: 'Différenciation Basic et Pro : analytics avancées, comptes multiples, IA Vision' },
        { type: 'feat', text: 'Presets prop firms verrouillés en Pro' },
        { type: 'feat', text: 'Badge BASIC/PRO dans la sidebar' },
        { type: 'feat', text: 'CTA "Passer Pro" dans la sidebar pour les comptes Basic' },
      ],
    },
    {
      version: '0.9.29–0.9.36',
      date: '2026-05-01',
      time: '02:45',
      tags: ['feat', 'fix'],
      title: 'Instruments par prop firm + spread wizard',
      items: [
        { type: 'feat', text: 'Liste d\'instruments filtrée par prop firm (FTMO → CFD/Forex, Apex → Futures CME…)' },
        { type: 'feat', text: 'Spread bid/ask affiché dans le wizard selon la prop firm et l\'instrument' },
        { type: 'feat', text: 'Import CSV de trades dans Réglages → Données' },
        { type: 'feat', text: 'Solde réel affiché (capital + offset P&L) dans la liste des comptes' },
        { type: 'feat', text: 'Dashboard : solde du compte affiché en grand dans les cartes' },
        { type: 'feat', text: 'Réorganisation UI : objectifs en grille, sections analytics, layout dashboard' },
        { type: 'feat', text: 'FAQ mise à jour : synchronisation Firebase, login par compte' },
        { type: 'fix',  text: 'Renommage Neutre → B/E dans tout le journal, les filtres et le wizard' },
      ],
    },
    {
      version: '0.9.24–0.9.28',
      date: '2026-04-30',
      time: '23:52',
      tags: ['feat'],
      title: 'Pilules éditables sur l\'étape 2',
      items: [
        { type: 'feat', text: 'Étape 2 du wizard : cliquer sur Entry, SL ou TP ouvre un input inline pour corriger sans revenir' },
      ],
    },
    {
      version: '0.9.15–0.9.26',
      date: '2026-04-30',
      time: '23:04',
      tags: ['feat', 'fix'],
      title: 'IA Vision Groq + Tutorial + Landing Pro',
      items: [
        { type: 'feat', text: 'IA Vision (PRO) : analyse automatique de screenshots de trades via Groq' },
        { type: 'feat', text: 'Prompt Groq amélioré : lecture des zones colorées de prix sur l\'axe droit' },
        { type: 'fix',  text: 'Fallback de modèle Groq si un modèle est indisponible' },
        { type: 'feat', text: 'QO1 (Mini Gold) ajouté aux instruments futures' },
        { type: 'feat', text: 'Page Tutorial complète en 5 étapes (comptes, trades, IA, analytics, conseils)' },
        { type: 'feat', text: 'Bouton PRO sur la landing : connexion puis redirection vers Offres' },
      ],
    },
    {
      version: '0.9.9–0.9.14',
      date: '2026-04-30',
      time: '20:54',
      tags: ['feat', 'fix'],
      title: 'Wizard — blocages et validations',
      items: [
        { type: 'feat', text: 'Blocage du wizard si aucun compte configuré : toast d\'erreur' },
        { type: 'feat', text: 'Blocage de la sauvegarde si aucun compte sélectionné dans le wizard' },
        { type: 'fix',  text: 'Formulaire de contact : remplacement du placeholder "Aaron" par générique' },
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

    const tagChip = (tag) => {
      const c = TAG_COLORS[tag] || TAG_COLORS.feat;
      const labels = { feat: 'Nouveau', fix: 'Correctif', security: 'Sécurité', data: 'Données', perf: 'Perf' };
      return `<span class="cl-tag" style="background:${c.bg};color:${c.color}">${labels[tag] || tag}</span>`;
    };

    const html = ENTRIES.map(e => `
      <div class="cl-entry">
        <div class="cl-entry-header">
          <div class="cl-version-row">
            <span class="cl-version">v${e.version}</span>
            <div class="cl-tags">${e.tags.map(tagChip).join('')}</div>
          </div>
          <div class="cl-date">${e.date}${e.time ? ' · ' + e.time : ''}</div>
          <div class="cl-title">${e.title}</div>
        </div>
        <ul class="cl-items">
          ${e.items.map(item => `
            <li class="cl-item">
              <span class="cl-item-icon" style="color:${TYPE_COLORS[item.type] || 'var(--accent)'}">${TYPE_ICONS[item.type] || '·'}</span>
              <span class="cl-item-text">${item.text}</span>
            </li>`).join('')}
        </ul>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title" data-i18n="page.changelog">Mises à jour</div>
      </div>
      <div class="cl-wrapper">
        <p class="cl-intro">Historique des améliorations, correctifs et nouvelles fonctionnalités de ZeldTrade.</p>
        <div class="cl-list">${html}</div>
      </div>`;
  }

  return { renderChangelog };
})();
