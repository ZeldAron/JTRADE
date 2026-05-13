# Sécurité ZeldTrade

> Modèle de menace, défenses en place, exceptions temporaires, et plan d'amélioration.

---

## 🎯 Modèle de menace

Vu le **modèle privé / recrutement manuel**, les menaces principales sont :

1. **🔴 Compromission du compte admin** (`zeldtradepro@gmail.com`) — accès total
2. **🔴 Insider threat** — un user recruté qui devient malveillant
3. **🟡 Fuite de données utilisateurs** — RGPD (P&L, capital, stratégies)
4. **🟡 DoS financier** — quelqu'un fait exploser Groq/Firestore bills
5. **🟢 Spam/abuse public** — peu critique car signup quasi-fermé
6. **🟢 Hack massif** — peu probable car attack surface réduite

## ✅ Défenses en place

### Authentification

| Défense | Statut | Notes |
|---|---|---|
| Email/Password Firebase Auth | ✅ Actif | Hashing géré par Firebase |
| MFA Gmail (TOTP) sur compte admin | ✅ Actif | Protège le compte Google donc Firebase Console |
| Backup codes Gmail imprimés | ⚠️ À vérifier | Crucial si perte du téléphone |
| MFA Firebase Auth admin | ❌ Désactivé | Distinct du MFA Gmail. À activer plus tard. |
| Email verification obligatoire | ❌ Désactivé temporairement | Cf "Exceptions" |

### Autorisation

| Défense | Statut | Notes |
|---|---|---|
| Firestore rules default-deny | ✅ | `match /{document=**} { allow read, write: if false; }` |
| Per-collection whitelist | ✅ | `hasOnly([...])` sur chaque write |
| Validation types + ranges | ✅ | `is int`, `> 1700000000000`, etc. |
| Storage rules owner-only | ✅ | Path : `users/{userId}/trades/{tradeId}/{filename}` |
| Storage : taille < 2 MB | ✅ | `request.resource.size < 2 * 1024 * 1024` |
| Storage : content-type whitelist | ✅ | jpeg/png/webp uniquement |
| Cloud Function `isAdmin()` check | ✅ | Email check sur tous les endpoints admin |
| `email_verified` check sur admin | ❌ Désactivé temporairement | Cf "Exceptions" |

### Anti-injection

| Défense | Statut | Notes |
|---|---|---|
| `_sanitizeTrade` whitelist strict | ✅ | Regex par champ, escape HTML setup/notes au stockage (fail-safe) |
| `_sanitizeAccount` whitelist | ✅ | Strict spread (anti champ injecté via DevTools) |
| `_sanitizeGroupData` whitelist | ✅ | Idem |
| CSP `script-src` sans `unsafe-inline` | ✅ | `index.html` ligne 7-9 |
| CSP `frame-ancestors 'none'` | ✅ (meta — partiellement supporté) | Vrai header HTTP requiert Firebase Hosting |
| `escHtml()` sur innerHTML user-controlled | ✅ | UI.escHtml utilisé partout |
| Magic bytes validation images | ✅ | Anti MIME-spoofing sur paste/upload screenshot |
| `_sanitizeText` Cloud Function | ✅ | Strip control chars + Unicode bidi |
| Lightbox via DOM API (pas innerHTML) | ✅ | v0.9.102 — `createElement` + `src=` setter |

### Anti-abuse

| Défense | Statut | Notes |
|---|---|---|
| Quota AI atomique (Firestore tx) | ✅ | 1/jour Basic, 200/jour Pro |
| `generateProCode` rate-limit 10/h admin | ✅ | Firestore tx `adminRateLimit/generateProCode` |
| `sendContactMessage` throttle 60s | ✅ | Tx atomique avant envoi (anti-race) |
| `notifyNewSignup` idempotent | ✅ | Flag `signupNotified` posé AVANT envoi |
| `activatePro` lock anti-double-clic | ✅ | `_proInFlight` |
| `activatePro` throttle 3 tentatives/60s | ✅ | Anti brute-force code |
| Admin login : lockout 5min/3 tentatives | ✅ | Client-side |
| Admin login : minDelay 1500ms uniforme | ✅ | Anti timing-attack |
| Constant-time UID comparison | ✅ | Dans `activatePro` |
| Cloud Functions `maxInstances` | ✅ | analyzeChart=10, contact=5, signup=5, delete=2, revoke=2 |

### Confidentialité / RGPD

