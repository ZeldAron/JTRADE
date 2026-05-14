# Discord ZeldTrade HQ — Setup & permissions de référence

> **Source de vérité** pour la structure du serveur Discord. À utiliser comme checklist quand tu audites les droits.

Dernière mise à jour : 2026-05-14 (v0.9.123).

---

## 🎭 Rôles et hiérarchie (ordre important — du haut au bas)

**Projet solo** : un seul admin (toi). Pas de rôles `Dev` ni `Modérateur` — supprimés dans Paramètres → Rôles → poubelle 🗑️.

L'ordre dans **Paramètres du serveur → Rôles** détermine la priorité. Du plus haut au plus bas :

1. `👑 Fondateur` (toi, unique) — toutes permissions (Administrateur), couleur or `#FFD700`
2. `💎 Lifetime` — accès Pro+ canaux exclusifs, couleur violet clair `#A78BFA`
3. `⚡ Pro` — accès #pro-only, #codes-promo, couleur violet `#7C3AED`
4. `🧪 Bêta Testeur` — accès #beta-feedback, couleur ambre `#D29922`
5. `🆓 Basic` — utilisateur loggé sur ZeldTrade (sans plan payant), couleur grise `#8B949E`
6. **Prop Firms (auto-assignables via réactions)** : `🔵 Apex`, `🟢 Topstep`, `🟠 FTMO`, `🟣 Lucid`, `⚪ Autre` — couleurs assorties
7. `Membre` — rôle de base après avoir cliqué ✅ dans #règles
8. `@everyone` — non-membre, accès limité à #règles uniquement

**Permission `@everyone` au niveau serveur** :
- ✅ Lire les messages
- ❌ Voir les salons (désactivé GLOBALEMENT — sera réactivé canal par canal)
- ❌ Envoyer des messages
- ❌ Joindre les vocaux
- ❌ Toute autre permission "Mod"

---

## 🏛️ Structure simplifiée (v0.9.123) — 4 catégories

Décision admin : passer de 8 catégories à **4 catégories** pour rester clean en phase beta. À étoffer plus tard quand la communauté grandit.

```
👋 ACCUEIL        (visible @everyone, point d'entrée)
   ├── #bienvenue      (read-only, Carl-bot welcome)
   ├── #règles         (read-only, reaction role ✅ → Membre)
   ├── #choix-roles    (reaction roles : prop firms, langue)
   ├── #annonces       (read-only sauf Fondateur)
   └── #liens          (read-only — app, guide, contact)

💬 COMMUNAUTÉ     (Membre)
   ├── #général
   ├── #conseil-trading
   ├── #flex             (wins/losses des membres)
   └── #new-users        (PUBLIC visible @everyone — webhook ZeldTrade Signups poste)

🛠️ ZELDTRADE      (Membre)
   ├── #support
   ├── #bugs
   ├── #suggestions
   ├── #roadmap          (read-only)
   └── #beta-feedback    (Bêta Testeur uniquement — à créer plus tard)

🔧 ADMIN          (Fondateur seul)
   └── #support-ticket   (webhook ZeldTrade Support poste)
       (plus tard : #déploiements, #dev-logs, #nouvelles-ventes)
```

**Catégories supprimées** (vides ou fusionnées) :
- ~~📣 ANNONCES~~ → fusionnée dans 👋 ACCUEIL (canal `#annonces`)
- ~~📌 INFORMATIONS~~ → fusionnée dans 👋 ACCUEIL (canal `#liens`)
- ~~Assistance~~ → fusionnée dans 🛠️ ZELDTRADE (canaux support/bugs/suggestions)
- ~~Développement~~ → fusionnée dans 🛠️ ZELDTRADE (canal roadmap)
- ~~Performance~~ → reportée (sera créée quand on lance les stats hebdo)
- ~~Offres & Accès~~ → reportée (sera créée quand on a des Pro)
- ~~Vocal~~ → reportée (peut être ajoutée plus tard si besoin)

---

## 📊 Matrice canal × rôle

