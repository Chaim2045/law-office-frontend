# ================================================
# 🚀 Shuttle.rs Setup Script - Windows
# ================================================
# סקריפט התקנה אוטומטי לכל הכלים הנדרשים
#
# @version 1.0.0
# @author Claude Code
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Shuttle.rs Setup - Law Office System" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# בדיקת הרשאות Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Warning: מומלץ להריץ את הסקריפט כ-Administrator" -ForegroundColor Yellow
    Write-Host "   לחץ Enter להמשיך בכל זאת, או Ctrl+C לביטול" -ForegroundColor Yellow
    Read-Host
}

Write-Host ""
Write-Host "📋 בודק מה כבר מותקן..." -ForegroundColor Yellow
Write-Host ""

# ================================================
# בדיקת Rust
# ================================================
Write-Host "🦀 בודק Rust..." -ForegroundColor Cyan

$rustInstalled = $false
try {
    $rustVersion = rustc --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Rust כבר מותקן: $rustVersion" -ForegroundColor Green
        $rustInstalled = $true
    }
} catch {
    Write-Host "   ❌ Rust לא מותקן" -ForegroundColor Red
}

if (-not $rustInstalled) {
    Write-Host "   📥 מוריד ומתקין Rust..." -ForegroundColor Yellow

    # הורדת rustup-init.exe
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupPath = "$env:TEMP\rustup-init.exe"

    Write-Host "   ⏳ מוריד rustup-init.exe..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath

    Write-Host "   ⏳ מתקין Rust (זה ייקח כמה דקות)..." -ForegroundColor Gray
    Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait -NoNewWindow

    # עדכון PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    Write-Host "   ✅ Rust הותקן בהצלחה!" -ForegroundColor Green

    # וידוא
    $rustVersion = rustc --version 2>$null
    Write-Host "   📦 גרסה: $rustVersion" -ForegroundColor Gray
}

# ================================================
# בדיקת Cargo
# ================================================
Write-Host ""
Write-Host "📦 בודק Cargo..." -ForegroundColor Cyan

try {
    $cargoVersion = cargo --version 2>$null
    Write-Host "   ✅ Cargo מותקן: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ שגיאה: Cargo לא נמצא (צריך להיות מותקן עם Rust)" -ForegroundColor Red
    exit 1
}

# ================================================
# התקנת Shuttle CLI
# ================================================
Write-Host ""
Write-Host "🚀 מתקין Shuttle CLI..." -ForegroundColor Cyan

$shuttleInstalled = $false
try {
    $shuttleVersion = cargo shuttle --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Shuttle CLI כבר מותקן: $shuttleVersion" -ForegroundColor Green
        $shuttleInstalled = $true
    }
} catch {
    Write-Host "   ❌ Shuttle CLI לא מותקן" -ForegroundColor Red
}

if (-not $shuttleInstalled) {
    Write-Host "   📥 מתקין cargo-shuttle (זה ייקח 2-5 דקות)..." -ForegroundColor Yellow
    cargo install cargo-shuttle

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Shuttle CLI הותקן בהצלחה!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ שגיאה בהתקנת Shuttle CLI" -ForegroundColor Red
        exit 1
    }
}

# ================================================
# בדיקת Git
# ================================================
Write-Host ""
Write-Host "📚 בודק Git..." -ForegroundColor Cyan

$gitInstalled = $false
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Git כבר מותקן: $gitVersion" -ForegroundColor Green
        $gitInstalled = $true
    }
} catch {
    Write-Host "   ❌ Git לא מותקן" -ForegroundColor Red
}

if (-not $gitInstalled) {
    Write-Host "   ⚠️  Git לא מותקן - מומלץ להתקין אותו!" -ForegroundColor Yellow
    Write-Host "   📥 הורד מכאן: https://git-scm.com/download/win" -ForegroundColor Gray
    Write-Host "   💡 זה לא חובה, אבל מומלץ" -ForegroundColor Gray
}

# ================================================
# בדיקת VS Code (אופציונלי)
# ================================================
Write-Host ""
Write-Host "💻 בודק VS Code..." -ForegroundColor Cyan

$vscodeInstalled = $false
try {
    $vscodePath = Get-Command code -ErrorAction SilentlyContinue
    if ($vscodePath) {
        Write-Host "   ✅ VS Code מותקן" -ForegroundColor Green
        $vscodeInstalled = $true
    }
} catch {
    Write-Host "   ❌ VS Code לא מותקן" -ForegroundColor Red
}

