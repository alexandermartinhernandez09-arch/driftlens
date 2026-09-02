# DriftLens - Windows Android build fixes (AAPT2 / Gradle cache)
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\android-windows-fix.ps1

$ErrorActionPreference = "Stop"

$gradleHome = "C:\GradleCache"
$paths = @(
    $gradleHome
    "$env:USERPROFILE\.gradle"
    "$env:LOCALAPPDATA\Android\Sdk"
    "C:\Program Files\Android\Android Studio"
    "C:\Users\Usuario\Projects\CreatorSeriesCheck"
)

Write-Host "=== DriftLens Android Windows Fix ===" -ForegroundColor Cyan

if (-not (Test-Path $gradleHome)) {
    New-Item -ItemType Directory -Path $gradleHome -Force | Out-Null
    Write-Host "Created $gradleHome"
}

$localProps = Join-Path $PSScriptRoot "..\android\local.properties"
$aapt2Path = $null
if (Test-Path $localProps) {
    $sdkLine = Get-Content $localProps | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
    if ($sdkLine) {
        $sdkDir = ($sdkLine -replace '^sdk\.dir=', '').Trim()
        $sdkDir = $sdkDir -replace '\\\\', '\'
        $sdkDir = $sdkDir -replace '\\:', ':'
        foreach ($ver in @('35.0.0', '36.0.0', '34.0.0')) {
            $candidate = Join-Path $sdkDir "build-tools\$ver\aapt2.exe"
            if (Test-Path $candidate) {
                $aapt2Path = ($candidate -replace '\\', '/')
                break
            }
        }
    }
}

if ($aapt2Path) {
    $gradleProps = Join-Path $gradleHome "gradle.properties"
    $content = @(
        "# DriftLens Windows Android fixes (auto-generated)"
        "android.aapt2FromMavenOverride=$aapt2Path"
    )
    Set-Content -Path $gradleProps -Value $content -Encoding UTF8
    Write-Host "OK: aapt2 override -> $aapt2Path"
} else {
    Write-Host "WARN: Could not find aapt2.exe - using default SDK path" -ForegroundColor Yellow
    $fallbackSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    foreach ($ver in @('35.0.0', '36.0.0', '34.0.0')) {
        $candidate = Join-Path $fallbackSdk "build-tools\$ver\aapt2.exe"
        if (Test-Path $candidate) {
            $aapt2Path = ($candidate -replace '\\', '/')
            $gradleProps = Join-Path $gradleHome "gradle.properties"
            Set-Content -Path $gradleProps -Value @(
                "# DriftLens Windows Android fixes (auto-generated)"
                "android.aapt2FromMavenOverride=$aapt2Path"
            ) -Encoding UTF8
            Write-Host "OK: aapt2 override -> $aapt2Path"
            break
        }
    }
}

try {
    $longPaths = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -ErrorAction SilentlyContinue
    if ($longPaths.LongPathsEnabled -ne 1) {
        Write-Host "WARN: Windows Long Paths not enabled (optional)." -ForegroundColor Yellow
    } else {
        Write-Host "OK: Long paths enabled"
    }
} catch {
    Write-Host "Could not read LongPathsEnabled"
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    foreach ($p in $paths) {
        if (Test-Path $p) {
            try {
                Add-MpPreference -ExclusionPath $p -ErrorAction SilentlyContinue
                Write-Host "Exclusion: $p"
            } catch {
                Write-Host "Skip exclusion: $p"
            }
        }
    }
} else {
    Write-Host "Tip: Run PowerShell as Admin to add Defender exclusions automatically." -ForegroundColor Yellow
    Write-Host "Or add manually in Windows Security exclusions:"
    foreach ($p in $paths) { Write-Host "  $p" }
}

Write-Host ""
Write-Host "Gradle user home: $gradleHome"
Write-Host "Android Studio: Settings, Build Tools, Gradle, Gradle user home = $gradleHome"
Write-Host "Then: Sync and Run in Android Studio"
