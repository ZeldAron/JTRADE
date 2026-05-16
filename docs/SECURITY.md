# Sécurité ZeldTrade

> Modèle de menace, défenses en place, exceptions temporaires, et plan d'amélioration.
> **Dernière refonte : 2026-05-16 (v0.9.171)** — post-audit complet 4 surfaces.

---

## 🎯 Modèle de menace

Vu le **modèle privé / recrutement manuel**, les menaces principales sont :

1. **🔴 Compromission du compte admin** (`zeldtradepro@gmail.com`) — accès total
2. **🔴 Insider threat** — un user recruté qui devient malveillant
3. **🟡 Fuite de données utilisateurs** — RGPD (P&L, capital, stratégies)
4. **🟡 DoS financier** — quelqu'un fait exploser Groq/Firestore bills
5. **🟢 Spam/abuse public** — peu critique car signup quasi-fermé
6. **🟢 Hack massif** — peu probable car attack surface réduite

---

## ✅ Défenses en place

### Authentification

| Défense | Statut | Notes |
|---|---|---|
| Email/Password Firebase Auth | ✅ Actif | Hashing géré par Firebase |
| MFA Gmail (TOTP) sur compte admin | ✅ Actif | Protège le compte Google donc Firebase Console |
| Backup codes Gmail imprimés | ⚠️ À vérifier | Crucial si perte du téléphone |
| MFA Firebase Auth admin | ❌ Désactivé | Distinct du MFA Gmail. À activer plus tard. |
| `email_verified` obligatoire sur CFs sensibles | ✅ | analyzeChart, sendContactMessage, toutes les CFs admin |
| Lockout admin login (3 tentatives / 5 min) | ✅ | Client-side, `auth.js` |
| Min-delay 1500ms uniforme admin login | ✅ | Anti timing-attack |

### Autorisation

| Défense | Statut | Notes |
|---|---|---|
| Firestore rules default-deny | ✅ | `match /{document=**} { allow read, write: if false; }` |
| Per-collection whitelist `hasOnly([...])` | ✅ | Sur chaque write |
| Validation types + ranges | ✅ | `is int`, `> 1700000000000`, etc. |
| Storage rules owner-only | ✅ | Path : `users/{userId}/trades/{tradeId}/{filename}` |
| Storage : taille < 2 MB | ✅ | `request.resource.size < 2 * 1024 * 1024` |
| Storage : content-type whitelist | ✅ | jpeg/png/webp uniquement |
| CORS Storage strict prod | ✅ | v0.9.171 — localhost retiré, 5 origines de prod uniquement |
| `isAdmin()` check + `email_verified` | ✅ | Helper rules + helper CFs |
| `_assertAdmin()` avec re-auth récente | ✅ | v0.9.171 — session < 60 min requise pour toutes CFs destructives |

### Anti-injection

| Défense | Statut | Notes |
|---|---|---|
| `_sanitizeTrade` whitelist strict | ✅ | Regex par champ, escape HTML setup/notes au stockage (fail-safe) |
| `_sanitizeAccount` whitelist | ✅ | Strict spread (anti champ injecté via DevTools) |
| `_sanitizeGroupData` whitelist | ✅ | Idem |
| CSP `script-src` sans `unsafe-inline/eval` | ✅ | Server-side via `firebase.json` |
| CSP `frame-ancestors 'none'` | ✅ | Vrai header HTTP (firebase.json) |
| `escHtml()` sur innerHTML user-controlled | ✅ | UI.escHtml utilisé partout |
| Magic bytes validation images | ✅ | Anti MIME-spoofing sur paste/upload screenshot |
| `_sanitizeText` Cloud Function | ✅ | Strip control chars + Unicode bidi |
| Lightbox via DOM API (pas innerHTML) | ✅ | createElement + src setter |
| Triple-couche anti-clickjacking | ✅ | CSP frame-ancestors + X-Frame-Options + JS frame-buster admin |

### Anti-abuse

| Défense | Statut | Notes |
|---|---|---|
| Quota AI atomique (Firestore tx) | ✅ | 1/jour Basic, 20/jour Pro |
| Cloudflare Turnstile sur analyzeChart | ✅ | Anti-bot primaire (remplace App Check v0.9.158) |
| IP rate-limit fallback (5 min) | ✅ | v0.9.170 — parts[length-2] du XFF (avant-dernière IP = trustée, non forgeable) |
| Rate-limit admin atomique (Firestore tx) | ✅ | `generateProCode` 10/h, `revokeProCode` 10/h, `deleteUserAccount` 5/h, `adminMarkEmailVerified` 5/h |
| `sendContactMessage` throttle 60s | ✅ | Tx atomique avant envoi (anti-race) |
| `notifyNewSignup` idempotent | ✅ | Flag `signupNotified` posé AVANT envoi |
| `activatePro` lock anti-double-clic | ✅ | `_proInFlight` |
| `activatePro` throttle 3 tentatives/60s | ✅ | Anti brute-force code |
| Constant-time UID comparison | ✅ | Dans `activatePro` |
| `maxInstances` sur toutes les CFs | ✅ | analyzeChart=10, contact=5, signup=5, delete=2, etc. |

