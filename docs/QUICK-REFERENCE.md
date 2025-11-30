# ⚡ Quick Reference - Shuttle.rs

## 🚀 התחלה מהירה (3 דקות!)

```powershell
# 1. התקנה
.\shuttle-setup.ps1

# 2. יצירת פרויקט
.\create-project.ps1

# 3. יצירת קוד
cd shuttle-law-office
..\build-code.ps1

# 4. ערוך Secrets.dev.toml (הוסף App Password!)

# 5. הרצה
cargo shuttle run

# 6. בדיקה
Invoke-WebRequest http://localhost:8000/health
```

---

## 📝 פקודות נפוצות

### פיתוח מקומי

```powershell
cargo shuttle run          # הרצה מקומית
cargo check                # בדיקת קוד
cargo build                # בניית הפרויקט
cargo test                 # הרצת טסטים
cargo clean                # ניקוי build files
```

### Production

```powershell
cargo shuttle login        # התחברות (פעם ראשונה)
cargo shuttle deploy       # פרסום לענן
cargo shuttle logs         # צפייה בלוגים
cargo shuttle status       # סטטוס השירות
cargo shuttle stop         # עצירת השירות
```

### Database

```powershell
sqlx migrate run           # הרצת migrations
sqlx migrate add <name>    # migration חדש
cargo shuttle db psql      # חיבור ל-DB
cargo shuttle db reset     # איפוס DB
```

---

## 🌐 API Endpoints

### Base URL
- **Local**: `http://localhost:8000`
- **Production**: `https://law-office-api.shuttleapp.rs`

### Tasks

```powershell
# יצירת משימה
POST /api/tasks
Content-Type: application/json
{
  "title": "כותרת המשימה",
  "description": "תיאור",
  "category": "טכנית",
  "assigned_to": "חיים",
  "assigned_to_email": "HAIM@ghlawoffice.co.il",
  "created_by": "חיים",
  "created_by_email": "HAIM@ghlawoffice.co.il",
  "due_date": "2024-12-31",
  "priority": "דחופה"
}

# קבלת כל המשימות
GET /api/tasks

# קבלת משימה ספציפית
GET /api/tasks/{id}

# עדכון משימה
PUT /api/tasks/{id}
Content-Type: application/json
{
  "status": "בטיפול",
  "priority": "גבוהה",
  "notes": "הערות"
}

# מחיקת משימה
DELETE /api/tasks/{id}
```

### Stats

```powershell
# סטטיסטיקות כלליות
GET /api/stats

# סטטטיסטיקות משתמש
GET /api/stats/user/{name}
```

### Health

```powershell
# בדיקת תקינות
GET /health
```

---

## 🔐 Secrets Configuration

### Secrets.dev.toml (Local)

```toml
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = "587"
SMTP_USERNAME = "office@ghlawoffice.co.il"
SMTP_PASSWORD = "your-app-password-here"
SMTP_FROM = "office@ghlawoffice.co.il"
ADMIN_EMAIL = "HAIM@ghlawoffice.co.il"
SECRETARY_EMAIL = "office@ghlawoffice.co.il"
JWT_SECRET = "change-me-in-production"
CORS_ORIGINS = "http://localhost:3000,http://localhost:8080"
```

### Production Secrets

```powershell
cargo shuttle secrets set SMTP_HOST=smtp.gmail.com
cargo shuttle secrets set SMTP_PORT=587
cargo shuttle secrets set SMTP_USERNAME=office@ghlawoffice.co.il
cargo shuttle secrets set SMTP_PASSWORD=your-app-password
cargo shuttle secrets set SMTP_FROM=office@ghlawoffice.co.il
cargo shuttle secrets set ADMIN_EMAIL=HAIM@ghlawoffice.co.il
cargo shuttle secrets set SECRETARY_EMAIL=office@ghlawoffice.co.il
cargo shuttle secrets set JWT_SECRET=your-production-secret
```

---

## 🧪 בדיקות PowerShell

### Health Check

```powershell
Invoke-WebRequest http://localhost:8000/health
```

### יצירת משימה

```powershell
$task = @{
  title = "בדיקת מערכת"
  description = "בדיקה ראשונה"
  category = "טכנית"
  assigned_to = "חיים"
  assigned_to_email = "HAIM@ghlawoffice.co.il"
  created_by = "חיים"
  created_by_email = "HAIM@ghlawoffice.co.il"
  due_date = "2024-12-31"
  priority = "דחופה"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri http://localhost:8000/api/tasks `
  -Method POST `
  -Body $task `
  -ContentType "application/json"
