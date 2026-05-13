# Changelog développement (interne)

> Journal des modifications techniques, décisions d'archi et exceptions sécurité.
> Distinct de `src/js/pages/changelog.js` qui est destiné aux users.
>
> **Règle d'or** : à chaque modification du code, **AJOUTER** une entrée datée ci-dessous (jamais écraser).

---

## Format des entrées

```markdown
## YYYY-MM-DD — vX.Y.Z — Titre court

**Type** : feat | fix | security | refactor | infra | docs | revert
**Fichiers** : `src/js/store.js`, `functions/index.js`...
**Versions impactées** : front (vX.Y.Z), CFs (vX.Y.Z)

### Contexte
Pourquoi cette modif, quelle était le problème.

### Changements
- Liste précise de ce qui a été modifié

### Impact
- UX : ce qui change pour l'user
- Sécu : impact sur la posture
- Perf : impact perf si pertinent

### À surveiller
- Tests à refaire
- Régressions possibles

### Liens
- Commit hash, audit ref, etc.
```

---

## 2026-05-13 — B3 fix critique : rule userEmails blocklist bloquait l'admin

**Type** : security fix
**Fichiers** : `firestore.rules`

### Contexte
La blocklist username (`admin|zeldtrade|zeldaron|support|staff|moderator|root|system`) introduite en v0.9.95 bloquait également le compte admin lui-même. Quand l'admin a recréé son compte et tenté de se relogger sur l'app principale, `auth.js _storeUserEmail` essayait d'écrire `userEmails/{uid}` avec username "Admin" → rule rejette → admin.html n'affichait plus la ligne admin → impossible de générer un nouveau code Pro pour le bon UID.

### Changements
- `firestore.rules` `userEmails write` : ajout d'un bypass de la blocklist pour `request.auth.token.email == 'zeldtradepro@gmail.com'`. Le check whitelist caractères (`^[A-Za-z0-9._\- ]+$`) reste actif.

### Impact
- ✅ Admin peut maintenant recréer son `userEmails` au login
- ✅ Bonus : prévient le bug à l'avenir si le user supprime/recrée son compte
- ⚠️ Léger risque si l'email admin est compromis : il pourrait écrire un username "admin" (mais ça n'a pas de conséquence — il EST admin de toute façon)

### À surveiller
- User doit se relogger sur l'app principale après ce deploy pour que `_storeUserEmail` se déclenche
- Vérifier que `userEmails/jGJReBgxVKMqe7bWkFi3mm7lMB22` existe ensuite dans Firestore
- Refresh admin.html → ligne admin réapparaît

---

## 2026-05-12 — B1 diagnostiqué : code Pro orphelin après recréation admin

**Type** : bug investigation

### Contexte
User a recréé son compte admin `zeldtradepro@gmail.com` via Firebase Console (suite à la perte de password). Les artefacts Firestore de l'ancien UID (`UfnQrAQNPDU8DAffxzXVYT8AyDN2`) n'ont pas été nettoyés. Du coup `userEmails` contient 2 entrées pour le même email. Quand l'admin a généré un code Pro via admin.html, il a cliqué la mauvaise ligne (l'ancienne) → code attribué à l'ancien UID → `Match UIDs: NON` à l'activation.

### Diagnostic technique
- Hash code `ZELD-MW2N-MWAT-KN7U` normalisé : `532de3ebfb28258c55343d3466268dbccae27a12c1e72caf917d0efa6319b455`
- `proCodeHashes/{hash}.uid` = `UfnQrAQNPDU8DAffxzXVYT8AyDN2` (ancien)
- `firebase.auth().currentUser.uid` = `jGJReBgxVKMqe7bWkFi3mm7lMB22` (nouveau)
- Rule `users/{userId}/data/plan` exige `get(proCodeHashes/{hash}).data.uid == request.auth.uid` → rejet

### Solution proposée
- Manuel immédiat : modifier le doc `proCodeHashes/{hash}` dans Firebase Console pour mettre le bon UID, OU supprimer tous les artefacts orphelins
- Long terme (B2) : ajouter détection des `userEmails` orphelins dans admin.html (badge ⚠ doublon)

