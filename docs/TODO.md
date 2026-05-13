# TODO ZeldTrade — Backlog priorisé (audit 2026-05-12)

> Audit complet 4 axes (sécurité, qualité code, UX, infra) — 150+ findings consolidés.
> **Stratégie budget** : tout à 0€ jusqu'à la 1ère vente. Domaine custom (10€/an) seulement après.
> Source : `docs/CHANGELOG-DEV.md` 2026-05-12 entry.

---

## 💰 Stratégie budget zéro

### Tout est faisable à 0€

Le seul "coût" théorique : PITR Firestore (~0.04€/GB-mois) + backup GCS (~0.01€/GB-mois Nearline) = **~0.10€/mois** vu la volumétrie actuelle (<100 MB). Donc en pratique : **0€ jusqu'à 1000+ users payants**.

### Limitation 0€ sans domaine
Sans domaine `zeldtrade.com` :
- **Solution gratuite optimale** : migrer GitHub Pages → **Firebase Hosting** (free tier 10 GB/mois)
  - URL devient `zeldtrade.web.app` — déjà plus pro que `zeldaron.github.io/zeldtrade`
  - **Vrais headers HTTP** possibles via `firebase.json` (HSTS, CSP réelle, X-Frame-Options)
  - Plus tard : brancher le domaine custom (10€/an) en 5 minutes
- **Alternative** : rester sur GitHub Pages → headers HTTP limités aux `<meta>` (partiellement supportés)

### Quand investir
- **10€/an** dès la 1ère vente : domaine `zeldtrade.com` chez Cloudflare Registrar
- **~30€/mois** post-100 users payants : cyber-assurance Stoik/Hiscox
- **~2-5k€** post-v1.0 stable : pen-test externe avant ouverture grand public

### Score sécurité atteignable à 0€
**~9/10** (vs 7/10 actuellement) — sans dépenser un centime.

---

## 🔴 CRITIQUE — Priorité absolue (15 findings)

### 🛠️ MANUEL — À toi (8 actions, ~3-4h total, 0€)

| # | Action | Console | Effort | Coût |
|---|---|---|---|---|
| **I5a** | Imprimer les 10 backup codes Gmail | https://myaccount.google.com/security | 5 min | 0€ |
| **I5b** | Ajouter 2e Owner GCP (failover si compte admin perdu) | https://console.firebase.google.com/project/zeldtrade/settings/iam | 5 min | 0€ |
| **I5c** | Configurer Inactive Account Manager Google | https://myaccount.google.com/inactive | 5 min | 0€ |
| **I3** | Budget alert GCP 20€/mois (anti-DoS financier) | https://console.cloud.google.com/billing/budgets | 5 min | 0€ |
| **I1** | Activer PITR Firestore (récup data 7j) | Firebase Console → Firestore → Backups | 2 min | <0.10€/mois |
| **I2** | Scheduled backup GCS hebdo | Firestore → Backup schedules | 30 min | <0.10€/mois |
| **I6/S1** | **Réparer App Check reCAPTCHA Enterprise** (vérif clé Score-based + IAM role) | https://console.cloud.google.com/security/recaptcha + Firebase App Check | 1-2h | 0€ |
| **I4/S3** | Créer SA dédié pour Cloud Functions (least privilege) | https://console.cloud.google.com/iam-admin/serviceaccounts | 1-2h | 0€ |

### 🔧 CODE — À moi (7 fixes)

| # | Titre | Effort |
|---|---|---|
| **S1** | Réactiver `enforceAppCheck` sur 6 CFs (après I6 manuel) | 2h |
| ~~**S2**~~ | ~~Remettre check `email_verified` (rules + 4 CFs admin)~~ ✅ 2026-05-12 | 5 min |
| ~~**Q1**~~ | ~~Race condition save trade en mode groupe → batch en 1 seul write Firestore~~ ✅ 2026-05-12 (v0.9.106) | 1h |
| ~~**Q3**~~ | ~~Winrate : compter `c.netPnl > 0` au lieu de `outcome === 'win'`~~ ✅ 2026-05-12 (v0.9.106) | 30 min |
| ~~**Q4-Q5**~~ | ~~Calc.trade : early-return si entry/sl null ou tp1=0~~ ✅ 2026-05-12 (v0.9.106) | 30 min |
| ~~**U1**~~ | ~~Remplacer `confirm()` natif par modale custom~~ ✅ 2026-05-13 (v0.9.107) | 1-2h |
| **U3** | Onboarding nouveau user : empty state "premier lancement" guidé | 2h |

---

## 🟠 HAUT — Gros impact (25 findings)

### 🛠️ MANUEL (8 actions, ~12-15h total, 0€ sauf domaine optionnel)

