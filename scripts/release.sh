#!/bin/bash
# ─── JTRADE RELEASE ───────────────────────────────────────────────────────────
# Déploie la version actuelle de src/ sur GitHub Pages.
#
# Usage : ./scripts/release.sh v0.5.1
#         ./scripts/release.sh          ← reprend le dernier tag

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Version
if [ -n "$1" ]; then
    VERSION="$1"
else
    VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [ -z "$VERSION" ]; then
        echo "Usage : ./scripts/release.sh v0.5.1"
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

# 2. Déploie src/ sur gh-pages (sans Actions, depuis le terminal)
echo ""
echo "  Déploiement sur GitHub Pages..."
COMMIT=$(git subtree split --prefix src HEAD)
git push origin "${COMMIT}:refs/heads/gh-pages" --force --quiet
echo "  Déployé."

echo ""
echo "======================================="
echo "  En ligne (30s) : https://zeldaron.github.io/JTRADE"
echo "  Version         : $VERSION"
echo "======================================="
echo ""
