# ZeldTrade — Documentation projet

> **Trading journal SPA** pour traders prop firms (Apex, FTMO, Topstep, Lucid, Funding Pips).
> Stack vanilla JS + Firebase + Groq Vision. Modèle privé / recrutement manuel.

**Version actuelle** : 0.9.130 (14 mai 2026)
**Landing page (entrée publique)** : https://zeldaron.github.io/zeldtrade/
**App (login + journal)** : https://zeldaron.github.io/zeldtrade/app.html
**Admin** : zeldtradepro@gmail.com (MFA TOTP activé)
**URL prod** : https://zeldaron.github.io/zeldtrade/
**URL admin** : https://zeldaron.github.io/zeldtrade/admin.html

---

## 📚 Index de la doc

- **[README.md](README.md)** — ce fichier (overview, stack, conventions)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — architecture technique, Firebase services, flow de données
- **[FEATURES.md](FEATURES.md)** — description détaillée de chaque fonctionnalité du journal
- **[SECURITY.md](SECURITY.md)** — modèle de sécurité, rules Firestore/Storage, App Check
- **[CHANGELOG-DEV.md](CHANGELOG-DEV.md)** — journal interne des modifications (différent de `src/js/pages/changelog.js` qui est destiné aux users)

> ⚠️ **Règle d'or** : à chaque modification du code ou de l'infra, mettre à jour la doc concernée (au minimum `CHANGELOG-DEV.md`) en **ajoutant** une entrée datée. Ne **jamais écraser** l'historique.

---

## 🎯 Vision produit

