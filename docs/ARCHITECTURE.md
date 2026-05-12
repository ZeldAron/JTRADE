# Architecture technique ZeldTrade

> Détails techniques des services, du flow de données et des dépendances entre modules.

---

## 🏛️ Vue d'ensemble

```
                  ┌──────────────────────┐
                  │  Browser (client)    │
                  │  zeldaron.github.io  │
                  └──────────┬───────────┘
                             │ HTTPS
        ┌────────────────────┼────────────────────────┐
        │                    │                        │
        ▼                    ▼                        ▼
┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│ Firebase Auth │   │   Firestore    │   │ Cloud Functions  │
│ (Email/Pwd)   │   │  (europe-west1)│   │  (europe-west1)  │
└───────────────┘   └────────────────┘   └────────┬─────────┘
                                                  │
                            ┌─────────────────────┼──────────────────┐
                            ▼                     ▼                  ▼
                    ┌──────────────┐    ┌──────────────────┐  ┌──────────────┐
                    │ Cloud Storage│    │   Groq Vision    │  │  Web3Forms   │
                    │  (screenshots│    │  (analyse chart) │  │ (email admin)│
                    │   europe-w1) │    │       (US)       │  │     (US)     │
                    └──────────────┘    └──────────────────┘  └──────────────┘
```

## 🗄️ Modèle de données Firestore

### Collections racines

| Collection | Visibilité | Description |
|---|---|---|
| `userEmails/{uid}` | owner + admin | Profil minimal (email, username, lastSeen). Sert au lookup admin. |
| `proCodeHashes/{hash}` | owner (du code) + admin | Codes Pro générés par admin (SHA-256 du code). `consumedBy?: uid` quand activé. |
| `auditLogs/{id}` | admin only (read), CF only (write) | Trace de toutes les actions admin sensibles (deleteUser, revokeCode, generateCode…). |
| `deletedUsers/{uid}` | admin only | Soft-delete archive (data + userEmail) gardée 30j avant purge cron. |
| `adminRateLimit/{action}` | admin only | Compteur de rate-limit par action (ex: 10 codes/h max). |
| `users/{uid}/data/{doc}` | owner only (+ admin selon doc) | **Voir ci-dessous.** |

### `users/{uid}/data/`

Chaque utilisateur a une sous-collection `data/` avec des docs nommés :

| Doc | Schema | Notes |
|---|---|---|
| `trades` | `{ items: Trade[] }` | Liste des trades (max 10 000). Voir schéma Trade ci-dessous. |
| `settings` | `{ capital, contracts, instrument }` | Préférences défaut du wizard. |
| `myAccounts` | `{ items: Account[] }` | Comptes prop firms du user. Max 1 si Basic, 100 si Pro. |
| `groups` | `{ items: Group[] }` | Groupes de comptes pour batch-trade. Max 50, Pro only. |
| `spreadsByFirm` | `{ apex: {...}, ftmo: {...}, topstep: {...}, ftmo1step, lucid, fpips }` | Spreads par instrument et par firm. |
| `plan` | `{ plan: 'basic'\|'pro', activatedAt, codeHash?, source?, tier?, ... }` | Plan actuel. Écrit par activation code (client) OU par webhook Stripe (server). |
| `stripe` | `{ customerId, subscriptionId, tier, currentPeriodEnd, ... }` | Infos abonnement Stripe (écrit par webhook). Read-only client. |
| `aiUsage` | `{ date: 'YYYY-MM-DD', count }` | Quota analyses IA quotidiennes (1 Basic, 200 Pro). Écrit par CF analyzeChart en transaction atomique. |
| `contactThrottle` | `{ lastSentAt }` | Rate-limit contact form (60s). Écrit par CF sendContactMessage. |
| `signupNotified` | `{ at }` | Flag idempotent pour notifyNewSignup (anti double envoi). |

### Schéma `Trade`

```js
{
  id:            String,           // 'XXXX-YYYYYY' (timestamp36 + 6chars random)
  instrument:    String,           // 'MES1', 'XAUUSD', etc. (whitelist 20 chars max)
  direction:     'long' | 'short',
  outcome:       'open' | 'win' | 'loss' | 'be',
  contracts:     Number,           // 0.01 → 999
  setup:         String,           // texte libre 500 chars, escape HTML au stockage
  notes:         String,           // texte libre 2000 chars, escape HTML
  apex:          String,           // nom du compte associé (ou 'grp:groupId')
  date:          String,           // ISO 8601
  entry, sl, tp1, tp2, tp3:  Number, // -1e7 → 1e7
  exitPrice:     Number | null,
  manualPnl:     Number | null,    // override le calcul P&L (clos uniquement)
  capital:       Number,           // snapshot capital au moment du trade
  feePerSide:    Number,           // 0 → 100 — snapshot fees au moment du trade
  spreadCost:    Number,           // 0 → 1000 — snapshot spread au moment du trade
  pnl, rr:       Number | null,    // pré-calculé (réutilisé par stats)
  groupId?:      String,           // si trade fait partie d'un groupe
  screenshotPath?: String,         // path Storage (validé strict via _uid)
  partialPercent?: Number,         // 1-99
  partialPrice?: Number,
}
```

