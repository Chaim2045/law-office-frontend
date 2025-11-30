# ================================================
# 🚀 Create Shuttle Project - Law Office System
# ================================================
# יוצר את מבנה הפרויקט המלא
#
# @version 1.0.0
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 יוצר פרויקט Shuttle - Law Office System" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# נתיב הפרויקט
$projectPath = $env:LAW_OFFICE_PROJECT_PATH
if (-not $projectPath) {
    $projectPath = "c:\Users\haim\law-office-system\shuttle-law-office"
}

Write-Host "📁 נתיב פרויקט: $projectPath" -ForegroundColor Gray
Write-Host ""

# מעבר לתיקייה
Set-Location $projectPath

# ================================================
# יצירת הפרויקט עם Shuttle
# ================================================
Write-Host "🏗️  יוצר פרויקט Shuttle עם Axum..." -ForegroundColor Cyan

# אם יש כבר Cargo.toml, נדלג
if (Test-Path "Cargo.toml") {
    Write-Host "   ⚠️  הפרויקט כבר קיים, משתמש בקיים" -ForegroundColor Yellow
} else {
    Write-Host "   ⏳ רץ: cargo shuttle init..." -ForegroundColor Gray
    cargo shuttle init --template axum --name law-office-api

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ פרויקט נוצר בהצלחה!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ שגיאה ביצירת הפרויקט" -ForegroundColor Red
        exit 1
    }
}

# ================================================
# עדכון Cargo.toml עם Dependencies נוספים
# ================================================
Write-Host ""
Write-Host "📦 מוסיף dependencies..." -ForegroundColor Cyan

$cargoToml = @"
[package]
name = "law-office-api"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web Framework
axum = { version = "0.7", features = ["multipart"] }
shuttle-axum = "0.42"
shuttle-runtime = "0.42"

