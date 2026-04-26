#!/bin/bash
# ─── JTRADE LAUNCHER ──────────────────────────────────────────────────────────
# Lance Ollama si nécessaire, puis ouvre JTRADE dans le navigateur via HTTP.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Démarre Ollama si nécessaire
if ! curl -s --max-time 1 http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Ollama non détecté — démarrage..."
  if ! command -v ollama &> /dev/null; then
    echo "⚠  'ollama' introuvable. Installe-le depuis https://ollama.com puis relance."
  else
    nohup ollama serve > /tmp/jtrade-ollama.log 2>&1 &
    for i in $(seq 1 20); do
      sleep 0.5
      if curl -s --max-time 1 http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✓ Ollama prêt."
        break
      fi
    done
  fi
else
  echo "✓ Ollama déjà en cours d'exécution."
fi

# 2. Démarre le serveur HTTP local sur le port 8765 (obligatoire pour fetch() vers Ollama)
HTTP_PORT=8765
if ! lsof -ti tcp:$HTTP_PORT > /dev/null 2>&1; then
  echo "Démarrage du serveur HTTP sur le port $HTTP_PORT..."
  python3 -m http.server $HTTP_PORT --directory "$SCRIPT_DIR" > /tmp/jtrade-http.log 2>&1 &
  sleep 0.6
else
  echo "✓ Serveur HTTP déjà actif sur le port $HTTP_PORT."
fi

# 3. Ouvre JTRADE via HTTP
open "http://localhost:$HTTP_PORT"