```

### קבלת משימות

```powershell
Invoke-RestMethod http://localhost:8000/api/tasks
```

### עדכון משימה

```powershell
$update = @{
  status = "בטיפול"
  notes = "התחלתי לטפל"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri http://localhost:8000/api/tasks/TASK-20241228-143052 `
  -Method PUT `
  -Body $update `
  -ContentType "application/json"
```

### סטטיסטיקות

```powershell
Invoke-RestMethod http://localhost:8000/api/stats
```

---

## 🗄️ Database Queries

### התחברות ל-DB

```powershell
cargo shuttle db psql
```

### שאילתות שימושיות

```sql
-- כל המשימות
SELECT * FROM tasks ORDER BY created_at DESC;

-- משימות לפי סטטוס
SELECT status, COUNT(*) FROM tasks GROUP BY status;

-- משימות של משתמש
SELECT * FROM tasks WHERE assigned_to = 'חיים';

-- משימות דחופות
SELECT * FROM tasks WHERE priority = 'דחופה' AND status != 'הושלמה';

-- משימות שפג תוקפן
SELECT * FROM tasks WHERE due_date < CURRENT_DATE AND status != 'הושלמה';

-- ספירת קבצים מצורפים
SELECT task_id, COUNT(*) FROM attachments GROUP BY task_id;
```

---

## ⚠️ פתרון בעיות מהיר

### "Rust not found"
```powershell
# סגור PowerShell ופתח חדש
rustc --version
```

### "cargo shuttle not found"
```powershell
cargo install cargo-shuttle
# סגור PowerShell ופתח חדש
```

### "Database connection failed"
```powershell
cargo shuttle db reset
cargo shuttle run
```

### "Email not sending"
1. בדוק App Password ב-Secrets.dev.toml
2. וודא פורט 587 לא חסום
3. צפה בלוגים: `cargo shuttle logs`

### "Compilation errors"
```powershell
cargo clean
cargo build
```

---

## 📊 Performance Monitoring

### בדיקת זמן תגובה

```powershell
Measure-Command {
  Invoke-RestMethod http://localhost:8000/api/tasks
}
```

**מצופה**: < 5ms

### בדיקת זמן יצירה

```powershell
$task = @{...} | ConvertTo-Json -Compress

$result = Measure-Command {
  $response = Invoke-RestMethod -Uri http://localhost:8000/api/tasks `
    -Method POST -Body $task -ContentType "application/json"
}

Write-Host "Server processing: $($response.processing_time)ms"
Write-Host "Total time: $($result.TotalMilliseconds)ms"
```

**מצופה**:
- Server: 2-5ms
- Total: 10-50ms (כולל network)

---

## 🔄 עדכון הפרויקט

### Pull שינויים חדשים

```powershell
git pull origin main
```

### עדכון Dependencies

```powershell
cargo update
cargo build
```

### Re-deploy

```powershell
cargo shuttle deploy
```

---

## 📁 מבנה הפרויקט

```
shuttle-law-office/
├── src/
│   ├── main.rs              # Entry point
│   ├── models/
│   │   └── task.rs          # Data models
│   ├── routes/
│   │   ├── tasks.rs         # Task endpoints
│   │   └── stats.rs         # Stats endpoints
│   ├── services/
│   │   └── email.rs         # Email service
│   ├── handlers/
│   ├── db/
│   └── utils/
├── migrations/
│   └── 001_initial_schema.sql
├── Cargo.toml               # Dependencies
├── Shuttle.toml             # Shuttle config
├── Secrets.dev.toml         # Local secrets
└── README.md
```

---

## 🎯 השלבים הבאים

1. **File Upload** (בקרוב!)
   - S3 integration
   - Multipart form data

2. **Authentication**
   - JWT tokens
   - User login

3. **Real-time**
   - WebSockets
   - Live notifications

4. **Mobile App**
   - Flutter/React Native

---

## 💡 טיפים חשובים

- ✅ תמיד הרץ `cargo check` לפני commit
- ✅ השתמש ב-`cargo fmt` לפורמט קוד
- ✅ צפה בלוגים: `cargo shuttle logs`
- ✅ גבה secrets במקום בטוח!
- ✅ אל תעלה Secrets.dev.toml ל-Git

---

## 📞 עזרה

- **Docs**: [GETTING-STARTED.md](./GETTING-STARTED.md)
- **Shuttle**: https://docs.shuttle.rs
- **Discord**: https://discord.gg/shuttle

---

**🚀 Built with Shuttle.rs + Rust**
**⚖️ GH Law Office**