ZeldTrade est un journal de trading destiné aux traders qui passent par des **prop firms** (capital mis à disposition par une société tiers en échange d'une part des profits). Différenciateurs clés :

1. **Spécialisé prop firms** : règles Apex (trailing EOD), FTMO (static drawdown), Topstep, Lucid, Funding Pips. Calculs de drawdown, safety net, daily loss limit, max contracts intégrés.
2. **IA d'analyse de chart** : capture TradingView en Ctrl+V → Groq Vision extrait entry/SL/TP automatiquement.
3. **Calculs précis** : POINT_VALUES pour micro-futures CME (MES, MNQ, MGC, MCL…), futures classiques (ES, NQ, GC, CL, ZN), CFD MT4/MT5 (US30, XAUUSD, EURUSD…).
4. **Multi-comptes** : un trader peut gérer plusieurs comptes prop firms (Apex 50k + FTMO 100k + Funding Pips 25k…) avec stats séparées.
5. **Groupes** : pour les traders qui répliquent le même trade sur plusieurs comptes (1 trade saisi → N copies).

## 🛠️ Stack technique

### Frontend
- **HTML5 / CSS3 / JavaScript vanilla** (pas de framework)
- Pattern **IIFE modules** : `Calc`, `Store`, `UI`, `Modal`, `Auth`, `i18n`, etc.
- **Chart.js 4.4** pour les graphiques (équité, P&L)
- **Firebase SDK 9.23 compat** (chargé via CDN gstatic avec SRI)

### Backend
- **Firebase Authentication** (Email/Password uniquement)
- **Cloud Firestore** (region `europe-west1`) — données utilisateurs structurées
- **Cloud Functions Gen 2** (region `europe-west1`, Node.js 20) — backend logique
- **Cloud Storage** (region `europe-west1`) — screenshots des trades
- **Firebase App Check** (reCAPTCHA Enterprise, **actuellement désactivé** côté client — cf SECURITY.md)
- **Secret Manager** — clés API (Groq, Web3Forms, Stripe)

### Services tiers
- **Groq Vision API** (Llama 4 Maverick/Scout) — analyse de chart, via Cloud Function
- **Web3Forms** — emails (formulaire contact, notification signup) — **à migrer Discord webhooks**
- **hCaptcha** — anti-bot sur formulaire contact
- **Stripe** — paiements (backend prêt, **pas encore configuré**)
- **Frankfurter API** — conversion devises (taux EUR/USD pour le calcul micro-BNC)

### Déploiement
- **Site** : GitHub Pages (`zeldaron.github.io/zeldtrade`) via `scripts/release.sh vX.Y.Z`
- **Cloud Functions + Rules** : `firebase deploy --only functions,firestore:rules,storage:rules`

## 📂 Structure du repo

```
JTRADE/
├── src/                          # site déployé sur GitHub Pages
│   ├── index.html                # landing page publique (homepage marketing — v0.9.113)
│   ├── app.html                  # app principale SPA (login + journal) — accès via /app.html
│   ├── admin.html                # console admin (page séparée)
│   ├── payment.html              # placeholder (Stripe stealth)
│   ├── legal.html, cgu.html, privacy.html  # mentions légales
│   ├── css/style.css
│   └── js/
│       ├── firebase.js           # init SDK Firebase
│       ├── app-bootstrap.js      # bootstrap + cookie banner + frame buster
│       ├── auth.js               # signin/signup/logout/deleteAccount
│       ├── store.js              # state global, CRUD trades/comptes/groupes
│       ├── calc.js               # toutes les formules (R:R, P&L, partial, trailing)
│       ├── modal.js              # wizard trade (3 étapes)
│       ├── ui.js                 # journal, détail trade, lightbox, stats
│       ├── app.js                # routing pages
│       ├── i18n.js               # traductions FR/EN
│       ├── contact.js            # formulaire contact
│       ├── admin.js              # console admin
│       ├── payment.js            # placeholder
│       └── pages/                # renderers de chaque page
│           ├── dashboard.js
│           ├── analytics.js
│           ├── calendar.js
│           ├── goals.js
│           ├── outils.js
│           ├── micro.js          # calcul fiscal micro-entrepreneur
│           ├── offers.js         # activation Pro
│           ├── settings.js
│           └── changelog.js      # journal versions (USER, pas dev)
├── functions/
│   ├── index.js                  # toutes les Cloud Functions
│   └── package.json              # firebase-functions ^4.6, stripe ^16
├── firestore.rules               # règles Firestore
├── storage.rules                 # règles Firebase Storage
├── firebase.json                 # config déploiement
├── scripts/
│   └── release.sh                # déploie sur GitHub Pages
├── test/
│   └── calc.test.js              # 103 tests unitaires pour calc.js
└── docs/                         # ⬅ TU ES ICI
    ├── README.md
    ├── ARCHITECTURE.md
    ├── FEATURES.md
    ├── SECURITY.md
    └── CHANGELOG-DEV.md
```

## 🚀 Démarrage rapide

### Développement local
```bash
# pas de build step — ouvre directement src/index.html en local
# OU sert via un serveur statique :
cd src && python3 -m http.server 8080
# puis http://localhost:8080
```

> ⚠️ Note : pour appeler les Cloud Functions depuis localhost, il faut ré-ajouter `'http://localhost:8080'` dans `ALLOWED_ORIGINS` de `functions/index.js`. Actuellement retiré en prod.

### Déploiement
```bash
# Site (front)
bash scripts/release.sh v0.9.X

# Cloud Functions + rules
firebase deploy --only functions,firestore:rules,storage:rules

# Une seule CF
firebase deploy --only functions:nomDeLaFonction
```

### Tests
```bash
node test/calc.test.js   # 103 scenarios — doivent tous passer
```

## 🎨 Conventions code

- **Pas de framework** — vanilla JS, IIFE modules retournant un objet
- **escHtml** : toujours échapper le contenu user-controlled avant innerHTML
- **Sanitize au stockage** : `_sanitizeTrade`, `_sanitizeAccount` (fail-safe)
- **Cache-busting** : tout script chargé via `?v=X.Y.Z` (synchronisé avec la version)
- **Commit messages** : `chore: release vX.Y.Z` pour les releases
- **Versioning** : SemVer-like `0.9.X` (incrément patch par feature/fix, pas de minor/major pour l'instant)