| # | Action | Effort | Coût |
|---|---|---|---|
| ~~**I8**~~ | ~~Dependabot config~~ ✅ 2026-05-13 (`.github/dependabot.yml` créé) — il reste juste à cocher "Enable Dependabot alerts" dans GitHub Settings → Code security | 15 min | 0€ |
| **I9** | Migrer Web3Forms → Discord webhooks (donne-moi les URLs après création) | 1h (toi) + 30 min (moi pour migration code) | 0€ |
| **I11** | Compléter `privacy.html` : Groq, GitHub Pages, Stripe, Discord avec base légale RGPD | 1-2h | 0€ |
| **I13** | Sentry / GCP Error Reporting alertes | 1h | 0€ (5k events/mois free) |
| **I15** | Compte Stripe FR + KYC (lance tôt, attente 1-7j) | 2-3h + attente | 0€ (no fee sans vente) |
| **I14** | MFA Firebase Auth admin (distinct du MFA Gmail) | 2-3h | 0€ |
| **I7** | Bump `firebase-functions` v4.6 → v6 (EOL) | 2-4h (moi après que tu donnes go) | 0€ |
| **I10** | **OPTIONNEL** : domaine + Firebase Hosting | 3-4h | ~1€/mois (10€/an domaine) |
| **I10 alt** | **GRATUIT** : Firebase Hosting sans domaine custom → `zeldtrade.web.app` + vrais headers HTTP | 1h | 0€ |

### 🔧 CODE — 17 fixes

**Sécurité (3)** : S4 CORS (bloqué par I7), ~~S10 captcha vérif serveur~~ ✅ 2026-05-12 (nécessite HCAPTCHA_SECRET manuel), ~~S11 magic bytes serveur~~ ✅ 2026-05-12
**Qualité (10)** : Q6 const fee, Q7 warn instrument inconnu, Q8 USDJPY pip, Q9 UK100 GBP, ~~Q10 retirer QO1~~ ✅ 2026-05-12, Q12-14 memory leaks, Q15 promise chain await-able
**UX (4)** : U2 message clair quota, ~~U4 loading states~~ ✅ 2026-05-12, U6 settings dense, U8 labels accessibility, U10 i18n complet, U12 focus-visible

---

## 🟡 MOYEN — Qualité (45+ findings)

