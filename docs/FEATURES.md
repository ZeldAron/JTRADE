# Fonctionnalités ZeldTrade

> Description détaillée de chaque fonctionnalité utilisateur. Référence pour comprendre le UX, les règles métier et les fichiers impliqués.

---

## 📑 Index des pages

| Page | Slug | Renderer | Description |
|---|---|---|---|
| **Journal** | `journal` | `ui.js` | Page principale : liste des trades + panel détail. C'est la "home" du user. |
| **Dashboard** | `dashboard` | `pages/dashboard.js` | Vue d'ensemble : stats du jour, equity curve, trades récents. |
| **Analytics** | `analytics` | `pages/analytics.js` | Stats avancées : winrate, P&L cumulé, breakdown par instrument, par setup. |
| **Calendar** | `calendar` | `pages/calendar.js` | Vue calendrier mensuel avec couleur par jour selon P&L. |
| **Goals** | `goals` | `pages/goals.js` | Objectifs perso (P&L mensuel, nombre trades, etc.). |
| **Outils** | `outils` | `pages/outils.js` | Calculateurs (position size, R:R simulator, conversion ticks/points/USD). |
| **Micro** | `micro` | `pages/micro.js` | Calculateur fiscal micro-entrepreneur (BNC/BIC, cotisations URSSAF). |
| **Offers** | `offers` | `pages/offers.js` | Activation Pro via code. |
| **Tutorial** | `tutorial` | (page statique) | Aide / démo. |
| **Settings** | `settings` | `pages/settings.js` | Configuration : comptes, spreads, groupes, import/export, suppression compte. |
| **Changelog** | `changelog` | `pages/changelog.js` | Historique des versions visibles aux users. |
| **Admin** | (`/admin.html`) | `admin.js` | Console admin séparée (URL différente). |

---

## 1. Journal — Liste des trades

**Fichier** : `src/js/ui.js` (renderList + renderDetail)

### UX
- Liste à gauche (mobile : full screen), détail à droite (mobile : full screen sur sélection)
- Filtres : `all`, `win`, `loss`, `be`, `open`, `dashFilter` (compte ou groupe spécifique)
- Recherche par instrument, setup, notes (input dans la nav)
- Click sur un trade → panel détail avec :
  - Métriques (R:R, risk, reward, P&L)
  - Niveaux (Entry, SL, TP1/2/3, Exit)
  - Apex risk bar (vert/jaune/rouge selon %)
  - Info card (compte, setup, notes, **partial close**)
  - **Screenshot** (depuis Firebase Storage, async load)
  - Boutons "Modifier" et "Supprimer"

### Cas spéciaux affichés
- **Partial close** : ligne dans l'info card "Partial close: 50% à 6810.00" + tag (purple)
- **manualPnl override** : affichage "(ignoré — P&L manuel)" si partial+manualPnl coexistent
- **Estimated** : P&L calculé estimatif (pas de exitPrice → potential TP1)
- **Screenshot lightbox** : click sur l'image → ouvre plein écran (DOM API, pas innerHTML)

---

## 2. Wizard de création/édition de trade

**Fichier** : `src/js/modal.js` + UI dans `index.html` (wp1, wp2, wp3)

### Étape 1 — Direction
- Boutons LONG (vert) / SHORT (rouge)

### Étape 2 — Capture chart + analyse IA
- Drop zone : drag&drop, file picker, Ctrl+V
- Validation magic bytes (PNG/JPEG/WebP/GIF) anti MIME-spoofing
- Champ texte hint optionnel ("Entry 6804.5 SL 6808.5 TP 6795 60 lots")
- Appel Cloud Function `analyzeChart` → essaie 4 modèles Llama Vision
- Quota : **1 analyse/jour Basic**, **200/jour Pro** (transaction atomique côté serveur)
- Si IA fail → fallback parseTextHint sur le champ texte
- Au succès → step 3 pré-rempli

### Étape 3 — Détails + calcul live
- Compte (apex select avec préfixe groupe `grp:`)
- Instrument (whitelist par firm dans `populateInstrumentSelect`)
- Contracts (lots fractionnaires CFD)
- Date + heure (locale, default = now)
- Entry / SL / TP1 / TP2 / TP3
- Setup (texte libre)
- Notes (textarea)
- Résultat (open/win/loss/be) + exitPrice si fermé
- **P&L net réel ($)** — override le calcul
- **Sortie partielle (scale-out)** — NOUVEAU v0.9.101
  - Toggle : 2 champs (% pris, prix partial)
  - Borné 1-99%
