# 🚀 מדריך Deployment - Law Office Backend

## תוכן עניינים
- [דרישות מקדימות](#דרישות-מקדימות)
- [התקנה מקומית](#התקנה-מקומית)
- [Deployment ל-Shuttle](#deployment-ל-shuttle)
- [Deployment עם Docker](#deployment-עם-docker)
- [CI/CD עם GitHub Actions](#cicd-עם-github-actions)
- [ניהול Secrets](#ניהול-secrets)
- [Monitoring ו-Logs](#monitoring-ו-logs)

---

## דרישות מקדימות

### 1. התקנת Rust
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe

# Linux/macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. התקנת Shuttle CLI
```bash
cargo install cargo-shuttle
```

### 3. יצירת חשבון Shuttle
```bash
# פתח דפדפן ליצירת חשבון
https://www.shuttle.rs/

# התחבר דרך CLI
cargo shuttle login
```

---

## התקנה מקומית

### שלב 1: Clone הפרויקט
```bash
git clone <repository-url>
cd law-office-backend-rust
```

### שלב 2: הגדרת Secrets
צור קובץ `backend/Secrets.dev.toml`:

```toml
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = "your-gmail-app-password"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = "587"
JWT_SECRET = "dev-secret-key-change-in-production"
API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@localhost"
RATE_LIMIT_REQUESTS_PER_MINUTE = "100"
```

### שלב 3: הרצה מקומית
```bash
cd backend
cargo shuttle run
```

הAPI יהיה זמין ב: **http://localhost:8000**

### בדיקת Health
```bash
curl http://localhost:8000/health
```

תשובה מצופה:
```json
{
  "status": "healthy",
  "message": "✅ Law Office API is healthy!",
  "version": "0.1.0"
}
```

---

## Deployment ל-Shuttle

### שלב 1: הגדרת Secrets בפרודקשן
```bash
cd backend

# הגדרת כל ה-secrets
cargo shuttle secrets set SMTP_USERNAME=your-email@gmail.com
cargo shuttle secrets set SMTP_PASSWORD=your-app-password
cargo shuttle secrets set SMTP_HOST=smtp.gmail.com
cargo shuttle secrets set SMTP_PORT=587
cargo shuttle secrets set JWT_SECRET=$(openssl rand -base64 32)
cargo shuttle secrets set API_BASE_URL=https://your-app.shuttleapp.rs
cargo shuttle secrets set ADMIN_EMAIL=admin@your-domain.com
cargo shuttle secrets set RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### שלב 2: Deploy
```bash
cargo shuttle deploy
```

### שלב 3: בדיקת Deployment
```bash
# קבלת URL של האפליקציה
cargo shuttle status

# בדיקת health
curl https://your-app.shuttleapp.rs/health
```

### ניהול הפרויקט
```bash
# צפייה בלוגים
cargo shuttle logs

# עצירת הפרויקט
cargo shuttle stop

# הפעלה מחדש
cargo shuttle start

# מחיקת הפרויקט
cargo shuttle delete
```

---

## Deployment עם Docker

### שלב 1: Build Docker Image
```bash
# מהתיקייה הראשית של הפרויקט
docker build -t law-office-backend:latest .
```

### שלב 2: הרצה עם Docker
```bash
docker run -d \
  --name law-office-api \
  -p 8000:8000 \
  -e DATABASE_URL="postgres://user:password@host:5432/dbname" \
  -e SMTP_USERNAME="your-email@gmail.com" \
  -e SMTP_PASSWORD="your-app-password" \
  -e JWT_SECRET="your-secret-key" \
  law-office-backend:latest
```

### שלב 3: Docker Compose (מומלץ)
צור קובץ `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: law_office
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgres://postgres:${DB_PASSWORD}@postgres:5432/law_office
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

הרצה:
```bash
# צור קובץ .env עם המשתנים
echo "DB_PASSWORD=your-password" > .env
echo "SMTP_USERNAME=your-email" >> .env
echo "SMTP_PASSWORD=your-app-password" >> .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# הרץ
docker-compose up -d

# צפייה בלוגים
docker-compose logs -f

# עצירה
docker-compose down
```

---

## CI/CD עם GitHub Actions

### הגדרת Secrets ב-GitHub

1. עבור ל-Settings > Secrets and variables > Actions
2. הוסף את ה-secrets הבאים:
   - `SHUTTLE_API_KEY` - מפתח API של Shuttle

### Workflow Files

הפרויקט כולל 2 workflows:

#### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Test**: רץ על כל push ו-PR
- **Build**: בונה את הפרויקט
- **Deploy**: מפרסם ל-Shuttle (רק על main branch)

#### 2. Security Audit (`.github/workflows/security.yml`)
- רץ אוטומטית כל שבוע
- בודק vulnerabilities
- רץ גם על PRs

### שימוש
```bash
# Push לbranch main יריץ אוטומטית:
git add .
git commit -m "Deploy to production"
git push origin main

# GitHub Actions ירוץ אוטומטית ויפרסם ל-Shuttle
```

---

## ניהול Secrets

### Development
קובץ `backend/Secrets.dev.toml` (לא נכנס ל-git):

```toml
SMTP_USERNAME = "dev@localhost"
SMTP_PASSWORD = "dev-password"
JWT_SECRET = "dev-secret"
# ... שאר ההגדרות
```

### Production (Shuttle)
```bash
# הצגת secrets קיימים
cargo shuttle secrets list

# הוספת secret
cargo shuttle secrets set KEY=VALUE

# מחיקת secret
cargo shuttle secrets delete KEY
```

### יצירת App Password ב-Gmail

1. עבור ל: https://myaccount.google.com/security
2. הפעל 2-Step Verification
3. עבור ל-App Passwords
4. צור App Password חדש ל-"Mail"
5. העתק את הסיסמה והשתמש ב-`SMTP_PASSWORD`

---

## Monitoring ו-Logs

### לוגים מקומיים
```bash
# הרצה עם לוגים מפורטים
RUST_LOG=debug cargo shuttle run
```

### לוגים ב-Shuttle
```bash
# צפייה בלוגים בזמן אמת
cargo shuttle logs --follow

# לוגים של 100 השורות האחרונות
cargo shuttle logs --lines 100

# לוגים מתאריך מסוים
cargo shuttle logs --since 2024-01-01
```

### Metrics Endpoints

הAPI כולל endpoints לבדיקה:

```bash
# Health check
curl https://your-app.shuttleapp.rs/health

# Readiness check (בודק database)
curl https://your-app.shuttleapp.rs/ready

# Statistics
curl https://your-app.shuttleapp.rs/api/stats
```

---

## Troubleshooting

### בעיות נפוצות

#### 1. Database Connection Failed
```bash
# בדוק שה-DATABASE_URL נכון
cargo shuttle logs | grep DATABASE

# הרץ מחדש את הפרויקט
cargo shuttle stop && cargo shuttle start
```

#### 2. Email Sending Failed
```bash
# ודא שה-App Password נכון
cargo shuttle secrets list | grep SMTP

# בדוק לוגים
cargo shuttle logs | grep email
```

#### 3. JWT Errors
```bash
# יצור JWT Secret חדש
openssl rand -base64 32

# עדכן ב-Shuttle
cargo shuttle secrets set JWT_SECRET=<new-secret>
```

#### 4. Build Failed
```bash
# נקה את ה-cache
cargo clean

# עדכן dependencies
cargo update

# נסה שוב
cargo build --release
```

---

## Performance Tips

### 1. Database Optimization
```sql
-- הוסף indexes למהירות
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 2. Caching
הפרויקט כבר כולל:
- Cargo build cache
- Connection pooling
- Compression middleware

### 3. Rate Limiting
הגדר ב-`Secrets.toml`:
```toml
RATE_LIMIT_REQUESTS_PER_MINUTE = "60"
```

---

## Security Checklist

### לפני Production:
- [ ] שנה את `JWT_SECRET` למפתח חזק (32+ תווים)
- [ ] השתמש ב-HTTPS בלבד
- [ ] הגדר App Password ב-Gmail (לא סיסמת המשתמש!)
- [ ] הוסף את `Secrets.toml` ל-`.gitignore`
- [ ] הפעל security audit:
  ```bash
  cargo audit
  ```
- [ ] בדוק שאין hardcoded secrets בקוד
- [ ] הגדר CORS נכון (לא wildcard `*` בפרודקשן)
- [ ] הפעל GitHub Dependabot

---

## סיכום פקודות מהירות

```bash
# Development
cd backend
cargo shuttle run

# Production Deploy
cargo shuttle deploy

# Logs
cargo shuttle logs --follow

# Status
cargo shuttle status

# Secrets
cargo shuttle secrets set KEY=VALUE

# Docker
docker-compose up -d

# Security Audit
cargo audit
```

---

## תמיכה

- **Shuttle Docs**: https://docs.shuttle.rs
- **Rust Book**: https://doc.rust-lang.org/book/
- **Issues**: צור issue ב-GitHub repository

---

**⚖️ GH Law Office - Built with Rust + Shuttle.rs**
