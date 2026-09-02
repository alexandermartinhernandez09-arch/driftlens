@echo off
cd /d "%~dp0"
echo DriftLens — lokaler Server startet ...
echo Browser: http://localhost:3000
echo Beenden mit Strg+C
start "" "http://localhost:3000"
npx --yes serve . -p 3000
