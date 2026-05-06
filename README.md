# ZeldTrade

Journal de trading pour traders en prop firm (Apex, Topstep, FTMO, Lucid).
Application web déployée sur GitHub Pages — données synchronisées dans le cloud via Firebase.

🌐 **Live** : https://zeldaron.github.io/zeldtrade

## Fonctionnalités

- **Journal** — saisie de trades avec screenshot TradingView, détection IA des niveaux (Groq Vision)
- **Dashboard** — courbe equity, max DD, profit factor, série en cours
- **Analytics** — win rate, P&L par instrument, performance par session/heure
- **Objectifs** — suivi des règles prop firm (drawdown, daily loss, consistency)
- **Calendrier** — vue mensuelle avec P&L journalier
- **Outils** — calculatrice de position (23 instruments) + simulateur fiscal micro-entrepreneur (BNC, BIC)
- **Bilingue** — FR / EN

## Stack

- **Frontend** : HTML · CSS · JavaScript vanilla (pas de bundler)
- **Backend** : Firebase (Auth + Firestore)
- **IA** : Groq Vision API (analyse des screenshots)
- **Hébergement** : GitHub Pages (branche `gh-pages`)

## Structure

```
JTRADE/
├── src/              # Code source de l'app (déployé sur gh-pages)
│   ├── index.html
│   ├── admin.html
│   ├── payment.html, cgu.html, legal.html, privacy.html
│   ├── css/style.css
│   └── js/
│       ├── pages/    # Vue par page (dashboard, analytics, ...)
│       ├── firebase.js, auth.js, store.js
│       └── i18n.js, calc.js, modal.js, ui.js, app.js
├── scripts/release.sh   # Déploiement vers GitHub Pages
├── firestore.rules      # Règles de sécurité Firestore
└── .github/             # GitHub Actions
```

## Déploiement

```bash
./scripts/release.sh v0.9.71
```

Le script :
1. Crée le tag git si absent
2. Auto-commit `src/` si modifications en cours
3. Push `src/` vers la branche `gh-pages` via `git subtree split`

## Versioning

Pattern à respecter pour chaque release :
1. Ajouter une entrée en tête de `ENTRIES` dans `src/js/pages/changelog.js`
2. Bumper tous les `?v=X.Y.Z` dans `src/index.html` + le texte affiché
3. `./scripts/release.sh vX.Y.Z`
