#!/bin/bash
# ─── JTRADE LAUNCHER ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/../src" && pwd)"
HTTP_PORT=8765

# 1. Démarre le serveur HTTP (requis pour fetch() et l'API Groq)
if ! lsof -ti tcp:$HTTP_PORT > /dev/null 2>&1; then
  echo "Démarrage du serveur HTTP sur le port $HTTP_PORT..."
  python3 -m http.server $HTTP_PORT --directory "$SRC_DIR" > /tmp/jtrade-http.log 2>&1 &
  sleep 0.6
else
  echo "✓ Serveur HTTP déjà actif sur le port $HTTP_PORT."
fi

# 2. Ouvre JTRADE dans le navigateur
open "http://localhost:$HTTP_PORT"