- **Screenshot du trade** — NOUVEAU v0.9.98
  - Ctrl+V ou drag&drop ou file picker
  - Compression auto JPEG max 1920×1080
  - Stocké à vie dans Firebase Storage
- Bouton "Enregistrer" :
  - **Mode création** : génère un `pendingTradeId` à l'open → upload screenshot avec cet ID → `addTrade({...data, id})` → CF déclenche pas
  - **Mode édition** : `updateTrade(id, data)`, upload screenshot si remplacé, delete ancien si remplacé/supprimé
- Recalcul live (R:R, risk, reward, P&L) à chaque input change (`wRecalc`)

### Cas groupe
- Si `apex` commence par `grp:` → boucle sur `grp.accountIds` → crée N trades indépendants (un par compte), pas de screenshot
- Tous taggués avec `groupId` pour ré-association

---

## 3. Dashboard

**Fichier** : `src/js/pages/dashboard.js`

### Sections
1. **Stats du jour** : P&L jour, # trades, winrate jour
2. **Equity curve** : Chart.js line chart du P&L cumulé sur les 30/90/365 derniers jours
3. **Risk usage** : barre Apex (% utilisé sur le drawdown)
4. **Trades récents** : table des 8 derniers trades fermés
5. **Trailing floor** (Apex/Topstep/Lucid/FTMO 1-Step) :
   - Plancher trailing (HWM - drawdown)
   - Distance jusqu'au plancher
   - Safety net atteint ? (drawdown gelé au capital initial)

### Cas FTMO 2-Step / Funding Pips
- Static drawdown : pas de trailing, plancher = capital - maxDrawdown figé

---

## 4. Analytics

**Fichier** : `src/js/pages/analytics.js`