| Défense | Statut | Notes |
|---|---|---|
| Données Firestore en EU | ✅ | `europe-west1` (Belgique) |
| Cloud Functions en EU | ✅ | `europe-west1` |
| Cloud Storage en EU | ✅ | `europe-west1` |
| `privacy.html` complet | ✅ | Web3Forms, hCaptcha, reCAPTCHA déclarés |
| Droit à l'effacement | ✅ | `Auth.deleteAccount` purge tout (data, screenshots, codes) |
| Droit à la portabilité | ✅ | `Store.exportFullJSON()` |
| `purgeForeignCache` localStorage | ✅ | Anti data-leakage device partagé |
| Web3Forms (US) déclaré | ✅ | À migrer Discord (EU) |
| Logs PII sanitized | ✅ | Pas de body Web3Forms en clair |
| `auditLogs` : email cible conservé | ⚠️ | Pas de TTL automatique pour l'instant |

### Cloud Functions hardening

| Défense | Statut | Notes |
|---|---|---|
| Validation regex stricte des params | ✅ | uid, codeHash, email, tier |
| Audit log "in_progress" AVANT actions | ✅ | Traçabilité même si crash mi-chemin |
| `Promise.allSettled` au lieu de `Promise.all` | ✅ | Collecte erreurs partielles |
| Secrets via Google Secret Manager | ✅ | GROQ_API_KEY, WEB3FORMS_KEY, STRIPE_* |
| Pas de `functions.config()` legacy | ✅ | `disallowLegacyRuntimeConfig: true` |
| Soft-delete avant cascade | ✅ | `deletedUsers/{uid}/` archive 30j |
| `revokeRefreshTokens` avant delete | ✅ | Empêche writes zombies |
| `email_verified` admin enforcement | ❌ Désactivé temporairement | Cf "Exceptions" |

### Infrastructure

| Défense | Statut | Notes |
|---|---|---|
| HTTPS forced | ✅ | GitHub Pages enforce HTTPS |
| HSTS | ❌ | Pas possible en meta — bloqué par GitHub Pages |
| Vrais headers HTTP CSP/X-Frame | ❌ | Idem — Firebase Hosting requis |
| PITR Firestore | ❌ | À activer (manuel, ~1€/mois) |
| Scheduled backup GCS | ❌ | À activer (manuel) |
| Budget alert GCP | ❌ | À activer (3 min, gratuit) |
| Service account dédié CFs | ❌ | À créer (Editor par défaut, blast radius énorme si RCE) |
| Dependabot GitHub | ❌ | À activer |

---

## ⚠️ Exceptions temporaires (sécurité dégradée)

### 1. App Check init désactivé côté client (depuis v0.9.104)

**Raison** : reCAPTCHA Enterprise retourne 401. Cause non identifiée (probablement clé "Checkbox" au lieu de "Score-based", ou IAM role manquant).

**Impact** :
- Toutes les CFs `enforceAppCheck:false` (analyzeChart, sendContactMessage, notifyNewSignup, deleteUserAccount, generateProCode, revokeProCode)
- Pas de protection anti-bot au niveau App Check
- Mitigation : auth Firebase + `isAdmin()` + rate-limits Firestore restent en place

**Plan de remédiation** (cf README étapes manuelles) :
1. Vérifier type de clé reCAPTCHA Enterprise = "Score-based" (pas Checkbox)
2. Vérifier App Check Apps : provider = reCAPTCHA Enterprise + même site key
3. Vérifier IAM `service-{n}@gcp-sa-firebase-appcheck` a le rôle "reCAPTCHA Enterprise Agent"
4. Une fois fixé : décommenter `firebase.js:14-23` + réactiver `enforceAppCheck` sur les CFs

### 2. ~~`email_verified` check retiré~~ ✅ RÉSOLU 2026-05-12

L'admin a vérifié son email via `firebase.auth().currentUser.sendEmailVerification()`. Check `email_verified == true` réactivé dans `isAdmin()` rule + 4 CFs admin. Posture restaurée.

### 3. CORS option array retiré sur les Cloud Functions (depuis v0.9.102)

**Raison** : `cors: ['https://zeldaron.github.io']` (array) cassait le preflight OPTIONS dans `firebase-functions@4.6` Gen 2 (bug SDK).

**Impact** :
- Les CFs acceptent toutes les origines (preflight OPTIONS répond 204 universel)
- Les protections sécu réelles sont au niveau auth Firebase + Secret Manager pour les API keys, donc impact réel minime

