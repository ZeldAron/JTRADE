# JTRADE

Journal de trading personnel pour contrats futures CME (MES1, ES1, MNQ1, NQ1).  
Application 100 % locale — aucune donnée envoyée sur internet.

## Lancer l'application

### Mac
```bash
chmod +x scripts/launch.sh   # une seule fois
./scripts/launch.sh
```

### Windows
Double-clique sur `scripts/launch.bat`

Ouvre automatiquement `http://localhost:8765` dans le navigateur.  
**Prérequis : Python 3** — [python.org/downloads](https://www.python.org/downloads/)

---

## Créer les installeurs

### Mac — génère `dist/JTRADE.dmg`
```bash
python3 build/build_mac.py
```

### Windows — génère `dist/JTRADE_Setup.exe`
```bash
python build/build_windows.py
```
> À exécuter sur une machine Windows. Installe PyInstaller + Inno Setup automatiquement.

---

## Structure du projet

```
JTRADE/
├── src/              # Application web (HTML · CSS · JS vanilla)
├── scripts/          # Lanceurs directs (launch.sh / launch.bat)
├── build/            # Scripts de packaging (Mac DMG, Windows EXE)
├── dist/             # Sorties des builds (gitignored)
├── docs/             # Documentation (GUIDE.md, PDF)
└── .github/          # GitHub Actions (build automatique)
```

---

## Stack

HTML · CSS · JavaScript vanilla · Python 3 (serveur local)  
Analyse IA : [Groq Vision](https://console.groq.com) (optionnel, gratuit)
