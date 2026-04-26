#!/usr/bin/env python3
"""
Build JTRADE.app + JTRADE.dmg pour macOS
Usage : python3 build_mac.py
Résultat : JTRADE.dmg dans le dossier courant
"""

import os
import sys
import shutil
import subprocess
import stat
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
APP_NAME = "JTRADE"
VERSION  = "0.5.0"
BUNDLE_ID = "com.jtrade.app"
PORT      = 8765

ROOT      = Path(__file__).parent.parent   # racine du projet
SRC       = ROOT / "src"
BUILD_DIR = ROOT / "dist" / "_build_mac"
APP_BUNDLE = BUILD_DIR / f"{APP_NAME}.app"
DMG_PATH  = ROOT / "dist" / f"{APP_NAME}.dmg"

WEB_FILES = ["index.html", "js", "css"]
DOCS      = [("../docs/GUIDE.md", "GUIDE.md"),
             ("../docs/JTRADE_Guide.pdf", "JTRADE_Guide.pdf")]

# ── Script lanceur (MacOS/JTRADE) ─────────────────────────────────────────────
LAUNCHER_SH = f"""\
#!/bin/bash
# JTRADE — lanceur principal
RESOURCES="$( cd "$( dirname "$0" )/../Resources" && pwd )"

# Cherche Python 3
PY=""
for c in python3 /usr/bin/python3 /usr/local/bin/python3 /opt/homebrew/bin/python3; do
    if command -v "$c" &>/dev/null && "$c" -c "import sys; sys.exit(0 if sys.version_info >= (3,6) else 1)" 2>/dev/null; then
        PY="$c"; break
    fi
done

if [ -z "$PY" ]; then
    osascript -e 'display dialog "Python 3 est requis pour lancer JTRADE.\\n\\nInstalle-le sur python.org puis relance l'\''application." buttons {{"Télécharger", "Annuler"}} default button "Télécharger" with icon stop'
    open "https://www.python.org/downloads/"
    exit 1
fi

PORT={PORT}

# Ferme une éventuelle instance précédente sur ce port
lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
sleep 0.3

# Lance le serveur HTTP en arrière-plan
"$PY" -m http.server $PORT --directory "$RESOURCES" > /tmp/jtrade-server.log 2>&1 &
SERVER_PID=$!
sleep 0.7

# Ouvre le navigateur
open "http://localhost:$PORT"

# Reste actif tant que le serveur tourne
wait $SERVER_PID
"""

# ── Info.plist ────────────────────────────────────────────────────────────────
INFO_PLIST = f"""\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>             <string>{APP_NAME}</string>
  <key>CFBundleDisplayName</key>      <string>{APP_NAME}</string>
  <key>CFBundleIdentifier</key>       <string>{BUNDLE_ID}</string>
  <key>CFBundleVersion</key>          <string>{VERSION}</string>
  <key>CFBundleShortVersionString</key><string>{VERSION}</string>
  <key>CFBundleExecutable</key>       <string>{APP_NAME}</string>
  <key>CFBundlePackageType</key>      <string>APPL</string>
  <key>CFBundleSignature</key>        <string>????</string>
  <key>LSMinimumSystemVersion</key>   <string>12.0</string>
  <key>NSHighResolutionCapable</key>  <true/>
  <key>LSUIElement</key>              <false/>
</dict>
</plist>
"""

# ── Helpers ───────────────────────────────────────────────────────────────────
def run(cmd):
    print("  $", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True)

def step(msg):
    print(f"\n[ {msg} ]")

# ── Build ─────────────────────────────────────────────────────────────────────
def build():
    print(f"\n{'='*55}")
    print(f"  Build {APP_NAME} v{VERSION} — macOS")
    print(f"{'='*55}\n")

    # Nettoyage
    step("Nettoyage")
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    if DMG_PATH.exists():
        DMG_PATH.unlink()
    BUILD_DIR.mkdir(parents=True)
    print("  OK")

    # Structure du bundle
    step("Création du bundle .app")
    macos_dir     = APP_BUNDLE / "Contents" / "MacOS"
    resources_dir = APP_BUNDLE / "Contents" / "Resources"
    macos_dir.mkdir(parents=True)
    resources_dir.mkdir(parents=True)

    # Launcher
    launcher = macos_dir / APP_NAME
    launcher.write_text(LAUNCHER_SH)
    launcher.chmod(launcher.stat().st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    print("  Launcher : OK")

    # Info.plist
    (APP_BUNDLE / "Contents" / "Info.plist").write_text(INFO_PLIST)
    print("  Info.plist : OK")

    # Copie des fichiers web
    step("Copie des fichiers web")
    for item in WEB_FILES:
        src = SRC / item
        dst = resources_dir / item
        if not src.exists():
            print(f"  MANQUANT : {item}")
            continue
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print(f"  {item} : OK")
    for (rel_src, dest_name) in DOCS:
        src = (ROOT / "docs" / dest_name)
        if src.exists():
            shutil.copy2(src, resources_dir / dest_name)
            print(f"  {dest_name} : OK")

    # Staging pour le DMG (app + alias Applications)
    step("Préparation du DMG")
    staging = BUILD_DIR / "dmg"
    staging.mkdir()
    shutil.copytree(APP_BUNDLE, staging / f"{APP_NAME}.app",
                    symlinks=True)
    (staging / "Applications").symlink_to("/Applications")
    print("  Staging : OK")

    # Création du DMG
    step("Création du DMG")
    run([
        "hdiutil", "create",
        "-volname", APP_NAME,
        "-srcfolder", str(staging),
        "-ov", "-format", "UDZO",
        str(DMG_PATH),
    ])

    size_kb = DMG_PATH.stat().st_size // 1024
    print(f"\n{'='*55}")
    print(f"  Fichier : {DMG_PATH}")
    print(f"  Taille  : {size_kb} Ko")
    print(f"\n  Pour installer : ouvre le .dmg et glisse JTRADE.app")
    print(f"  dans le dossier Applications.")
    print(f"\n  Note : au premier lancement macOS peut bloquer l'app.")
    print(f"  Clique droit → Ouvrir → confirmer.")
    print(f"{'='*55}\n")

    # Nettoyage build intermédiaire (garde dist/)
    shutil.rmtree(BUILD_DIR)

if __name__ == "__main__":
    build()