### Schéma `Account`

```js
{
  id:              'acc-{timestamp}-{rand}',
  name:            String,        // unique (whitelist alphanumeric + . _ - espace)
  firmKey:         String,        // 'apex' | 'topstep' | 'ftmo' | 'ftmo1step' | 'lucid' | 'fpips'
  status:          'evaluation' | 'funded',
  capital:         Number,
  profitTarget:    Number,
  maxDrawdown:     Number,
  dailyLossLimit:  Number,
  maxContracts:    Number,
  feePerSide:      Number,
  pnlOffset:       Number,        // payouts déjà retirés
}
```

### Schéma `Group`

```js
{
  id:          'grp-{timestamp}-{rand}',
  name:        String,
  accountIds:  String[],          // max 100 IDs (regex-validés)
}
```

## ☁️ Cloud Functions

Toutes en `europe-west1`, Node.js 20, Gen 2. Voir `functions/index.js`.

| Function | Type | Auth | Purpose |
|---|---|---|---|
| `analyzeChart` | `onCall` | user auth | Proxy Groq Vision (screenshot → entry/SL/TP). Quota côté serveur en transaction atomique. |
| `sendContactMessage` | `onCall` | user auth + email_verified | Forwarde formulaire contact vers Web3Forms (clé serveur). Throttle 60s atomique. |
| `notifyNewSignup` | `onCall` | user auth (fresh signup) | Notifie admin par email Web3Forms. Flag idempotent anti-double. |
| `deleteUserAccount` | `onCall` | **admin only** | Supprime user complet (Auth + Firestore + Storage + proCodeHashes). Soft-delete vers `deletedUsers/` 30j. |
| `generateProCode` | `onCall` | **admin only** | Génère code Pro avec rate-limit 10/h + cap 5 codes actifs/user. Audit log. |
| `revokeProCode` | `onCall` | **admin only** | Révocation atomique : delete code + delete plan + tronque myAccounts si downgrade. |
| `createCheckoutSession` | `onCall` | **admin only** | (Stripe) génère lien checkout perso pour un user. **Stealth pricing** : prix jamais dans le code client. |
| `stripeWebhook` | `onRequest` | Stripe signature | Reçoit events Stripe (subscription.created/updated/deleted) → met à jour `users/{uid}/data/plan`. |

### Patterns CFs

- **Validation stricte** : regex sur tous les paramètres (uid, codeHash, email, tier…)
- **Audit log "in_progress" AVANT** les actions destructives (traçabilité même si crash mi-chemin)
- **`Promise.allSettled`** au lieu de `Promise.all` pour les cleanups partiels (collecte erreurs sans tout casser)
- **Admin email check** : `request.auth.token.email === ADMIN_EMAIL` (le `email_verified` est temporairement retiré, cf SECURITY.md)
- **maxInstances** plafonné (anti-DoS budget)

## 🗃️ Cloud Storage

### Structure
```
gs://zeldtrade.firebasestorage.app/
└── users/{uid}/
    └── trades/{tradeId}/
        └── screenshot.jpg     # max 2 MB, JPEG compressé client-side
```

### Rules (`storage.rules`)

- `read` + `write` : owner only
- `write` : taille < 2 MB, content-type whitelist (jpeg/png/webp)
- `delete` : owner only
- default deny global

### Cycle de vie d'un screenshot

1. User fait Ctrl+V dans le wizard step 3 → blob image dans clipboardData
2. `modal.js` valide les magic bytes (anti MIME-spoofing)
3. Compression canvas → JPEG 0.85 quality, max 1920×1080, retry quality 0.4 si > 2 MB
4. Stocké en mémoire (`shotBlob`) — pas encore uploadé
5. Au save trade : `Store.uploadTradeScreenshot(tradeId, blob)` → Storage
6. Le path est stocké dans `trade.screenshotPath`
7. Cycle de vie :
   - **Édition** : `Store.getTradeScreenshotUrl(path)` → lightbox via DOM API
   - **Suppression trade** : `Store.deleteTradeScreenshot(path)` fire-and-forget
   - **Suppression user (admin)** : Cloud Function `deleteUserAccount` boucle sur `users/${uid}/` du bucket et supprime tout
   - **Self-delete user** : `auth.js` itère sur `trades.filter(t => t.screenshotPath)` et delete avant `user.delete()`