### Confidentialité / RGPD

| Défense | Statut | Notes |
|---|---|---|
| Données Firestore en EU | ✅ | `europe-west1` (Belgique) |
| Cloud Functions en EU | ✅ | `europe-west1` |
| Cloud Storage en EU | ✅ | `europe-west1` |
| `privacy.html` complet | ✅ | Brevo, hCaptcha, Turnstile, reCAPTCHA déclarés |
| Droit à l'effacement | ✅ | `Auth.deleteAccount` purge tout (data, screenshots, codes) |
| Droit à la portabilité | ✅ | `Store.exportFullJSON()` |
| `purgeForeignCache` localStorage | ✅ | Anti data-leakage device partagé |
| Plan/usage NON loadés du localStorage | ✅ | Anti bypass Pro |
| `auditLogs` TTL 1 an | ✅ | Firestore TTL policy via champ `expireAt` |
| Logs Discord errors (admin) | ⚠️ | UIDs en clair — à hasher si canal Discord pas privé |

### Cloud Functions hardening

| Défense | Statut | Notes |
|---|---|---|
| Validation regex stricte des params | ✅ | uid, codeHash, email, tier |
| Audit log AVANT actions destructives | ✅ | Traçabilité même si crash mi-chemin |
| `Promise.allSettled` au lieu de `Promise.all` | ✅ | Collecte erreurs partielles |
| Secrets via Google Secret Manager | ✅ | GROQ_API_KEY, TURNSTILE_SECRET, DISCORD_*, STRIPE_*, BREVO_* |
| Pas de `functions.config()` legacy | ✅ | `disallowLegacyRuntimeConfig: true` |
| Soft-delete avant cascade | ✅ | `deletedUsers/{uid}/` archive 30j |
| `revokeRefreshTokens` avant delete | ✅ | Empêche writes zombies |
| Helper `_assertAdmin` centralisé | ✅ | v0.9.171 — email + email_verified + auth_time < 60min |
| Helper `_assertAdminRateLimit` centralisé | ✅ | v0.9.171 — déduplique le pattern atomique |
| Stripe webhook HMAC signature | ✅ | `stripe.webhooks.constructEvent` |
| Stripe webhook idempotent | ✅ | Collection `stripeWebhookEvents/{eventId}` |

### Infrastructure

| Défense | Statut | Notes |
|---|---|---|
| HTTPS forced | ✅ | Firebase Hosting redirect 301 + HSTS |
| HSTS 1 an + includeSubDomains | ✅ | `firebase.json` headers |
| X-Frame-Options DENY | ✅ | `firebase.json` headers |
| X-Content-Type-Options nosniff | ✅ | `firebase.json` headers |
| Permissions-Policy exhaustive | ✅ | 24 APIs bloquées (camera, micro, geo, payments, USB, etc.) |
| Referrer-Policy strict-origin-when-cross-origin | ✅ | `firebase.json` headers |
| Cache-Control assets immutable + HTML no-cache | ✅ | Cache-busting via `?v=X.Y.Z` |
| PITR Firestore | ✅ | Activé 2026-05-16 (7 jours rétention) |
| Backups Firestore hebdo + mensuel | ✅ | Cloud Scheduler → GCS |
| Budget alert GCP | ⚠️ | À vérifier (gratuit, 3 min) |
| Service account dédié CFs | ❌ | Default Editor — blast radius énorme si RCE |
| Dependabot GitHub | ✅ | Actif. 8 LOW transitives bloquées par firebase-functions@4 (plan : migration v7 post-MVP) |

---

## ⚠️ Exceptions et trade-offs documentés

