@echo off
:: ─── JTRADE LAUNCHER (Windows) ───────────────────────────────────────────────
setlocal EnableDelayedExpansion
set PORT=8765

:: 1. Vérifie que Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠  Python introuvable. Télécharge-le sur https://www.python.org/downloads/
    echo    Coche bien "Add Python to PATH" lors de l'installation.
    pause
    exit /b 1
)

:: 2. Vérifie si le port est déjà occupé
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ✓ Serveur HTTP déjà actif sur le port %PORT%.
    goto :open
)

:: 3. Lance le serveur HTTP en arrière-plan
echo Démarrage du serveur HTTP sur le port %PORT%...
start /B python -m http.server %PORT% --directory "%~dp0" >"%TEMP%\jtrade-http.log" 2>&1
timeout /t 1 /nobreak >nul
echo ✓ Serveur prêt.

:open
:: 4. Ouvre JTRADE dans le navigateur par défaut
start "" "http://localhost:%PORT%"
echo.
echo ✓ JTRADE ouvert dans le navigateur.
echo   Laisse cette fenêtre ouverte tant que tu utilises l'app.
echo   Ferme-la pour arrêter le serveur.
echo.
pause