### À noter
- La Cloud Function `deleteUserAccount` aurait nettoyé tout proprement (`userEmails` + `proCodeHashes` + `users/{uid}/data/*` + soft-delete archive). Le bug vient de la suppression manuelle via Firebase Console qui bypass la CF.
- À documenter : si on doit recréer un compte admin à l'avenir, **toujours** passer par `deleteUserAccount` CF d'abord (ou faire le cleanup Firestore manuel).

---

## 2026-05-12 — Features F1 + F2 ajoutées à la roadmap : type de trading au signup

**Type** : docs (TODO)

### Contexte
User demande au signup de demander quel type de trader (multi-choix). MVP : Fonds propres / Prop firm. Crypto plus tard (F2).

### Spécifications validées
- **Choix multiples** : un user peut cocher Fonds propres ET Prop firm
- **"Fonds propres"** = capital personnel hors prop firm
- **UI adaptative** : si uniquement fonds propres → masquer toute la section Prop Firms (Apex trailing, drawdown rules, daily loss limit, presets). Si les 2 → UI actuelle.
- **Onboarding rétroactif** : modal bloquante au 1er login pour les users existants qui n'ont pas répondu (vu petit pool, faisable)
- **Détails techniques à venir** : user précisera schéma data, flow exact modale, instruments par défaut, calculs risk adaptés

### Changements
- `docs/TODO.md` : F1 + F2 dans section "🆕 Nouvelles features demandées"

### Impact
- Roadmap claire pour la prochaine grosse feature
- Pertinent aussi pour pricing futur (offres différenciées fonds propres vs prop firm)

### À surveiller
- Avant implémentation : attendre les specs détaillées du user
- Migration : schéma `userEmails` doit accepter le nouveau champ `tradingTypes`
- Tester l'onboarding rétroactif sur un compte existant qui n'a pas le champ

---

## 2026-05-12 — v0.9.106 — Sprint sécu + stats correctes + perf groupe

**Type** : security + fix + perf
**Fichiers** : `src/js/calc.js`, `src/js/ui.js`, `src/js/store.js`, `src/js/modal.js`, `src/js/i18n.js`, `src/js/pages/outils.js`, `functions/index.js`

### Contexte
Sprint demandé par user pour atteindre "site sécurisé et fonctionnel un minimum" sans dépendre des actions manuelles. 6 fixes faisables en code direct.

### Changements

**Q4-Q5 — NaN dans Calc.trade** :
- `calc.js` : early-return zeros + flag `invalid:true` si entry/sl/tp1 manquants ou non-finite. Anti propagation NaN dans totalPnL/winrate/equity. Tous les renderers qui font `c.netPnl || 0` étaient compromis silencieusement.

**Q3 — Winrate cohérent** :
- `ui.js statsForTrades` + `store.js getStats` : winrate basé sur `c.netPnl > 0` au lieu de `outcome === 'win'`. Un trade `outcome=be` avec partial profitable compte maintenant comme gagnant. Inclut aussi BE dans le pool des trades fermés pour le winrate (cohérent).
- Bonus perf : 1 seul passage `Calc.trade(t)` au lieu de 2-3 (anciens reduce séparés).

**U4 — Loading state** :
- `modal.js save` : bouton "Enregistrer" → "Enregistrement…" pendant la sauvegarde, restauré à la fin via `finally`.
- `i18n.js` : ajout `wiz.saving` FR/EN.

**Q10 — Retirer QO1** :
- Retiré de `store.js DEFAULT_SPREADS` et `DEFAULT_SPREADS_BY_FIRM` (4 firms)
- Retiré de `pages/outils.js` (instruments du calculateur)
- Retiré de `modal.js INSTR_CAT`
- **Conservé** dans `calc.js POINT_VALUES` + `modal.js VALID_INSTRS` + `pages/settings.js` pour rétro-compat trades historiques.