### 1. ~~App Check Firebase~~ — ABANDONNÉ depuis v0.9.158
**Décision** : reCAPTCHA Enterprise + v3 échouent tous deux sur Safari (issue firebase-js-sdk#9135, non-fixable côté code, Safari ITP bloque tous les 3rd-party providers). 4h de debug, abandonné.
**Remplacement** : Cloudflare Turnstile (anti-bot primaire) + IP rate-limit (fallback). Combiné aux quotas per-user + auth + email_verified, surface d'abus sur Groq verrouillée.

### 2. Code source repo public
**Décision** : repo GitHub public pour montrer le travail / transparence. Architecture exposée (endpoints CFs, collections Firestore, project ID).
**Mitigation** : security-by-obscurity est inopérante de toute façon. Tout est protégé par rules Firestore + Storage + auth + helpers admin. Secrets via Secret Manager, jamais commités.

### 3. Email admin hardcodé (`zeldtradepro@gmail.com`)
**Décision** : SPOF connu. Compromission du compte Gmail → accès total. Mitigé par MFA TOTP Gmail. À long terme : remplacer par collection `adminRoles/{uid}` peuplée via IAM. Pas un blocker MVP.

### 4. firebase-functions@4 (deprecated mais fonctionnel)
**Décision** : major bump v4 → v7 nécessite refactor des callable APIs + secrets binding + tests. Reporté post-MVP. Conséquence : firebase-admin@13 bloqué → 8 LOW transitives non-fixables (CVSS 3.3, AV:Local, non-exploitables via réseau).

### 5. Service account CFs = default Editor
**Décision** : non-restreint à un SA dédié. Si RCE dans une CF, blast radius = tout le projet GCP. Probabilité d'RCE = faible (input strict + sandbox). À durcir post-MVP.

### 6. Logs Discord avec UIDs en clair
**Décision** : si le canal Discord errors est admin-only/privé, RAS. Si compromis : UIDs leakent. À durcir : hasher UIDs (sha256 trunc 8 chars) avant post Discord. Non-bloquant.

---

## 🔑 Gestion des secrets

Tous via **Google Secret Manager**. Aucun secret dans le code, dans `firebase.json`, ou dans le repo.

| Secret | Utilisé par | Notes |
|---|---|---|
| `GROQ_API_KEY` | `analyzeChart` | Rotation manuelle si compromise |
| `TURNSTILE_SECRET` | `analyzeChart` | Anti-bot |
| `HCAPTCHA_SECRET` | `sendContactMessage`, `notifyNewSignup` | Legacy (migration Turnstile prévue) |
| `DISCORD_ERRORS_WEBHOOK` | toutes les CFs | Logs erreurs internes |
| `DISCORD_NEW_USERS_WEBHOOK` | `notifyNewSignup` | Notif admin nouveau signup |
| `STRIPE_SECRET_KEY` | `createCheckoutSession`, `stripeWebhook` | Stealth, pas live |
| `STRIPE_WEBHOOK_SECRET` | `stripeWebhook` | HMAC verification |
| `STRIPE_PRICE_MONTHLY/YEARLY/LIFETIME` | `createCheckoutSession` | IDs prix Stripe |
| `BREVO_SMTP_PASS` | (manuel, scripts/) | Newsletter via nodemailer@8 |

---

## 🗝️ Clés publiques (acceptables côté client)

- **Firebase API Key** (`AIzaSyCX5AWqdFyunxpYV9LgaacHU1osXQDbEss`) — par design publique. La sécurité repose sur les rules Firestore/Storage + auth Firebase, PAS sur cette clé.
- **Cloudflare Turnstile Site Key** (`0x4AAAAAADQkL2_LnsGG4b2_`) — par design publique. La vraie sécu est dans `TURNSTILE_SECRET` côté serveur.

---

## 📊 Score sécurité actuel (2026-05-16, v0.9.171)

| Domaine | Score | Notes |
|---|---|---|
| Code XSS/injection | **9.5/10** | Triple-couche (CSP + escape display + escape stockage) |
| Data integrity | **9/10** | RAS depuis Pack C |
| Rules Firestore | **9/10** | items list non validée en interne (limité self-pollution) |
| Rules Storage | **9/10** | CORS strict prod (v0.9.171) |
| Cloud Functions | **9/10** | `_assertAdmin` + rate-limit symétrique (v0.9.171), Turnstile + IP fallback durci (v0.9.170) |
| Headers HTTP | **10/10** | Stack complet via Firebase Hosting |
| Backup/résilience | **9/10** | PITR + hebdo + mensuel actifs |
| Admin chain | **9/10** | Re-auth < 60min + rate-limits homogènes (v0.9.171) |
| Supply chain | **8/10** | nodemailer HIGH fixée, 8 LOW transitives documentées (out of our control jusqu'à firebase-functions@7) |
| Infrastructure GCP | **7/10** | Service account default Editor (à dédier post-MVP) |

**Score global : 8.5-9/10** — +1.5 depuis dernier audit (v0.9.111 = 7.5/10). Solide pour MVP. Reste service account dédié + migration firebase-functions@7 pour atteindre 9.5/10.

---

## 📋 Plan post-MVP

1. **Service account dédié** pour Cloud Functions (limiter blast radius RCE).
2. **Migration firebase-functions v4 → v7** (débloque firebase-admin@13 → fix 8 LOW).
3. **Collection `adminRoles/{uid}`** pour remplacer email hardcodé.
4. **Hash UIDs** dans logs Discord (`sha256.slice(0, 8)`).
5. **Budget alert GCP** (gratuit).
6. **SRI** sur scripts externes (Firebase SDK, Turnstile).
7. **Validation interne items** dans rules trades/myAccounts/groups (anti self-pollution via SDK direct).
8. **MFA Firebase Auth admin** (en plus du MFA Gmail).

---

## 🚨 Procédure d'incident

En cas de compromission supposée :

1. **Détecter** : consulter `auditLogs` Firestore (admin) pour activité suspecte (`adminRateLimit/*` doc pour bursts).
2. **Couper** : Firebase Console → Auth → disable user concerné. Si admin compromis : reset password depuis Gmail (MFA TOTP requis).
3. **Notifier** : si fuite confirmée → CNIL dans les 72h (https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles).
4. **Documenter** : ajouter une entrée dans `docs/CHANGELOG-DEV.md` avec date + impact + remédiation.
5. **Restaurer** : PITR Firestore (point-in-time recovery) si data corruption récente, ou backup GCS hebdo/mensuel si plus ancien.