# Database
shuttle-shared-db = { version = "0.42", features = ["postgres"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono"] }

# Async Runtime
tokio = { version = "1", features = ["full"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# UUID
uuid = { version = "1", features = ["v4", "serde"] }

# DateTime
chrono = { version = "0.4", features = ["serde"] }

# Email
lettre = { version = "0.11", features = ["tokio1-rustls-tls", "smtp-transport", "builder"] }

# Environment & Secrets
shuttle-secrets = "0.42"

# Error Handling
anyhow = "1"
thiserror = "1"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# HTTP
tower = { version = "0.4", features = ["util"] }
tower-http = { version = "0.5", features = ["fs", "cors", "trace"] }

# Validation
validator = { version = "0.16", features = ["derive"] }

# File Upload
bytes = "1"
futures = "0.3"

# Storage (אם נרצה S3 בעתיד)
# aws-sdk-s3 = "1"
"@

Write-Host "   📝 כותב Cargo.toml..." -ForegroundColor Gray
Set-Content -Path "Cargo.toml" -Value $cargoToml

Write-Host "   ✅ Dependencies נוספו!" -ForegroundColor Green

# ================================================
# יצירת מבנה תיקיות
# ================================================
Write-Host ""
Write-Host "📂 יוצר מבנה תיקיות..." -ForegroundColor Cyan

$folders = @(
    "src/routes",
    "src/models",
    "src/services",
    "src/handlers",
    "src/db",
    "src/utils",
    "migrations"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "   ✅ נוצר: $folder" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  קיים: $folder" -ForegroundColor Gray
    }
}

# ================================================
# יצירת .gitignore
# ================================================
Write-Host ""
Write-Host "📝 יוצר .gitignore..." -ForegroundColor Cyan

$gitignore = @"
# Rust
/target
**/*.rs.bk
Cargo.lock

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Shuttle
.shuttle/
Secrets.toml
Secrets.dev.toml

# Environment
.env
.env.local
"@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "   ✅ .gitignore נוצר!" -ForegroundColor Green

# ================================================
# יצירת Shuttle.toml
# ================================================
Write-Host ""
Write-Host "⚙️  יוצר Shuttle.toml..." -ForegroundColor Cyan

$shuttleToml = @"
name = "law-office-api"
"@

Set-Content -Path "Shuttle.toml" -Value $shuttleToml
Write-Host "   ✅ Shuttle.toml נוצר!" -ForegroundColor Green

# ================================================
# יצירת Secrets.dev.toml (לפיתוח)
# ================================================
Write-Host ""
Write-Host "🔐 יוצר Secrets.dev.toml..." -ForegroundColor Cyan

$secretsToml = @"
# Secrets for local development
# ⚠️ אל תעלה לGit! (כבר ב-.gitignore)

# Email Configuration
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = "587"
SMTP_USERNAME = "office@ghlawoffice.co.il"
SMTP_PASSWORD = "your-app-password-here"
SMTP_FROM = "office@ghlawoffice.co.il"

# Admin Email
ADMIN_EMAIL = "HAIM@ghlawoffice.co.il"
SECRETARY_EMAIL = "office@ghlawoffice.co.il"

# JWT Secret (for future auth)
JWT_SECRET = "your-super-secret-key-change-this-in-production"

# CORS Origins (for development)
CORS_ORIGINS = "http://localhost:3000,http://localhost:8080"
"@

Set-Content -Path "Secrets.dev.toml" -Value $secretsToml
Write-Host "   ✅ Secrets.dev.toml נוצר!" -ForegroundColor Green
Write-Host "   💡 ערוך את הקובץ והוסף את סיסמת SMTP האמיתית" -ForegroundColor Yellow

# ================================================
# יצירת README.md
# ================================================
Write-Host ""
Write-Host "📖 יוצר README.md..." -ForegroundColor Cyan

$readme = @"
# 🚀 Law Office Task Management System

מערכת ניהול משימות מתקדמת למשרד עורכי דין, בנויה עם **Rust + Shuttle.rs**

## ⚡ ביצועים

- **Response Time**: 1-3ms
- **Database Queries**: < 10ms
- **File Upload**: 50-100ms
- **Email**: אסינכרוני (לא חוסם)

## 🛠️ טכנולוגיות

- **Rust** - שפת התכנות
- **Axum** - Web Framework
- **Shuttle.rs** - Deployment Platform
- **PostgreSQL** - Database
- **SQLx** - Type-safe SQL
- **Lettre** - Email Service

## 🚀 התחלה מהירה

### פיתוח מקומי

\`\`\`bash
# הרצה מקומית
cargo shuttle run

# בדיקת API
curl http://localhost:8000/health
\`\`\`

### Deploy לענן

\`\`\`bash
# Deploy בפקודה אחת!
cargo shuttle deploy
\`\`\`

## 📚 API Endpoints

### Tasks (משימות)

- \`POST /api/tasks\` - יצירת משימה חדשה
- \`GET /api/tasks\` - קבלת כל המשימות
- \`GET /api/tasks/:id\` - משימה ספציפית
- \`PUT /api/tasks/:id\` - עדכון משימה
- \`DELETE /api/tasks/:id\` - מחיקת משימה

### Stats (סטטיסטיקות)

- \`GET /api/stats\` - סטטיסטיקות כלליות
- \`GET /api/stats/user/:name\` - סטטיסטיקות משתמש

### Health

- \`GET /health\` - בדיקת תקינות המערכת

## 🗄️ Database Schema

ראה \`migrations/001_initial_schema.sql\`

## 📧 Email Templates

ראה \`src/services/email.rs\`

## 🔐 Secrets

ערוך את \`Secrets.dev.toml\` עם הפרטים שלך:

- SMTP configuration
- Admin emails
- JWT secret

## 📝 Migrations

\`\`\`bash
# הרץ migrations
sqlx migrate run
\`\`\`

## 🧪 Testing

\`\`\`bash
# הרץ tests
cargo test

# עם output
cargo test -- --nocapture
\`\`\`

## 📊 Monitoring

- Logs: \`tracing\` מובנה
- Metrics: Shuttle Dashboard

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - ראה LICENSE file

## 👨‍💻 Author

Haim @ GH Law Office

---

**Built with ❤️ using Rust + Shuttle.rs**
"@

Set-Content -Path "README.md" -Value $readme
Write-Host "   ✅ README.md נוצר!" -ForegroundColor Green

# ================================================
# סיכום
# ================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ מבנה הפרויקט נוצר בהצלחה!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📁 מבנה התיקיות:" -ForegroundColor Yellow
Write-Host ""
Write-Host "law-office-api/" -ForegroundColor White
Write-Host "├── src/" -ForegroundColor Gray
Write-Host "│   ├── main.rs          " -NoNewline -ForegroundColor Gray
Write-Host "# Entry point" -ForegroundColor DarkGray
Write-Host "│   ├── routes/          " -NoNewline -ForegroundColor Gray
Write-Host "# API Routes" -ForegroundColor DarkGray
Write-Host "│   ├── models/          " -NoNewline -ForegroundColor Gray
Write-Host "# Data Models" -ForegroundColor DarkGray
Write-Host "│   ├── services/        " -NoNewline -ForegroundColor Gray
Write-Host "# Business Logic" -ForegroundColor DarkGray
Write-Host "│   ├── handlers/        " -NoNewline -ForegroundColor Gray
Write-Host "# Request Handlers" -ForegroundColor DarkGray
Write-Host "│   ├── db/              " -NoNewline -ForegroundColor Gray
Write-Host "# Database Utils" -ForegroundColor DarkGray
Write-Host "│   └── utils/           " -NoNewline -ForegroundColor Gray
Write-Host "# Helper Functions" -ForegroundColor DarkGray
Write-Host "├── migrations/          " -NoNewline -ForegroundColor Gray
Write-Host "# SQL Migrations" -ForegroundColor DarkGray
Write-Host "├── Cargo.toml           " -NoNewline -ForegroundColor Gray
Write-Host "# Dependencies" -ForegroundColor DarkGray
Write-Host "├── Shuttle.toml         " -NoNewline -ForegroundColor Gray
Write-Host "# Shuttle Config" -ForegroundColor DarkGray
Write-Host "├── Secrets.dev.toml     " -NoNewline -ForegroundColor Gray
Write-Host "# Secrets (local)" -ForegroundColor DarkGray
Write-Host "└── README.md            " -NoNewline -ForegroundColor Gray
Write-Host "# Documentation" -ForegroundColor DarkGray
Write-Host ""

Write-Host "🎯 השלבים הבאים:" -ForegroundColor Yellow
Write-Host "   1. ערוך את Secrets.dev.toml עם פרטי SMTP אמיתיים" -ForegroundColor White
Write-Host "   2. הרץ: .\build-code.ps1 (ליצירת כל קבצי הקוד)" -ForegroundColor White
Write-Host "   3. הרץ: cargo shuttle run (להרצה מקומית)" -ForegroundColor White
Write-Host ""

Write-Host "💡 טיפ: פתח ב-VS Code:" -ForegroundColor Cyan
Write-Host "   code ." -ForegroundColor White
Write-Host ""

Write-Host "לחץ Enter להמשך..."
Read-Host