**S10 — hCaptcha serveur** :
- `functions/index.js` : nouvelle fonction `_verifyHcaptcha(token)` qui POST vers `api.hcaptcha.com/siteverify`.
- Mode dégradé : si `HCAPTCHA_SECRET` est absent ou `placeholder`, on log warning et on accepte. Permet déploiement sans bloquer.
- Appelé dans `sendContactMessage` et `notifyNewSignup` AVANT l'envoi Web3Forms.
- Nouveau secret `HCAPTCHA_SECRET` (placeholder pour l'instant — à setter avec vraie valeur côté hCaptcha dashboard).

**S11 — Magic bytes serveur** :
- `analyzeChart` : décode `imageB64.slice(0, 24)` en buffer, vérifie signatures PNG / JPEG / WebP / GIF. Reject sinon avec `invalid-argument`. Rollback quota.
- Anti MIME-spoofing : un attaquant qui appelle directement la CF avec un PDF/exécutable encodé en base64 est bloqué.

**S17 — Unicode bidi strip** :
- `_sanitizeText` : strip caractères Unicode bidi (`U+200B`-`U+200F`, `U+202A`-`U+202E`, `U+2066`-`U+2069`, `U+FEFF`) en plus des control chars. Anti-spoofing emails admin (U+202E RLO peut renverser visuellement un nom).

**Q1 — Batch writes mode groupe** :
- `store.js` : nouvelle fonction `addTradesBatch(tradeList)` qui ajoute tous les trades en mémoire puis fait **1 seul `_saveTrades()`** au lieu de N.
- `modal.js save` mode groupe : utilise `addTradesBatch` au lieu de `grp.accountIds.map(Store.addTrade)`.
- Perf : groupe de 10 comptes = 1 write Firestore au lieu de 10 → 10× plus rapide, 10× moins de coût.

### Tests
- `node test/calc.test.js` : **103/103 ✓** (aucune régression sur les calculs)

### Déploiement
- Cloud Functions : `analyzeChart`, `sendContactMessage`, `notifyNewSignup` redéployées
- Site : v0.9.106 sur GitHub Pages
- Nouveau secret `HCAPTCHA_SECRET` (placeholder) — à activer manuellement quand le user voudra la vérif hCaptcha stricte

### Impact
- Stats : enfin justes (winrate ne ment plus, NaN éliminés)
- Perf groupe : 10× pour les users multi-comptes
- Sécu CFs : 3 couches supplémentaires (magic bytes, hCaptcha, bidi strip)
- UX save : feedback clair

### À surveiller
- Si user voit "100% winrate" surprise → vérifier qu'aucun trade n'a `outcome: be` + manualPnl positif inattendu
- Migration HCAPTCHA_SECRET (manuel) : à faire dans hCaptcha dashboard → copier la "Secret key" → `firebase functions:secrets:set HCAPTCHA_SECRET`
- Mode groupe : tester sur un compte réel avec 2-3 comptes (perf perceptible si >5)

---

## 2026-05-12 — email_verified remis dans isAdmin() (rules + 4 CFs admin)

**Type** : security
**Fichiers** : `firestore.rules`, `functions/index.js`

### Contexte
User a vérifié son email admin (`zeldtradepro@gmail.com`) via `sendEmailVerification()` côté client. Reset de l'exception temporaire #2 documentée dans SECURITY.md.

### Changements
- `firestore.rules` `isAdmin()` : retire le commentaire temporaire, remet `&& request.auth.token.email_verified == true`
- `functions/index.js` : remet `|| !request.auth.token.email_verified` dans :
  - `deleteUserAccount` (ligne 394)
  - `generateProCode` (ligne 578)
  - `revokeProCode` (ligne 665)
  - `createCheckoutSession` (ligne 762)
- Deploy : rules + 3 CFs admin (`createCheckoutSession` pas redeploy car placeholders Stripe — sera reset au prochain deploy global)

### Impact
- ✅ Couche supplémentaire d'auth admin restaurée (un password volé seul ne suffit plus pour appeler les CFs admin)
- ✅ SECURITY.md exception #2 résolue → score auth admin +1
- ⚠️ Si un autre user veut un jour devenir admin, il devra vérifier son email avant

### À surveiller
- Vérifier que admin.html marche toujours (login + renderUsers + renderCodes + actions)
- Token client se rafraîchit à chaque login → si bug persiste = forcer logout/login

---

## 2026-05-12 — Audit consolidé 4 axes + docs/TODO.md créé

**Type** : docs
**Fichiers** : `docs/TODO.md` (nouveau), `docs/CHANGELOG-DEV.md`

### Contexte
Audit complet via 4 agents parallèles (sécu, qualité code, UX, infra) — 150+ findings consolidés. User veut bosser à budget zéro jusqu'à 1ère vente.

### Changements
- Création de `docs/TODO.md` : liste priorisée (15 CRITIQUE / 25 HAUT / 45 MOYEN / 65 BAS) avec distinction code vs manuel + plan d'attaque semaine 100% gratuit
- Stratégie validée : tout faisable à 0€ jusqu'à 1ère vente
- Recommandation infra : Firebase Hosting `zeldtrade.web.app` (free tier) au lieu de domaine custom payant
- Score sécurité visé : 9/10 sans dépenser un centime

### Impact
- Le user a une roadmap claire pour la semaine
- Future Claude (moi en session suivante) pourra reprendre le suivi via [docs/TODO.md](TODO.md)

### À surveiller
- Mettre à jour `TODO.md` à chaque action terminée (rayer + date)
- Findings critiques manuels (I1, I3, I5a/b/c, I6) sont prerequis pour activer les fixes code critiques (S1, S2 surtout)

---

## 2026-05-12 — v0.9.105 — Admin access débloqué + CSP fix

**Type** : fix + security
**Fichiers** : `firestore.rules`, `src/admin.html`
**Versions** : front 0.9.105, rules deployées

### Contexte
Le user a complètement perdu l'accès à `admin.html`. Diagnostic :
1. Rules Firestore exigeaient `email_verified == true` dans `isAdmin()` → bloquait toutes les lectures admin (renderUsers, renderCodes)
2. CSP admin.html n'autorisait pas `https://apis.google.com` (chargé par Firebase Auth pour reCAPTCHA invisible)

### Changements
- `firestore.rules` : `isAdmin()` retire le check `email_verified == true` (gardé email check uniquement)
- `src/admin.html` : `script-src` + `connect-src` ajoutent `https://apis.google.com` + `https://*.run.app`
- Cloud Functions admin (deleteUserAccount, generateProCode, revokeProCode, createCheckoutSession) : retire `|| !request.auth.token.email_verified`

### Impact
- ✅ Admin redevient accessible (login + actions)
- ⚠️ Sécurité légèrement dégradée (email_verified plus enforce) — acceptable car l'email admin est unique côté Firebase Auth
- À réactiver dès que `email_verified` du compte admin est `true` (cf SECURITY.md exception 2)

### À surveiller
- Le user a recréé manuellement le compte `zeldtradepro@gmail.com` (l'ancien UID est perdu)
- Vérifier que les codes Pro générés avant ne pointent plus vers cet ancien UID (sinon orphelins)

---

## 2026-05-12 — v0.9.104 — App Check init désactivé côté client

**Type** : fix
**Fichiers** : `src/js/firebase.js`

### Contexte
reCAPTCHA Enterprise retournait 401 → App Check SDK ne pouvait pas obtenir de token → cascade d'erreurs sur tous les appels Firebase (Auth signup/signin, Firestore reads, etc.).

### Changements
- `firebase.js` : commente le bloc `firebase.appCheck().activate(...)` → le SDK n'essaie plus d'obtenir de token
- Doc dans les commentaires sur comment réactiver (3 vérifs reCAPTCHA Enterprise key + App Check Apps + IAM role)

### Impact
- ✅ Les appels Firebase ne sont plus pollués par les tokens App Check invalides
- ⚠️ Plus de protection anti-bot au niveau App Check
- Mitigation : auth Firebase + isAdmin() + rate-limits Firestore restent en place

### À surveiller
- Côté Firebase Console App Check : Authentication doit rester en "Monitoring" (pas "Enforce") sinon les requêtes seront rejetées par le serveur

---

## 2026-05-12 — v0.9.103 — Backend Stripe stealth

**Type** : feat
**Fichiers** : `functions/index.js`, `functions/package.json`, `src/admin.html`, `src/js/admin.js`, `firestore.rules`

### Contexte
Préparation pour passage commercial. User a validé pricing : 19.90€/mois, 179€/an, 399€ lifetime (50 places). Veut **prix non publics** : seul l'admin envoie des liens checkout personnalisés aux bêta-testeurs.

### Changements

**Backend** :
- `functions/package.json` : ajout `stripe@^16.0.0`
- `functions/index.js` :
  - Nouvelle CF `createCheckoutSession` (admin only) — génère un Checkout link Stripe pour un user donné
  - Nouvelle CF `stripeWebhook` (`onRequest`, signature obligatoire) — gère `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`
  - 5 secrets `STRIPE_*` ajoutés en `defineSecret`
- `firestore.rules` : nouvelle collection `users/{uid}/data/stripe` (read owner, write CF only)

**Admin UI** :
- `src/admin.html` : modale Stripe (sélecteur tier, génération lien, copy URL)
- `src/js/admin.js` : `openStripeModal`, `doGenerateStripeLink`, `copyStripeUrl`
- Nouveau bouton `💳 Lien Stripe` dans la liste users

**Frontend public** : **AUCUN changement** (modèle stealth — rien de visible côté user)

### Impact
- UX user : zéro changement (par design — bêta-testeurs et nouveaux comptes voient exactement la même app)
- UX admin : nouveau bouton pour générer des liens checkout perso
- Sécurité : `stripeWebhook` valide signature HMAC obligatoirement, secrets en Secret Manager

### À surveiller / À FAIRE manuellement par le user
- Créer compte Stripe FR + 3 produits + récupérer prix_ids + webhook secret
- Setter les 5 secrets : `firebase functions:secrets:set STRIPE_SECRET_KEY` etc.
- Deploy : `firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook`

---

## 2026-05-12 — v0.9.102 — Hardening post-audit

**Type** : security + fix
**Fichiers** : `functions/index.js`, `src/js/store.js`, `src/js/modal.js`, `src/js/ui.js`, `src/js/auth.js`

### Contexte
Audit complet (4 agents parallèles) après v0.9.101. Trouvé plusieurs bugs critiques.

### Changements

**CRITIQUE — flow admin débloqué** :
- `enforceAppCheck` désactivé sur `deleteUserAccount`, `generateProCode`, `revokeProCode` (App Check cassé bloquait le flow admin "Activer Pro")

**CRITIQUE — cross-tenant** :
- `store.js _sanitizeTrade` : `screenshotPath` validé STRICTEMENT contre `_uid` courant (regex `users/${_uid}/trades/...`)
- Anti DevTools injection : un trade ne peut plus référencer le screenshot d'un autre user

**CRITIQUE — RGPD** :
- `auth.js deleteAccount` : supprime TOUS les screenshots Storage (`trades.filter(t => t.screenshotPath)`) avant `user.delete()`
- Sans ça les images restaient à vie dans le bucket → violation article 17

**HAUTS** :
- `modal.js handleShotFromBlob` : validation magic bytes (anti MIME-spoofing) + garde-fou taille 10 MB raw
- `ui.js openLightbox` : reconstruction via `createElement` + `src=` setter (plus d'`innerHTML` avec URL interpolée)
- `modal.js partial close` : rejet strict [1, 99]% (avant : 100% accepté à tort)
- `ui.js renderDetail` : affiche "(ignoré — P&L manuel)" si manualPnl override le partial

### Impact
- ✅ Score posture XSS/injection passe à 9.5/10
- ✅ Conformité RGPD article 17 (effacement)
- ⚠️ Score Cloud Functions à 7/10 (3 CFs sans App Check)

---

## 2026-05-12 — v0.9.101 — Sortie partielle (scale-out)

**Type** : feat
**Fichiers** : `src/js/store.js`, `src/js/calc.js`, `src/index.html`, `src/js/modal.js`, `src/js/ui.js`

### Contexte
Retour d'un bêta-testeur : besoin de tracker les trades où on prend 50% à mi-chemin puis on déplace le SL à BE. Aujourd'hui marqué BE mais le P&L réel est positif.

### Changements
- `_sanitizeTrade` : ajout `partialPercent` (1-99) et `partialPrice`
- `calc.trade()` : si `hasPartial` → P&L pondéré `pFrac × (partialPrice - entry) + (1-pFrac) × (resolvedExit - entry)`
- `index.html` : nouveau toggle "Sortie partielle (scale-out)" au step 3 du wizard
- `modal.js` : handlers du toggle + champs + intégration dans `save` et `wRecalc`
- `ui.js renderDetail` : ligne "Partial close: X% à Y" dans l'info card

### Impact
- UX : nouvelle feature, optionnelle (toggle off par défaut)
- Stats : un trade avec partial+BE pour l'outcome `be` mais P&L positif compte dans les stats. **À discuter** : devrait-il compter comme "win" pour winrate ? Pour l'instant non.

### À surveiller
- Tests `node test/calc.test.js` couvrent 3 variantes partial (BE/TP/SL) → tous passent

---

## 2026-05-11 — v0.9.100 — Lightbox screenshot dans détail trade

**Type** : feat
**Fichiers** : `src/js/ui.js`

### Contexte
User demandait que le screenshot soit visible **instantanément** quand on clique sur un trade dans le journal (pas seulement en édition).

### Changements
- `ui.js renderDetail` : nouvelle section "📸 Screenshot" qui charge async depuis Firebase Storage
- Click sur l'image → lightbox plein écran (overlay rgba 0.92, X de fermeture, Escape support)

### Impact
- UX : screenshot visible direct sur le panel détail
- Perf : charge async (placeholder "Chargement…")

---

## 2026-05-11 — v0.9.98 — Screenshots persistants (Firebase Storage)

**Type** : feat
**Fichiers** : `src/index.html`, `src/js/modal.js`, `src/js/store.js`, `src/js/firebase.js`, `functions/index.js`, `storage.rules`, `firebase.json`

### Contexte
User demandait : "quand je fais Ctrl+V un screenshot du trade, qu'il reste en stockage pour l'user et reste enregistré à vie sauf si on supprime le profil".

### Décision archi
- **Firebase Storage** (pas Firestore base64, pas localStorage) → 5GB free tier, sync cross-device, RGPD EU
- Path : `users/{uid}/trades/{tradeId}/screenshot.jpg`
- Compression client-side avant upload : JPEG max 1920×1080, qualité 0.85 → 0.4 si nécessaire (target <2 MB)

### Changements
- `firebase.json` : ajout section `storage`
- `storage.rules` : owner only + size 2MB max + content-type whitelist
- `src/index.html` : SDK firebase-storage-compat + CSP `firebasestorage.googleapis.com` + `*.firebasestorage.app` + zone screenshot UI au step 3
- `firebase.js` : init `_fbStorage`
- `store.js` :
  - `_sanitizeTrade` accepte `screenshotPath`
  - Helpers `uploadTradeScreenshot`, `getTradeScreenshotUrl`, `deleteTradeScreenshot`
  - `deleteTrade` supprime aussi le screenshot Storage
  - `addTrade` accepte `id` pré-généré (pour upload AVANT save)
- `modal.js` :
  - State : `shotBlob`, `shotExistingPath`, `shotPendingDelete`, `pendingTradeId`
  - Handlers : paste, drag&drop, file picker, replace, delete
  - Compression : `compressImage(blob, maxDim, quality)` via canvas
  - Save : upload puis attache `screenshotPath`
- `functions/index.js` `deleteUserAccount` : supprime aussi `users/{uid}/` du bucket Storage

### Impact
- 🟢 Feature majeure UX
- 🟢 RGPD : effacement Storage géré (cleanup à delete trade ET delete account)

---

## Versions précédentes (synthèse rapide)

Avant 0.9.98, les modifications suivantes ont été faites (cf `src/js/pages/changelog.js` pour le détail user-facing) :

- **0.9.95-0.9.97** : 5 ultraréview sécurité (rules hardening, Cloud Functions hardening, RGPD privacy.html, soft-delete users)
- **0.9.93** : Fix critique activation Pro (rule plan create→write)
- **0.9.94** : Suppression utilisateur admin (Cloud Function `deleteUserAccount` initiale)
- **0.9.89-0.9.92** : Premiers audits ultraréview (CSP, magic bytes, quota AI atomique, etc.)
- **< 0.9.89** : Itérations early-stage (cf changelog.js user)

---

## Conventions pour ajouter une entrée

À chaque nouvelle release ou modification non-trivial :

1. **Ajouter** une nouvelle section EN HAUT (juste sous "Format des entrées"), avec la date et la version
2. Utiliser le format ci-dessus avec **Contexte / Changements / Impact / À surveiller**
3. Ne **jamais** modifier les anciennes entrées (sauf typo correction marquée par `[edit YYYY-MM-DD]`)
4. Si une modification annule une précédente : type `revert` + référencer l'entrée annulée

Cela permet à Claude (et à toi) de retrouver le contexte d'une décision, même 6 mois après.
