# JTRADE — Guide d'utilisation

Journal de trading personnel pour contrats futures CME (MES1, ES1, MNQ1, NQ1).  
Fonctionne entièrement hors ligne, sans compte, sans serveur distant — toutes les données sont stockées localement dans ton navigateur.

---

## Sommaire

1. [Prérequis](#prérequis)
2. [Installation et lancement — Mac](#installation-mac)
3. [Installation et lancement — Windows](#installation-windows)
4. [Premier démarrage](#premier-démarrage)
5. [Les pages de l'application](#les-pages)
6. [Ajouter un trade](#ajouter-un-trade)
7. [Analyse IA (Groq Vision)](#analyse-ia)
8. [Comptes Apex et objectifs](#comptes-apex)
9. [Export / Import des données](#export--import)
10. [Dépannage](#dépannage)

---

## Prérequis

### Obligatoire
| Outil | Utilité | Lien |
|-------|---------|------|
| **Python 3** | Fait tourner un petit serveur web local (requis pour que l'IA et certains éléments fonctionnent correctement) | [python.org/downloads](https://www.python.org/downloads/) |

### Optionnel
| Outil | Utilité | Lien |
|-------|---------|------|
| **Clé Groq** (gratuite) | Analyse automatique des screenshots TradingView par IA | [console.groq.com](https://console.groq.com) |

> **Aucune installation de Node.js, npm ou autre framework n'est nécessaire.**

---

## Installation Mac

### Étape 1 — Vérifier Python

Python 3 est pré-installé sur macOS (depuis macOS 12+). Vérifie dans le Terminal :

```bash
python3 --version
```

Si la commande retourne `Python 3.x.x`, tu es bon. Sinon, télécharge Python sur [python.org](https://www.python.org/downloads/).

### Étape 2 — Rendre le lanceur exécutable (une seule fois)

Ouvre le Terminal, navigue jusqu'au dossier JTRADE et tape :

```bash
chmod +x launch.sh
```

### Étape 3 — Lancer l'application

Double-clique sur **`launch.sh`** dans le Finder, ou depuis le Terminal :

```bash
./launch.sh
```

Le navigateur s'ouvre automatiquement sur `http://localhost:8765`.

> Si macOS bloque le fichier ("impossible d'ouvrir car le développeur n'est pas identifié"), clique droit → **Ouvrir** → confirmer.

---

## Installation Windows

### Étape 1 — Installer Python

1. Va sur [python.org/downloads](https://www.python.org/downloads/)
2. Télécharge la dernière version de Python 3
3. Lance l'installateur et **coche impérativement "Add Python to PATH"** avant de cliquer sur *Install Now*

Vérifie l'installation dans l'invite de commande (Win + R → `cmd`) :

```cmd
python --version
```

### Étape 2 — Lancer l'application

Double-clique sur **`launch.bat`** dans l'explorateur de fichiers.

Une fenêtre noire s'ouvre brièvement, puis le navigateur s'ouvre sur `http://localhost:8765`.

> **Important :** laisse la fenêtre noire ouverte tant que tu utilises l'app. La fermer arrête le serveur.

> Si Windows Defender bloque le fichier, clique sur **"Informations complémentaires"** puis **"Exécuter quand même"**.

---

## Premier démarrage

### Créer un compte

Au premier lancement, un écran de connexion s'affiche. Clique sur **"Créer un compte"**, choisis un identifiant et un mot de passe.

> Les comptes sont stockés localement dans ton navigateur (localStorage). Pas de compte en ligne, aucune donnée envoyée sur internet.

### Configurer tes comptes Apex

1. Va dans **Réglages** (icône roue dentée dans la barre latérale)
2. Section **"Mes Comptes"** → clique **"+ Ajouter un compte"**
3. Renseigne : nom (ex : `APEX-001`), statut (Évaluation ou Funded), et sélectionne le preset Apex correspondant à ta taille de compte
4. Les paramètres (capital, drawdown, objectif, loss limit) se remplissent automatiquement depuis le preset

---

## Les pages

| Page | Description |
|------|-------------|
| **Journal** | Liste de tous les trades. Clique sur un trade pour voir son détail complet (R:R, risk %, P&L brut/net, frais). |
| **Dashboard** | Vue d'ensemble : courbe de P&L, statistiques globales, répartition par instrument et par setup. |
| **Analytics** | Analyse approfondie : distribution des R:R, journées types, win rate par configuration. |
| **Objectifs** | Suivi en temps réel des règles Apex (drawdown, consistency rule, loss limit, safety net pour les comptes funded). |
| **Calendrier** | Vue mensuelle avec P&L par journée et récapitulatif du mois. Clique sur un jour pour voir le détail. |
| **Micro** | Simulateur de charges micro-entrepreneur : calcul URSSAF, CFP, versement libératoire, conversion USD→EUR. |
| **Réglages** | Configuration des comptes, spreads, clé Groq, export/import des données. |

---

## Ajouter un trade

1. Clique sur le bouton vert **"Nouveau trade"** (barre latérale gauche) ou appuie sur **⌘N** (Mac) / **Ctrl+N** (Windows)
2. **Étape 1 — Direction :** choisis Long ou Short
3. **Étape 2 — Screenshot :** colle ton screenshot TradingView (**⌘V** / **Ctrl+V**), glisse-dépose une image, ou clique pour parcourir
   - Si tu as une clé Groq, l'IA lit automatiquement l'Entry, le SL et le TP1 depuis le screenshot
   - Sinon, saisis les niveaux manuellement dans le champ texte
4. **Étape 3 — Détails :** vérifie les niveaux, sélectionne l'instrument, le compte et le nombre de contrats
   - Le calcul R:R, le risque $ et le P&L net (après frais) se mettent à jour en temps réel
5. Clique **Enregistrer**

### Clôturer un trade

Sélectionne le trade dans la liste → clique **Modifier** → ouvre la section *"Setup / Notes / Résultat"* → choisis le résultat (Win / Loss / Break-Even) et saisis le prix de sortie si disponible.

---

## Analyse IA

JTRADE utilise **Groq Vision** (gratuit) pour lire automatiquement les screenshots TradingView.

### Obtenir une clé Groq (gratuit)

1. Va sur [console.groq.com](https://console.groq.com)
2. Crée un compte (gratuit, pas de carte bancaire requise)
3. Menu **"API Keys"** → **"Create API key"**
4. Copie la clé (commence par `gsk_...`)

### Configurer la clé dans JTRADE

1. **Réglages** → section **"Intelligence Artificielle"**
2. Colle ta clé dans le champ, clique **Sauvegarder**

### Utiliser l'analyse IA

Dans l'étape 2 du wizard :
- Colle ton screenshot TradingView directement avec **⌘V** / **Ctrl+V**
- L'IA lit les valeurs du dialogue TradingView (Entry, SL, TP1) et les pré-remplit
- Si la lecture échoue, saisis les niveaux manuellement dans le champ texte en dessous

> **Conseil :** cadre le screenshot directement sur le dialogue de TradingView pour de meilleurs résultats.

---

## Comptes Apex

### Types de comptes

Les presets Apex EOD (25K / 50K / 100K / 150K) sont pré-configurés avec les règles officielles : drawdown max, objectif de profit, loss limit journalière, nombre de contrats max.

### Comptes en Évaluation (EVAL)

La page **Objectifs** suit en temps réel :
- Progression vers l'objectif de profit
- Drawdown utilisé
- Perte du jour vs limite
- Nombre de jours tradés minimum (5)
- Règle de consistance (aucun jour ne doit représenter plus de 30% du profit total)

### Comptes Funded (PA)

En plus des règles EVAL, la page **Objectifs** calcule :
- Le **plancher trailing EOD** (mis à jour chaque soir)
- La **Safety Net** : une fois atteinte, le plancher est verrouillé au solde initial
- Le **score de consistance** (limite 50% : le meilleur jour ne peut pas dépasser 50% du profit total)
- L'éligibilité au payout

### Groupes de comptes

Dans **Réglages → Groupes de trading**, tu peux créer un groupe contenant plusieurs comptes. Lors de l'ajout d'un trade, sélectionne le groupe pour enregistrer le même trade sur tous les comptes du groupe simultanément.

---

## Export / Import

### Exporter tes données

**Réglages → Données → Exporter** télécharge un fichier JSON `jtrade-AAAA-MM-JJ.json` avec tous tes trades.

> Fais des exports réguliers comme sauvegarde — les données sont dans le localStorage du navigateur et peuvent être perdues si tu vides le cache.

### Importer des données

**Réglages → Données → Importer** charge un fichier JSON exporté précédemment.

> Compatible avec les exports d'anciennes versions de JTRADE.

### Changer de navigateur ou d'ordinateur

1. Exporte tes données sur l'ancienne machine
2. Copie le dossier JTRADE sur la nouvelle machine
3. Lance l'app et crée un compte avec le **même identifiant**
4. Importe le fichier JSON exporté

---

## Dépannage

### L'application ne s'ouvre pas (Mac)

- Vérifie que Python 3 est installé : `python3 --version` dans le Terminal
- Vérifie que le port 8765 est libre : `lsof -i :8765` — si occupé, ferme l'ancienne instance
- Lance manuellement : `python3 -m http.server 8765 --directory /chemin/vers/JTRADE` puis ouvre `http://localhost:8765`

### L'application ne s'ouvre pas (Windows)

- Vérifie que Python est installé et dans le PATH : `python --version` dans l'invite de commande
- Réinstalle Python en cochant **"Add Python to PATH"**
- Lance manuellement : ouvre l'invite de commande dans le dossier JTRADE, tape `python -m http.server 8765` puis ouvre `http://localhost:8765` dans ton navigateur

### L'IA ne fonctionne pas

- Vérifie que ta clé Groq est bien configurée dans **Réglages → IA**
- La clé doit commencer par `gsk_`
- Le screenshot doit être cadré sur le dialogue TradingView (Entry / SL / TP1 visibles)
- Si l'analyse échoue, saisis les niveaux manuellement dans le champ texte

### Les données ont disparu

- Les données sont liées au **profil utilisateur** dans le navigateur. Vérifie que tu es connecté avec le bon identifiant
- Si tu as vidé le cache du navigateur, les données localStorage ont été supprimées → restaure depuis un export JSON

### Le P&L affiché semble incorrect

- Les trades **Win/Loss/BE sans prix de sortie** utilisent TP1/SL/Entry comme prix estimé (affiché avec `~`)
- Le P&L net = P&L brut − commissions (2.14 $/side × 2 × contrats) − spread (configurable dans Réglages)
- Pour un calcul exact, renseigne le prix de sortie réel dans le trade

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| **⌘N** / **Ctrl+N** | Nouveau trade |
| **⌘V** / **Ctrl+V** | Coller un screenshot dans l'étape 2 du wizard |
| **Échap** | Fermer la fenêtre de saisie |

---

*JTRADE v0.5.0 — Application locale, aucune donnée envoyée sur internet.*