Légende :
- `R` = peut lire (voir le salon + lire l'historique)
- `W` = peut écrire (envoyer messages + réagir)
- `—` = pas d'accès (canal invisible)

### 📌 INFORMATIONS (catégorie publique, vue par tous)

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#règles` | R | R | R | R | R | RW |
| `#annonces` | R | R | R | R | R | RW |
| `#roadmap` | R | R | R | R | R | RW |
| `#liens` | R | R | R | R | R | RW |

> **Réaction role** sur `#règles` : Carl-bot embed avec ✅ → attribue `Membre`.

### 👋 ACCUEIL (membres seulement)

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#bienvenue` | — | R | R | R | R | RW |
| `#présentation` | — | RW | RW | RW | RW | RW |
| `#rôles` | — | R | R | R | R | RW |

> `#rôles` : Carl-bot embed avec réactions pour s'auto-attribuer les rôles Prop Firm.

### 💬 COMMUNAUTÉ

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#général` | — | RW | RW | RW | RW | RW |
| `#trading-talk` | — | RW | RW | RW | RW | RW |
| `#prop-firms` | — | RW | RW | RW | RW | RW |
| `#wins-losses` | — | RW | RW | RW | RW | RW |

### 🛠️ ZELDTRADE

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#support` | — | RW | RW | RW | RW | RW |
| `#bugs` | — | RW | RW | RW | RW | RW |
| `#suggestions` | — | RW | RW | RW | RW | RW |
| `#feedback` | — | RW | RW | RW | RW | RW |
| `#beta-feedback` | — | — | RW | — | — | RW |

### 💰 OFFRES & ACCÈS

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#codes-promo` | — | — | — | R | R | RW |
| `#pro-only` | — | — | R | RW | RW | RW |

### 📊 PERFORMANCE

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#stats-du-mois` | — | R | R | R | R | RW |
| `#objectifs` | — | RW | RW | RW | RW | RW |

### 🌍 PUBLIC (visibles @everyone)

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#new-users` | R | R | R | R | R | RW |

> Choix de l'admin (v0.9.123) : les nouvelles inscriptions sont visibles publiquement (effet "social proof"). Le webhook ZeldTrade Bot écrit, personne d'autre.

### 🔧 ADMIN (privée, Fondateur uniquement)

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `#support-tickets` | — | — | — | — | — | RW |
| `#nouvelles-ventes` | — | — | — | — | — | RW |
| `#dev-logs` | — | — | — | — | — | RW |
| `#déploiements` | — | — | — | — | — | RW |

> Webhooks autorisés à écrire (en plus de toi). Personne d'autre ne voit.

### 🔊 VOCAL

| Canal | @everyone | Membre | Bêta | Pro | Lifetime | Fondateur |
|---|---|---|---|---|---|---|
| `Trading Room` | — | Connect | Connect | Connect | Connect | All |
| `Focus Session` | — | Connect | Connect | Connect | Connect | All |

---

## ✅ Checklist d'audit (à cocher au fur et à mesure)

### Étape 1 — Vérifier les rôles
- [ ] **Supprimer** `🛠️ Dev` et `🔨 Modérateur` (projet solo, plus besoin)
- [ ] `👑 Fondateur` a "Administrateur" : ✅
- [ ] `Membre` n'a AUCUNE permission spéciale (juste un rôle marqueur)
- [ ] L'ordre des rôles est respecté (Fondateur > Lifetime > Pro > Bêta > Basic > Prop Firms > Membre > @everyone)

### Étape 2 — @everyone global
Paramètres du serveur → Rôles → @everyone → Permissions :
- [ ] "Voir les salons" : ❌ désactivé
- [ ] "Envoyer des messages" : ❌ désactivé
- [ ] "Lire l'historique des messages" : ❌ désactivé
- [ ] Toutes les permissions Mod : ❌ désactivées

### Étape 3 — Catégorie 📌 INFORMATIONS
Modifier la catégorie → Permissions :
- [ ] `@everyone` : "Voir les salons" ✅ activé, "Envoyer des messages" ❌
- [ ] `Membre` : hérite (rien à ajouter)
- [ ] `👑 Fondateur` : tout ✅ (hérite déjà via Administrateur)

### Étape 4 — Catégorie 👋 ACCUEIL
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ✅, "Envoyer des messages" ✅ (sauf #bienvenue + #rôles qui sont read-only)
- [ ] Override `#bienvenue` : `Membre` "Envoyer des messages" ❌
- [ ] Override `#rôles` : `Membre` "Envoyer des messages" ❌, "Ajouter des réactions" ✅

### Étape 5 — Catégorie 💬 COMMUNAUTÉ
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ✅, "Envoyer des messages" ✅

### Étape 6 — Catégorie 🛠️ ZELDTRADE
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ✅, "Envoyer des messages" ✅
- [ ] Override `#beta-feedback` : `Membre` "Voir les salons" ❌, `🧪 Bêta Testeur` "Voir les salons" ✅ + "Envoyer des messages" ✅

### Étape 7 — Catégorie 💰 OFFRES & ACCÈS
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ❌ (cette catégorie est invisible par défaut)
- [ ] Override `#pro-only` : `⚡ Pro` "Voir les salons" ✅ + "Envoyer des messages" ✅, idem `💎 Lifetime`, `🧪 Bêta Testeur` "Voir les salons" ✅ (lecture seule)
- [ ] Override `#codes-promo` : `⚡ Pro` + `💎 Lifetime` "Voir les salons" ✅, lecture seule (pas d'envoi)

### Étape 8 — Catégorie 📊 PERFORMANCE
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ✅, "Envoyer des messages" ✅ (sauf #stats-du-mois read-only)
- [ ] Override `#stats-du-mois` : `Membre` "Envoyer des messages" ❌

### Étape 9 — Canal public `#new-users`
Soit le canal est hors catégorie ADMIN (déplacer en haut, hors de toute catégorie privée), soit override :
- [ ] `@everyone` : "Voir les salons" ✅, "Envoyer des messages" ❌ (seul le webhook ZeldTrade Bot poste)
- [ ] Tout le monde voit, personne ne peut spammer

### Étape 10 — Catégorie 🔧 ADMIN (privée — toi seul)
- [ ] `@everyone` : "Voir les salons" ❌ (TRÈS IMPORTANT)
- [ ] `Membre` + tous les autres rôles : aucune override (hérite du @everyone = invisible)
- [ ] `👑 Fondateur` : tout ✅ (hérite via Administrateur — pas besoin d'override explicite)
- [ ] Carl-bot (rôle bot) : "Voir les salons" si tu veux qu'il loggue / réagisse, sinon laisse sans

### Étape 11 — Catégorie 🔊 VOCAL
- [ ] `@everyone` : "Voir les salons" ❌
- [ ] `Membre` : "Voir les salons" ✅, "Se connecter" ✅, "Parler" ✅
- [ ] "Vidéo" ✅ pour Membre (utile en focus session)

### Étape 12 — Permissions des webhooks
Les webhooks n'ont pas besoin de rôle Discord — ils utilisent leur token URL. Mais vérifie que les canaux où ils postent acceptent les webhooks :
- [ ] `#support-tickets` : webhook `ZeldTrade Support` actif (déjà configuré)
- [ ] `#new-users` : webhook `ZeldTrade Signups` actif
- [ ] Si tu ajoutes A/B/C plus tard : nouveaux webhooks pour `#déploiements`, `#dev-logs`, `#nouvelles-ventes`

---

## 🚨 Pièges classiques à éviter

1. **`👑 Fondateur` = unique rôle avec Administrateur**
   Comme tu es seul à administrer, c'est OK que tu aies Administrateur. Mais ATTENTION : un compte personnel compromis (mot de passe leak, MFA bypass) donne accès TOTAL au serveur. **Active la MFA 2-Step sur ton compte Discord** : Paramètres utilisateur → Mon compte → Authentification à 2 facteurs.

2. **L'ordre des rôles compte pour les overrides**
   Les rôles plus hauts dans la liste écrasent ceux du bas en cas de conflit. Pour qu'un `⚡ Pro` voie `#pro-only` malgré l'invisibilité `@everyone`, le rôle Pro doit avoir l'override "Voir les salons ✅" sur le canal. Et le rôle `⚡ Pro` doit être au-dessus de `Membre`.

3. **Permissions au niveau Catégorie vs Canal**
   Quand tu ajoutes un canal dans une catégorie avec "Synchroniser" (par défaut), il hérite. Si tu modifies les perms du canal seul, il devient "désynchronisé" — un petit signe apparaît. Penser à toujours **désynchroniser explicitement** quand on veut un comportement différent.

4. **Réactions sur reaction-role**
   Si `Membre` n'a pas "Ajouter des réactions" dans `#règles`, le système Carl-bot ne marche pas (l'user ne peut pas cliquer ✅). À vérifier override par override.

5. **Webhooks peuvent être détournés**
   Si quelqu'un récupère l'URL d'un webhook (fuite, screenshot, log), il peut poster dans ton canal sans aucune limite (sauf le rate-limit Discord 30/min). En cas de fuite : **régénérer immédiatement l'URL** dans le panel Discord du webhook, puis mettre à jour le secret Firebase via `firebase functions:secrets:set NAME --data-file -` (stdin).

---

## 🔄 Évolution du document

À chaque ajout/suppression de canal ou changement de rôle, mettre à jour ce fichier. Les permissions Discord ne sont pas versionnées dans git — ce doc est la seule source de vérité reproductible.
