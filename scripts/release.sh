#!/bin/bash
# ─── JTRADE RELEASE ───────────────────────────────────────────────────────────
# Déploie la version actuelle de src/ sur :
#   1. Firebase Hosting (primaire, depuis v0.9.145) → https://zeldtrade.com
#   2. GitHub Pages (backup pendant la migration) → https://zeldaron.github.io/zeldtrade
#
# Usage : ./scripts/release.sh v0.5.1
#         ./scripts/release.sh          ← reprend le dernier tag
#         ./scripts/release.sh v0.5.1 --no-backup   ← skip gh-pages

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Args
VERSION=""
SKIP_BACKUP=false
for arg in "$@"; do
    case "$arg" in
        --no-backup) SKIP_BACKUP=true ;;
        -*) echo "Flag inconnu : $arg" ; exit 1 ;;
        *)  VERSION="$arg" ;;
    esac
done

if [ -z "$VERSION" ]; then
    VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [ -z "$VERSION" ]; then
        echo "Usage : ./scripts/release.sh v0.5.1 [--no-backup]"
        exit 1
    fi
    echo "Aucune version précisée — utilise le dernier tag : $VERSION"
fi

# Format attendu : vX.Y.Z
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Format invalide. Utilise : vX.Y.Z  (ex: v0.5.1)"
    exit 1
fi

echo ""
echo "======================================="
echo "  Release JTRADE $VERSION"
echo "======================================="

# 1. Tag de version (si pas encore créé)
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "  Tag $VERSION déjà existant."
else
    git tag "$VERSION"
    git push origin "$VERSION"
    echo "  Tag $VERSION créé et poussé."
fi

# 2. Vérifie que src/ est propre — auto-commit si besoin
if [ -n "$(git status --porcelain src/)" ]; then
    echo ""
    echo "  ⚠  Modifications non commitées dans src/ — commit automatique..."
    git add src/
    git commit -m "chore: release $VERSION — sync src/"
    echo "  ✓  Committé."
fi

# 3. Deploy primaire : Firebase Hosting
echo ""
echo "  → Déploiement sur Firebase Hosting..."
firebase deploy --only hosting --non-interactive
echo "  ✓  Firebase Hosting déployé."

# 4. Deploy backup : GitHub Pages (sauf si --no-backup)
if [ "$SKIP_BACKUP" = false ]; then
    echo ""
    echo "  → Déploiement backup sur GitHub Pages..."
    COMMIT=$(git subtree split --prefix src HEAD)
    if git push origin "${COMMIT}:refs/heads/gh-pages" --force --quiet; then
        echo "  ✓  GitHub Pages déployé."
    else
        echo "  ⚠  Échec push gh-pages (non bloquant — Firebase reste primaire)."
    fi
else
    echo ""
    echo "  ⏭  Skip backup gh-pages (--no-backup)."
fi

echo ""
echo "======================================="
echo "  Primaire (live)     : https://zeldtrade.com"
echo "  Firebase auto       : https://zeldtrade.web.app"
if [ "$SKIP_BACKUP" = false ]; then
    echo "  Backup (gh-pages)   : https://zeldaron.github.io/zeldtrade"
fi
echo "  Version             : $VERSION"
echo "======================================="
echo ""