### 🛠️ MANUEL (5)
- **I12** : Audit logs CFs PII (vérifier que rien d'identifiant en clair, doc dans privacy.html)
- **I17** : TTL `auditLogs` Firestore (1 an, RGPD)
- **I18** : CI GitHub Actions pour tests (lance `node test/calc.test.js` automatiquement)
- **I19** : Alertes Cloud Monitoring (erreur CFs > 5%/5min)
- **I20** : SA dédié GitHub Actions deploy

### 🔧 CODE (40)

**Sécurité (10)** : S12 headers HTTP, S13 TTL auditLogs, S15 plan schema, S16 audit pre-action, ~~S17 Unicode bidi~~ ✅ 2026-05-12, S18 pagination admin, S19 throttle persisté serveur, S20 email_verified signup, S21 isAdmin bypass myAccounts, S36 webhook idempotent

**Code (15)** : Q11 date floor, Q16 anti-corruption check, Q17 garde-fou null, Q18-20 dedup helpers, Q22-23 dead code, Q24/31 perf Calc.trade, Q25-26 no-op functions, Q27 spreadCost fallback, Q43 timezone, Q44 paste handlers, Q49 race compression, Q52 double escape JSON, Q53-55 désynchros sanitize, Q61-62 N+1 queries, Q69 reset aiUsage downgrade

**UX (15)** : U9 undo, U11 pills découvrables, U13 touch targets mobile, U14 bulle contact mobile, U15 seuil "Meilleure session", U16-17 partial UI, U21 dashboard empty, U22 couleurs harmonisées, U23 filtres combinables, U24 compteur recherche, U27 groupe visible, U28 CSV preview, U30 toast queue, ~~U31 mémo wizard~~ ✅ 2026-05-13 (v0.9.108), U32 confirm réanalyse

---

## ⚪ BAS — Nice-to-have (65+ findings)

Détails dans le CHANGELOG-DEV audit consolidé. Sélection :
- Magic numbers à mettre en const (`Q70-Q73`)
- Refactor modal.js (1167 lignes) et calc.js (240 lignes)
- Tests supplémentaires (`Q70`)
- Mode dark/light toggle (`U45`)
- Status page publique (`I21`)
- Pen-test externe (`I24`, post-v1.0, 2-5k€)
- Cyber-assurance (`I25`, post-100 users, 30-80€/mois)
- Runbook incident détaillé (`I26`)

---

## 🐛 Bugs en cours d'investigation

| # | Bug | Description | Status |
|---|---|---|---|
| ~~**B3**~~ | ~~Rule `userEmails` blocklist trop stricte bloque la recréation du userEmails admin~~ ✅ Résolu 2026-05-13 | Username "Admin" (ou contenant "admin"/"zeldtrade"/etc.) bloquait la rule `userEmails write` introduite en v0.9.95. Le compte admin lui-même ne pouvait plus créer son record `userEmails` après recréation. **Fix** : bypass de la blocklist si `request.auth.token.email == 'zeldtradepro@gmail.com'`. Rule redéployée. | ✅ Résolu |
| ~~**B1**~~ | ~~Activation code Pro échoue pour le compte admin recréé~~ ✅ Résolu 2026-05-12 (Option A) | User a édité manuellement le doc `proCodeHashes/{hash}` dans Firebase Console pour mettre le bon UID. Activation OK confirmée. Cleanup B (suppression artefacts ancien UID) reste pertinent à terme. | ✅ Résolu |
| ~~**B2**~~ | ~~Cloud Function cleanup userEmails orphelins~~ ✅ 2026-05-13 (v0.9.107) — `cleanupOrphanUserEmails` CF + UI admin Config tab (dry-run obligatoire avant suppression) | À faire (~1h) |

---

## 🆕 Nouvelles features demandées (hors audit)

| # | Feature | Description | Effort |
|---|---|---|---|
| **F1** | **Type de trading au signup + adaptation UI** | **Multi-choix** au signup : ☐ Fonds propres (capital perso hors prop firm) ☐ Prop firm (Apex/FTMO/etc.). Crypto plus tard (F2). Stocker dans `userEmails/{uid}.tradingTypes: ['fundsOwn'\|'propFirm'][]`. **UI adaptative** : si user a uniquement `fundsOwn` → masquer la section Prop Firms (Apex trailing, drawdown rules, daily loss limit), masquer les presets prop firms dans Settings. Si les 2 → garder l'UI actuelle. **Onboarding rétroactif** : pour les users existants qui n'ont pas encore répondu, afficher une modale bloquante au 1er login après la mise à jour pour qu'ils choisissent. **Détails précis (UX exact, schéma data, flow modale, instruments par défaut, calculs risk adaptés) à fournir par l'user plus tard** | À définir (~4-6h) |
| **F2** | Ajouter Crypto à F1 (futur) | Une fois F1 stable, étendre les choix avec ☐ Crypto. UI : instruments crypto (BTCUSD, ETHUSD, etc.), calculs adaptés. | À définir |

> Ajouté le 2026-05-12 sur demande user.
> User précisera les détails (UX, schéma data, flow modale, calculs) plus tard avant implémentation.

---

## 🎯 Plan d'attaque cette semaine — 100% GRATUIT

### Lundi matin (30 min)
1. I3 — Budget alert GCP (5 min)
2. I1 — PITR Firestore (2 min)
3. I5a — Imprimer backup codes Gmail (5 min)
4. I5b — Ajouter 2e Owner GCP (5 min)
5. I5c — Inactive Account Manager (5 min)
6. I8 — Dependabot + CodeQL GitHub (15 min)

### Lundi aprem (2-3h)
7. I6 — Réparer App Check reCAPTCHA Enterprise (le plus dur, mais critique)

### Mardi (3-4h)
8. I2 — Scheduled backup GCS (30 min)
9. I9 — Discord webhooks (1h) → donne-moi les 2 URLs après pour migration code (~30 min de mon côté)
10. I4 — Service account CFs dédié (1-2h)

### Mercredi (2-3h)
11. I15 — Compte Stripe FR + KYC (le plus long en attente, à lancer tôt)
12. I14 — MFA Firebase Auth admin (2h)

### Jeudi (3-4h)
13. I10 alt — Migrer vers Firebase Hosting `zeldtrade.web.app` (1h, GRATUIT)
14. I11 — Compléter privacy.html (1-2h)

### Vendredi (2h)
15. I13 — Sentry setup (1h)
16. I8 — Dependabot config dependabot.yml (15 min)

**Une fois ces actions manuelles faites** (toutes 0€), ping-moi → je fais les **fixes code critiques + hauts** dans la foulée (Q1, Q3, Q4-5, S1 réactivation, S2 remise email_verified, U1 confirm modal, etc.).

**Score visé après la semaine** : sécurité **~9/10**, prêt pour ouverture commerciale post-1ère vente.

---

## 🔄 Mise à jour de ce fichier

À chaque action terminée, je rayer (`~~~~`) la ligne et marquer la date. Exemple :
```
- ~~**I3** — Budget alert GCP (5 min)~~ ✅ 2026-05-13
```

Ne pas supprimer les items — historique trace. Quand toute une section est complète, déplacer "🎉 TERMINÉ" en haut.