## 🔐 Auth flow

```
┌────────────┐                       ┌────────────────────┐
│  Browser   │                       │ Firebase Identity  │
│            │  signInWithPassword   │   Toolkit (US)     │
│  auth.js   │ ───────────────────▶  │                    │
│            │  ◀─── idToken JWT ─── │                    │
└────────────┘                       └────────────────────┘
      │
      │ onAuthStateChanged
      ▼
┌────────────┐                       ┌────────────────────┐
│ Store.init │ ─── lecture data ───▶ │ Firestore rules    │
│ ForUser    │   (rules vérifient    │  request.auth.uid  │
│            │    uid == userId)     │     == userId      │
└────────────┘                       └────────────────────┘
```

### Admin

- Email hardcodé : `zeldtradepro@gmail.com` (rules + CFs)
- MFA : TOTP sur le compte **Gmail** (pas sur Firebase Auth lui-même)
- Pour activer/désactiver admin : Firebase Console → Auth → manage user

## 📡 Flow d'une analyse IA

```
1. User Ctrl+V image → wizard step 2
2. modal.js : magic bytes check + base64 encode
3. Cloud Function analyzeChart :
   ├─ Validate prompt (whitelist model, max 2000 chars, base64 regex)
   ├─ Transaction Firestore : aiUsage.count++ (atomique, cap 1/jour Basic, 200 Pro)
   ├─ fetch https://api.groq.com/openai/v1/chat/completions (avec clé Secret Manager)
   ├─ Si Groq fail → rollback transaction (pas de quota perdu)
   └─ Return { choices: [...] } (trim metadata)
4. modal.js parse le JSON renvoyé → extrait entry/SL/TP
5. Pré-remplit le step 3
```

## 🎯 État global (Store)

`Store` est un IIFE qui maintient en RAM :
- `_uid` (courant)
- `_plan`, `_aiUsage` (chargés depuis Firestore au login)
- `trades`, `settings`, `myAccounts`, `groups`, `spreads`, `spreadsByFirm`, `accountTypes`

### Persistance

```
                Action user (addTrade, updateAccount, etc.)
                              │
                              ▼
                     Store._saveTrades()
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
        localStorage (instant)    Firestore.set() (async)
        ztrade_{uid}_trades       users/{uid}/data/trades
        (cache local)             (source de vérité)
```

### Anti-corruption

Au load Firestore, si `remote.items.length < local.length × 0.5` (sur >10 trades), on **n'écrase PAS** le local et on dispatch `store:syncConflict` (utile pour debug sync cassée). Cf. `_loadFromFirestore` dans `store.js`.

### Purge cross-user

`Store.purgeForeignCache()` est appelé à `initForUser()` : supprime toutes les clés `ztrade_*` du localStorage qui ne correspondent pas au `_uid` courant. Protège les données sur device partagé.

## 📨 Events DOM custom

Le code dispatch des events sur `window` pour découpler les modules :

| Event | Émetteur | Listeners | Usage |
|---|---|---|---|
| `store:planChanged` | Store (activation Pro, downgrade) | UI (update sidebar, badge) | Re-render UI quand le plan change |
| `store:saveFailed` | Store.fbSet (catch Firestore write error) | UI (toast erreur) | Notifie le user d'un échec sync |
| `store:syncConflict` | Store._loadFromFirestore (anti-corruption) | UI (modal warning, à faire) | Conflit sync remote vs local |

## 🌐 i18n

`i18n.js` contient toutes les strings traduites (FR + EN). Pattern : `i18n.t('clé', { params })`. Locale par défaut : FR. Switch via `Settings`.

## 🧪 Tests

`test/calc.test.js` — 103 scenarios couvrant :
- Tous les POINT_VALUES (futures, CFD, forex)
- R:R, riskUSD, rewardUSD, riskPct
- Fees + spreads
- BE/Win/Loss/Open
- ExitPrice override
- manualPnl override
- Partial close (3 variantes)
- Apex risk checks (apexOk/apexWarn)
- Trailing floor (Apex EOD + FTMO static)

Exécution : `node test/calc.test.js`. **À relancer avant chaque release** si calc.js modifié.