### Métriques
- Winrate global / breakdown par mois
- P&L total, moyen par trade
- Best/worst trade
- Equity curve interactive (Chart.js)
- Breakdown par instrument (P&L, # trades, winrate)
- Breakdown par setup
- Distribution R:R (histogramme)

### Filtres
- Période (jour/semaine/mois/3mois/tout)
- Compte (select dans la nav `dashFilter`)
- Groupe

---

## 5. Calendar

**Fichier** : `src/js/pages/calendar.js`

### Affichage
- Grille mensuelle (lun-dim)
- Couleur de fond par jour selon P&L net :
  - Vert clair → fort positif
  - Vert → positif
  - Gris → neutre
  - Rouge → négatif
  - Rouge foncé → fort négatif
- Click sur un jour → drawer avec la liste des trades du jour
- Nav mois précédent / suivant

---

## 6. Goals

**Fichier** : `src/js/pages/goals.js`

### Objectifs supportés
- Profit mensuel cible
- Nombre de trades par mois
- Winrate cible
- Streaks (consecutive wins, etc.)

Barres de progression vers chaque objectif. Pas de persistance avancée — les objectifs sont locaux (settings).

---

## 7. Outils

**Fichier** : `src/js/pages/outils.js`

### Calculateurs intégrés
1. **Position sizing** : capital + risk% + entry/SL → nombre de contracts
2. **R:R simulator** : entry + SL + TP → R:R + risk/reward USD
3. **Tick converter** : ticks ↔ points ↔ USD selon l'instrument
4. **Compounding** : capital initial + P&L cible mensuel → projection N mois

---

## 8. Micro-entrepreneur

**Fichier** : `src/js/pages/micro.js`

Calculateur fiscal pour micro-entrepreneur FR. Régimes :
- **BNC libéral** (24.6% cotisations, abattement 34%) — défaut admin
- **BIC services** (21.2%, abattement 50%)
- **BIC vente** (12.3%, abattement 71%)

Calcule :
- Cotisations URSSAF
- Impôt sur le revenu (calcul approximatif basé sur revenu net)
- Net après tout

> Note : déclaratif uniquement, pas de connexion URSSAF.

---

## 9. Offers — Activation Pro

**Fichier** : `src/js/pages/offers.js`

### Flow
1. User clique "Activer Pro"
2. Saisit le code (format `ZELD-XXXX-YYYY-ZZZZ`)
3. `Store.activatePro(code)` :
   - Normalise (uppercase, retire `-` et espaces)
   - SHA-256 du code
   - Lit `proCodeHashes/{hash}` (rules permettent si owner du code)
   - Vérifie `data.uid === currentUid` (constant-time comparison)
   - Si OK : écrit `users/{uid}/data/plan = { plan: 'pro', activatedAt, codeHash }`
4. UI bascule en mode Pro (sidebar badge, quota IA débloqué, multi-comptes débloqué)

### Garde-fous
- 3 tentatives échouées → throttle 60s
- Lock anti-double-clic (`_proInFlight`)
- Constant-time uid comparison (anti-timing)

### Bêta testeurs
Les "Founding Members" reçoivent leur code Pro **manuellement** via la console admin → bouton "Générer code". Gratuit, à vie.

---

## 10. Settings

**Fichier** : `src/js/pages/settings.js`

Page la plus dense. Sections :

### Comptes (myAccounts)
- Liste + CRUD complet
- Limite 1 si Basic, 100 si Pro
- Champs : nom, firm (apex/topstep/ftmo/ftmo1step/lucid/fpips), status (eval/funded), capital, profitTarget, maxDrawdown, dailyLossLimit, maxContracts, feePerSide, pnlOffset
- Validation nom unique (anti-collision)

### Spreads par firm
- Tableau spreads par instrument et par firm (ex: `apex.MES1 = 0`, `ftmo.US30 = 5`)
- Validation `size() <= 6` côté rule

### Groupes (Pro only)
- Liste de comptes pour batch-trade
- Max 50 groupes, max 100 comptes par groupe

### Préférences
- Capital par défaut
- Contracts par défaut
- Instrument par défaut
- Locale FR/EN

### Import / Export
- **Export JSON** : `Store.exportJSON()` (trades seulement)
- **Export complet RGPD** : `Store.exportFullJSON()` (trades + settings + comptes + groupes + spreads + plan)
- **Import CSV** : parse + sanitize chaque trade via `_sanitizeTrade`

### Suppression de compte
- Re-auth obligatoire (firebase password)
- Supprime Firestore data + userEmails + proCodeHashes attribués + **screenshots Storage** (RGPD)
- Puis `user.delete()`

---

## 11. Changelog (user-facing)

**Fichier** : `src/js/pages/changelog.js`

Liste de toutes les versions avec titre + items typés (`feat`/`fix`/`security`/`rgpd`). Bilingue FR/EN.

> ⚠️ À ne PAS confondre avec `docs/CHANGELOG-DEV.md` qui est le journal INTERNE des modifs (pas montré aux users).

---

## 12. Admin console (`admin.html`)

**Fichier** : `src/js/admin.js` + `src/admin.html`

Page séparée. Login via Firebase Auth (email/password de `zeldtradepro@gmail.com`).

### Onglets

#### Utilisateurs
- Liste de tous les `userEmails` (lookup admin)
- Pour chaque user : email, pseudo, plan, activé le, dernière connexion
- Actions :
  - **Générer code** : modale → CF `generateProCode` (rate-limit 10/h)
  - **💳 Lien Stripe** : modale → CF `createCheckoutSession` (stealth, prix pas affichés)
  - **Supprimer** : modale avec confirmation "SUPPRIMER" → CF `deleteUserAccount`

#### Codes générés
- Liste de tous les `proCodeHashes` avec statut (actif/non utilisé)
- Action : **Révoquer** → CF `revokeProCode` (atomique)

#### Config
- Mention de la migration Groq vers Secret Manager (legacy info)

### Sécurité admin
- Anti-bruteforce login : 3 tentatives → lockout 5min (client-side, reset au refresh)
- Anti-timing attack : minDelay 1500ms uniforme login
- Frame-buster JS (anti-clickjacking redondant)

---

## 13. Contact form

**Fichier** : `src/js/contact.js`

### Flow
1. User remplit name + message + hCaptcha
2. Email = `request.auth.token.email` (forcé serveur — anti-spoofing)
3. CF `sendContactMessage` :
   - Throttle atomique 60s par uid (commit AVANT envoi, anti-race)
   - email_verified obligatoire
   - Forward à Web3Forms (clé Secret Manager)
4. Notification email à zeldtradepro@gmail.com

### À migrer
**Plan** : remplacer Web3Forms par Discord webhook (gratuit, EU). Le user a un serveur Discord déjà configuré.

---

## 14. Cookie banner

**Fichier** : `src/js/app-bootstrap.js`

Banner discret en bas. Une seule clé en localStorage : `zt_cookie_ok = true` (pas namespacée user, c'est un consent global).

Pas de cookies tiers tracking. Juste `_GRECAPTCHA` (technique anti-bot, exempté CNIL).

---

## 15. Frame buster

**Fichier** : `src/js/app-bootstrap.js` + `src/js/admin.js`

```js
if (window.top !== window.self) { window.top.location.replace(window.self.location.href); }
```

Redondant avec `frame-ancestors 'none'` + `X-Frame-Options DENY`. Defense-in-depth si quelqu'un réussit à embed la page malgré la CSP.

---

## 🆕 Features récentes (post v0.9.95)

- **v0.9.98** : Screenshots persistants Firebase Storage (zone Ctrl+V au step 3)
- **v0.9.100** : Lightbox screenshot dans le détail trade (Journal)
- **v0.9.101** : Sortie partielle (scale-out) — toggle au step 3
- **v0.9.102** : Hardening post-audit (screenshotPath cross-user, lightbox DOM API)
- **v0.9.103** : Backend Stripe stealth (admin only, prix jamais publics)
- **v0.9.104** : App Check init désactivé côté client (reCAPTCHA Enterprise cassé)
- **v0.9.105** : Admin access réparé (rules + CSP apis.google.com)
- **v0.9.106** : Stats winrate corrigé (netPnl > 0) + NaN early-return + batch writes mode groupe + magic bytes serveur + hCaptcha vérif serveur + Unicode bidi strip
- **v0.9.107** : Modale confirm custom (remplace `confirm()` natif) + cleanup orphelins admin + Dependabot
- **v0.9.108** : Wizard mémorise dernier compte + instrument (gain de temps)
- **v0.9.109** : Touch targets ≥ 44×44 px sur mobile (a11y WCAG) + inputs 16px (anti zoom iOS)
- **v0.9.110** : Pack C robustesse data (date floor 1990, garde-fou activatePro, double-escape JSON fix, race compression cancel, paste handlers unifiés, initForUser awaitable)
- **v0.9.111** : Pack A UX (dashboard empty state, compteur recherche, bouton Aujourd'hui calendrier, hint groupe wizard avec count, scroll-to-top auto)
- **v0.9.112** : Landing page v1 publique (`landing.html`) avec hero "Un journal de trading complet fait par un trader pour les traders", 6 features, pricing stealth, FAQ, footer. 100% statique, CSP ultra-stricte.
- **v0.9.113** : Landing devient la **page d'accueil principale** (`/zeldtrade/` → landing). L'app est maintenant à `/zeldtrade/app.html`. Renommage `index.html` → `app.html` + `landing.html` → `index.html`. Liens internes mis à jour.

---

## 🛠️ Features à venir / en attente

| Feature | État | Note |
|---|---|---|
| **F1** Type de trading au signup (Fonds propres / Prop firm, multi-choix) | Specs validées | User précisera UX exact avant impl |
| **F2** Crypto dans F1 | Futur | Après F1 stable |
| **F3** Export PDF des trades (Pro only) | Planifié | jsPDF + html2canvas côté client |
| ~~**F4 v1** Landing page~~ | ✅ Déployée v0.9.112 (2026-05-14) | `landing.html` — hero "fait par un trader pour les traders" |
| **F4 v2** Landing finitions | Planifié | Screenshots réels, témoignages, routing auto, logo custom |
| Discord webhooks (remplacer Web3Forms) | En attente | User a serveur Discord setup |
| Stripe activation complète | Backend prêt | User doit setup Stripe Dashboard + secrets |
| App Check réactivé | Bloqué | Diagnostic reCAPTCHA Enterprise key type |
| Migration firebase-functions v6 | À planifier | v4 EOL avril 2026 |
| Firebase Hosting (vrais headers HTTP) | À planifier | GitHub Pages limitation |
| Domaine zeldtrade.com | À planifier | Cloudflare Registrar |