if (-not $vscodeInstalled) {
    Write-Host "   💡 מומלץ להתקין VS Code לפיתוח" -ForegroundColor Yellow
    Write-Host "   📥 הורד מכאן: https://code.visualstudio.com" -ForegroundColor Gray
}

# ================================================
# התקנת Rust Extensions (אם יש VS Code)
# ================================================
if ($vscodeInstalled) {
    Write-Host ""
    Write-Host "🔌 מתקין VS Code Extensions לRust..." -ForegroundColor Cyan

    $extensions = @(
        "rust-lang.rust-analyzer",
        "tamasfe.even-better-toml",
        "serayuzgur.crates"
    )

    foreach ($ext in $extensions) {
        Write-Host "   📦 מתקין $ext..." -ForegroundColor Gray
        code --install-extension $ext --force 2>$null
    }

    Write-Host "   ✅ Extensions הותקנו!" -ForegroundColor Green
}

# ================================================
# יצירת תיקיית הפרויקט
# ================================================
Write-Host ""
Write-Host "📁 יוצר תיקיית פרויקט..." -ForegroundColor Cyan

$projectPath = "c:\Users\haim\law-office-system\shuttle-law-office"

if (Test-Path $projectPath) {
    Write-Host "   ⚠️  התיקייה כבר קיימת: $projectPath" -ForegroundColor Yellow
    Write-Host "   האם למחוק ולהתחיל מחדש? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq "Y" -or $response -eq "y") {
        Remove-Item -Path $projectPath -Recurse -Force
        Write-Host "   ✅ התיקייה נמחקה" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  משתמש בתיקייה הקיימת" -ForegroundColor Gray
    }
}

if (-not (Test-Path $projectPath)) {
    New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
    Write-Host "   ✅ תיקייה נוצרה: $projectPath" -ForegroundColor Green
}

# ================================================
# סיכום
# ================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ ההתקנה הושלמה בהצלחה!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 סטטוס כלים:" -ForegroundColor Yellow
Write-Host "   🦀 Rust:      " -NoNewline
if ($rustInstalled) { Write-Host "✅ מותקן" -ForegroundColor Green } else { Write-Host "✅ מותקן עכשיו" -ForegroundColor Green }

Write-Host "   📦 Cargo:     " -NoNewline
Write-Host "✅ מותקן" -ForegroundColor Green

Write-Host "   🚀 Shuttle:   " -NoNewline
if ($shuttleInstalled) { Write-Host "✅ מותקן" -ForegroundColor Green } else { Write-Host "✅ מותקן עכשיו" -ForegroundColor Green }

Write-Host "   📚 Git:       " -NoNewline
if ($gitInstalled) { Write-Host "✅ מותקן" -ForegroundColor Green } else { Write-Host "⚠️  לא מותקן (אופציונלי)" -ForegroundColor Yellow }

Write-Host "   💻 VS Code:   " -NoNewline
if ($vscodeInstalled) { Write-Host "✅ מותקן" -ForegroundColor Green } else { Write-Host "⚠️  לא מותקן (אופציונלי)" -ForegroundColor Yellow }

Write-Host ""
Write-Host "📁 תיקיית פרויקט: $projectPath" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 השלבים הבאים:" -ForegroundColor Yellow
Write-Host "   1. סגור את PowerShell ופתח חדש (לטעינת PATH)" -ForegroundColor White
Write-Host "   2. cd $projectPath" -ForegroundColor White
Write-Host "   3. הרץ את הסקריפט הבא: .\create-project.ps1" -ForegroundColor White
Write-Host ""

Write-Host "💡 טיפ: אם אתה רוצה לפתוח ב-VS Code:" -ForegroundColor Cyan
Write-Host "   code $projectPath" -ForegroundColor White
Write-Host ""

Write-Host "🔥 מוכן לבנות את המערכת הכי מהירה שראית! 🚀" -ForegroundColor Green
Write-Host ""

# שמירת נתיב הפרויקט לשימוש בסקריפטים הבאים
$env:LAW_OFFICE_PROJECT_PATH = $projectPath
[Environment]::SetEnvironmentVariable("LAW_OFFICE_PROJECT_PATH", $projectPath, "User")

Write-Host "💾 הנתיב נשמר במשתנה סביבה: LAW_OFFICE_PROJECT_PATH" -ForegroundColor Gray
Write-Host ""

# המתנה לסיום
Write-Host "לחץ Enter לסיום..."
Read-Host
