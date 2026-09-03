# DriftLens auf GitHub pushen + GitHub Pages aktivieren
# Einmal in PowerShell ausfuehren (Browser oeffnet sich fuer Login):

$env:Path = "C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:Path
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "=== DriftLens -> GitHub ===" -ForegroundColor Cyan

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub Login (Browser oeffnet sich)..." -ForegroundColor Yellow
  gh auth login -h github.com -p https -w
}

$hasOrigin = $false
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0 -and $remoteUrl) {
  $hasOrigin = $true
}

if ($hasOrigin) {
  Write-Host "Remote origin existiert bereits - push only." -ForegroundColor Green
  git push -u origin main
  exit $LASTEXITCODE
}

$repoName = "driftlens"
Write-Host "Erstelle oeffentliches Repo: $repoName" -ForegroundColor Green
gh repo create $repoName --public --source=. --remote=origin --push --description "DriftLens - local QA for AI image series"

if ($LASTEXITCODE -ne 0) {
  Write-Host "Repo-Name evtl. belegt. Anderen Namen waehlen und manuell:" -ForegroundColor Red
  Write-Host "  gh repo create DEIN-NAME --public --source=. --remote=origin --push"
  exit 1
}

$user = gh api user -q .login
Write-Host ""
Write-Host "Fertig!" -ForegroundColor Green
Write-Host "Repo:     https://github.com/$user/$repoName"
Write-Host "Privacy:  https://$user.github.io/$repoName/privacy.html"
Write-Host ""
Write-Host "Naechster Schritt in GitHub:" -ForegroundColor Yellow
Write-Host "  Settings -> Pages -> Build and deployment -> Source: GitHub Actions"
