#!/usr/bin/env python3
"""
Build JTRADE_Setup.exe pour Windows
A exécuter sur une machine Windows (pas Mac).

Usage : python build_windows.py
Résultat : JTRADE_Setup.exe dans le dossier courant

Dépendances installées automatiquement :
  - pyinstaller  (bundle Python + app en .exe)
  - innosetup    (installateur Windows avec Start Menu / désinstalleur)
               → téléchargé si absent : https://jrsoftware.org/isdl.php
"""

import os
import sys
import shutil
import subprocess
import textwrap
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
APP_NAME    = "JTRADE"
VERSION     = "0.5.0"
PUBLISHER   = "JTRADE"
PORT        = 8765
ICON_NAME   = "jtrade.ico"   # optionnel — place un .ico ici pour l'icône

ROOT        = Path(__file__).parent.parent   # racine du projet
SRC         = ROOT / "src"
BUILD_DIR   = ROOT / "dist" / "_build_win"
DIST_DIR    = ROOT / "dist" / "_dist_win"
LAUNCHER_PY = BUILD_DIR / "_launcher.py"
SPEC_FILE   = BUILD_DIR / "jtrade.spec"
SETUP_EXE   = ROOT / "dist" / f"{APP_NAME}_Setup.exe"
ICON_PATH   = ROOT / "build" / ICON_NAME

WEB_FILES   = ["index.html", "js", "css"]
DOCS        = ["GUIDE.md", "JTRADE_Guide.pdf"]

# ── Code source du lanceur (embarqué dans le .exe) ───────────────────────────
LAUNCHER_CODE = f"""\
import sys, os, time, socket, threading, webbrowser
import http.server, socketserver

# Répertoire contenant les fichiers web
if getattr(sys, 'frozen', False):
    # Mode PyInstaller onedir : les fichiers web sont à côté du .exe
    BASE = os.path.dirname(sys.executable)
else:
    BASE = os.path.dirname(os.path.abspath(__file__))

PORT = {PORT}

def port_free(p):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', p)) != 0

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)
    def log_message(self, *a):
        pass   # pas de logs console

if port_free(PORT):
    def serve():
        with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as h:
            h.serve_forever()
    threading.Thread(target=serve, daemon=True).start()
    time.sleep(0.7)

webbrowser.open(f'http://localhost:{{PORT}}')

# Maintient le process vivant (icône dans la barre des tâches via loop)
try:
    while True:
        time.sleep(1)
except (KeyboardInterrupt, SystemExit):
    pass
"""

# ── Script Inno Setup ─────────────────────────────────────────────────────────
def make_iss(dist_app_dir: Path, icon_line: str) -> str:
    return textwrap.dedent(f"""\
    [Setup]
    AppName={APP_NAME}
    AppVersion={VERSION}
    AppPublisher={PUBLISHER}
    DefaultDirName={{autopf}}\\{APP_NAME}
    DefaultGroupName={APP_NAME}
    OutputBaseFilename={APP_NAME}_Setup
    OutputDir={ROOT}
    Compression=lzma2
    SolidCompression=yes
    PrivilegesRequired=lowest
    {icon_line}

    [Files]
    Source: "{dist_app_dir}\\*"; DestDir: "{{app}}"; Flags: ignoreversion recursesubdirs

    [Icons]
    Name: "{{group}}\\{APP_NAME}"; Filename: "{{app}}\\{APP_NAME}.exe"
    Name: "{{group}}\\Désinstaller {APP_NAME}"; Filename: "{{uninstallexe}}"
    Name: "{{commondesktop}}\\{APP_NAME}"; Filename: "{{app}}\\{APP_NAME}.exe"; Tasks: desktopicon

    [Tasks]
    Name: desktopicon; Description: "Créer un raccourci sur le bureau"; Flags: unchecked

    [Run]
    Filename: "{{app}}\\{APP_NAME}.exe"; Description: "Lancer {APP_NAME}"; Flags: postinstall nowait skipifsilent
    """)

# ── Helpers ───────────────────────────────────────────────────────────────────
def pip_install(pkg):
    subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", pkg], check=True)

def run(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, **kw)

def step(msg):
    print(f"\n[ {msg} ]")