**Plan de remédiation** :
- Migrer firebase-functions v4 → v6 (le bug est corrigé)
- Réactiver `cors: ALLOWED_ORIGINS` après migration

### 4. Placeholder pour les secrets Stripe (depuis 2026-05-12)

**Raison** : Firebase Functions refuse de déployer si un secret référencé est null. Tant que Stripe n'est pas configuré, on a mis "placeholder" sur les 5 secrets STRIPE_*.

**Impact** :
- `createCheckoutSession` et `stripeWebhook` ne fonctionnent PAS avec ces placeholders
- Mais elles ne sont PAS activement utilisées (Stripe en mode stealth, pas encore live)
- Aucun risque réel

**Plan de remédiation** :
- Quand le user configure Stripe : remplacer les 5 placeholders par les vraies valeurs via `firebase functions:secrets:set`

---

## 🔑 Gestion des secrets

| Secret | Stocké dans | Utilisé par | Rotation |
|---|---|---|---|
| `GROQ_API_KEY` | Google Secret Manager | `analyzeChart` | Rotation manuelle si compromise. Version actuelle : 2 (rotée le 2026-05-12) |
| `WEB3FORMS_KEY` | Google Secret Manager | `sendContactMessage`, `notifyNewSignup` | À retirer quand migration Discord |
| `STRIPE_SECRET_KEY` | Google Secret Manager | `createCheckoutSession`, `stripeWebhook` | Placeholder pour l'instant |
| `STRIPE_WEBHOOK_SECRET` | Google Secret Manager | `stripeWebhook` | Placeholder |
| `STRIPE_PRICE_MONTHLY/YEARLY/LIFETIME` | Google Secret Manager | `createCheckoutSession` | Placeholder |

**Pas de secrets dans le code source ni dans `firebase.json`.**

---

## 🗝️ API key Firebase (clé browser publique)

`AIzaSyCX5AWqdFyunxpYV9LgaacHU1osXQDbEss` (dans `firebase.js:3`)

C'est une **clé publique** — destinée à être visible dans le navigateur. La sécurité de Firebase repose sur :
1. Les **rules Firestore/Storage** (default-deny + isAdmin)
2. **Auth Firebase** (qui peut faire quoi)
3. **App Check** (anti-bot — actuellement désactivé)

⚠️ Si quelqu'un a ajouté des restrictions sur cette clé (HTTP referrer, API restrictions), cela peut casser le SDK. Actuellement : **None** + Identity Toolkit + Token Service activés.

---

## 📊 Score sécurité actuel (au 2026-05-14, v0.9.111)

| Domaine | Score | Bloqueur |
|---|---|---|
| Code XSS/injection | **9.5/10** | RAS — fail-safe escape partout |
| Data integrity | **9/10** | Pack C v0.9.110 a éliminé NaN/double-escape/race compression |
| Rules Firestore | **9.5/10** | `email_verified` réactivé v0.9.106 + admin bypass blocklist |
| Rules Storage | **8.5/10** | OK |
| Cloud Functions | **8/10** | App Check temporairement off (toujours) + magic bytes + hCaptcha vérif serveur (v0.9.106) |
| Backup/résilience | **3/10** | **PITR + GCS à activer (manuel)** — inchangé |
| Infra HTTP | **5/10** | GitHub Pages limitation — Firebase Hosting non migré |
| Admin chain | **8.5/10** | MFA Gmail OK + email_verified strict (v0.9.106) |
| Supply chain | **7.5/10** | Dependabot activé v0.9.107, fb-functions v4 toujours EOL |
| UX mobile (a11y) | **8.5/10** | Touch targets ≥ 44×44 v0.9.109 |

**Score global : 7.5/10** — gains réguliers depuis v0.9.105 (+0.5). Reste l'infra HTTP + résilience pour passer 9/10.

---

## 🚨 Procédure d'incident (à formaliser)

En cas de compromission supposée :

1. **Détecter** : consulter `auditLogs` Firestore (admin) pour activité suspecte
2. **Couper** : Firebase Console → Auth → disable user concerné. Si admin compromis : reset password depuis Gmail (MFA TOTP requis)
3. **Notifier** : si fuite confirmée → CNIL dans les 72h (https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles)
4. **Documenter** : ajouter une entrée dans `docs/CHANGELOG-DEV.md` avec date + impact + remédiation
5. **Restaurer** : si PITR activé → restauration point-in-time, sinon dernier backup GCS