def find_iscc():
    candidates = [
        r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        r"C:\Program Files\Inno Setup 6\ISCC.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    try:
        result = subprocess.run(["where", "iscc"], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip().splitlines()[0]
    except FileNotFoundError:
        pass
    return None

# ── Build ─────────────────────────────────────────────────────────────────────
def build():
    if sys.platform != "win32":
        print("ERREUR : ce script doit être exécuté sur Windows.")
        print("Sur Mac, utilise build_mac.py à la place.")
        sys.exit(1)

    print(f"\n{'='*55}")
    print(f"  Build {APP_NAME} v{VERSION} — Windows")
    print(f"{'='*55}\n")

    # Nettoyage
    step("Nettoyage")
    for d in [BUILD_DIR, DIST_DIR]:
        if d.exists():
            shutil.rmtree(d)
    if SETUP_EXE.exists():
        SETUP_EXE.unlink()
    BUILD_DIR.mkdir(parents=True)
    DIST_DIR.mkdir(parents=True)
    print("  OK")

    # Install PyInstaller
    step("Vérification de PyInstaller")
    try:
        import PyInstaller
        print(f"  Déjà installé : PyInstaller {PyInstaller.__version__}")
    except ImportError:
        print("  Installation de PyInstaller...")
        pip_install("pyinstaller")

    # Écriture du lanceur
    step("Création du lanceur Python")
    LAUNCHER_PY.write_text(LAUNCHER_CODE, encoding="utf-8")
    print(f"  {LAUNCHER_PY}")

    # Icône (optionnel)
    icon_arg = []
    if ICON_PATH.exists():
        icon_arg = ["--icon", str(ICON_PATH)]
        print(f"  Icône : {ICON_PATH}")
    else:
        print(f"  Icône : aucune (place {ICON_NAME} dans build/ pour en ajouter une)")

    # PyInstaller — bundle onedir (plus rapide au démarrage que onefile)
    step("PyInstaller — création du bundle")
    add_data = []
    for item in WEB_FILES:
        src = SRC / item
        if not src.exists():
            print(f"  Ignoré (absent) : {item}")
            continue
        add_data += ["--add-data", f"{src};."]
        print(f"  Inclus : {item}")
    for doc in DOCS:
        src = ROOT / "docs" / doc
        if src.exists():
            add_data += ["--add-data", f"{src};."]
            print(f"  Inclus : {doc}")

    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", APP_NAME,
        "--distpath", str(DIST_DIR),
        "--workpath", str(BUILD_DIR / "pyinstaller_work"),
        "--specpath", str(BUILD_DIR),
        "--onedir",          # dossier avec .exe + dépendances
        "--noconsole",       # pas de fenêtre console
        "--clean",
        *icon_arg,
        *add_data,
        str(LAUNCHER_PY),
    ]
    run(pyinstaller_cmd)

    dist_app_dir = DIST_DIR / APP_NAME
    if not dist_app_dir.exists():
        print(f"ERREUR : PyInstaller n'a pas produit {dist_app_dir}")
        sys.exit(1)

    # Copie des fichiers web à côté du .exe (nécessaire pour onedir)
    step("Copie des fichiers web dans le bundle")
    for item in WEB_FILES:
        src = SRC / item
        dst = dist_app_dir / item
        if not src.exists():
            continue
        if src.is_dir():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print(f"  {item} : OK")
    for doc in DOCS:
        src = ROOT / "docs" / doc
        if src.exists():
            shutil.copy2(src, dist_app_dir / doc)
            print(f"  {doc} : OK")

    # Inno Setup
    step("Création de l'installateur (Inno Setup)")
    iscc = find_iscc()

    icon_iss_line = f'SetupIconFile={icon_path}' if icon_path.exists() else ""
    iss_content = make_iss(dist_app_dir, icon_iss_line)
    iss_file = BUILD_DIR / "setup.iss"
    iss_file.write_text(iss_content, encoding="utf-8")
    print(f"  Script .iss : {iss_file}")

    if iscc:
        print(f"  ISCC trouvé : {iscc}")
        run([iscc, str(iss_file)])
        if SETUP_EXE.exists():
            size_mb = SETUP_EXE.stat().st_size // (1024 * 1024)
            print(f"\n{'='*55}")
            print(f"  Fichier  : {SETUP_EXE}")
            print(f"  Taille   : {size_mb} Mo")
            print(f"  → Distribue ce fichier aux utilisateurs Windows.")
            print(f"{'='*55}\n")
        else:
            # Inno Setup nomme le fichier d'après OutputBaseFilename
            candidate = ROOT / f"{APP_NAME}_Setup.exe"
            if candidate.exists():
                print(f"  OK : {candidate}")
    else:
        print("""
  Inno Setup introuvable.
  Télécharge-le sur : https://jrsoftware.org/isdl.php
  Puis lance "ISCC setup.iss" dans _build_win/ pour créer le .exe.

  Alternative : distribue directement le dossier _dist_win/JTRADE/
  en compressant en .zip — l'utilisateur décompresse et double-clique
  sur JTRADE.exe.
""")
        # Créer un zip en fallback dans dist/
        zip_path = ROOT / "dist" / f"{APP_NAME}_Windows"
        shutil.make_archive(str(zip_path), 'zip', str(DIST_DIR))
        print(f"  Zip créé : {zip_path}.zip")

    # Nettoyage dossiers intermédiaires (garde dist/)
    shutil.rmtree(BUILD_DIR)
    shutil.rmtree(DIST_DIR)

if __name__ == "__main__":
    build()
