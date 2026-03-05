# ✅ Production Checklist - Law Office Backend

## 🚨 חובה לפני Production!

### 1. אבטחה (Security)

- [ ] **יצר JWT Secret חזק**
  ```bash
  openssl rand -base64 32
  # העתק ל-Secrets.toml
  ```

- [ ] **הגדר App Password ב-Gmail**
  - לא סיסמת המשתמש הרגילה!
  - צור App Password ייעודי ב: https://myaccount.google.com/apppasswords
  - העתק ל-`SMTP_PASSWORD` ב-Secrets.toml

- [ ] **ודא שקבצי Secrets לא ב-Git**
  ```bash
  git status
  # Secrets.toml צריך להיות ב-.gitignore
  ```

- [ ] **הרץ Security Audit**
  ```bash
  cd backend
  cargo audit
  # תקן כל vulnerability שנמצא
  ```

- [ ] **בדוק CORS configuration**
  - אל תשתמש ב-wildcard (`*`) בפרודקשן!
  - הגדר רק domains ספציפיים

- [ ] **החלף סיסמאות default**
  - Database password
  - Admin user (אם יצרת)
  - כל credentials

---

### 2. Configuration

- [ ] **הגדר משתני סביבה נכונים**
  ```toml
  # Secrets.toml לפרודקשן:
  API_BASE_URL = "https://your-actual-domain.com"
  ADMIN_EMAIL = "admin@your-actual-domain.com"
  RATE_LIMIT_REQUESTS_PER_MINUTE = "60"  # התאם לצרכים
  ```

- [ ] **ודא Database backups**
  - Shuttle עושה backup אוטומטי
  - בדוק ב: `cargo shuttle status`

- [ ] **הגדר Email בצורה נכונה**
  - SMTP_HOST = "smtp.gmail.com"
  - SMTP_PORT = "587"
  - Username + App Password תקינים

---

### 3. קוד (Code Quality)

- [ ] **הרץ Format Check**
  ```bash
  cd backend
  cargo fmt --check
  ```

- [ ] **הרץ Clippy (Linter)**
  ```bash
  cargo clippy -- -D warnings
  ```

- [ ] **הרץ Tests**
  ```bash
  cargo test
  # כל הטסטים צריכים לעבור!
  ```

- [ ] **בנה בגרסת Release**
  ```bash
  cargo build --release
  # ודא שהבנייה מצליחה בלי שגיאות
  ```

- [ ] **בדוק שאין Hardcoded Secrets**
  ```bash
  grep -r "password" src/
  grep -r "secret" src/
  # ודא שאין סיסמאות או secrets בקוד!
  ```

---

### 4. Database

- [ ] **הרץ Migrations**
  ```bash
  # Shuttle יריץ אוטומטית, אבל בדוק:
  cargo shuttle deploy
  # ראה בלוגים שה-migrations עברו בהצלחה
  ```

- [ ] **בדוק Indexes**
  ```sql
  -- ודא שיש indexes על:
  -- tasks: assigned_to, status, created_at, due_date
  -- users: email, role
  ```

- [ ] **הגדר Connection Pool**
  - כבר מוגדר ב-sqlx
  - בדוק בלוגים שאין connection timeouts

---

### 5. Monitoring & Logging

- [ ] **הגדר Log Level**
  ```bash
  # Production: INFO או WARN
  RUST_LOG=info cargo shuttle deploy
  ```

- [ ] **בדוק Health Endpoints**
  ```bash
  curl https://your-app.shuttleapp.rs/health
  curl https://your-app.shuttleapp.rs/ready
  ```

- [ ] **הגדר Monitoring**
  - בדוק לוגים: `cargo shuttle logs --follow`
  - הגדר alerts (אם יש)

---

### 6. Performance

- [ ] **הפעל Compression**
  - כבר מופעל ב-main.rs (CompressionLayer)

- [ ] **בדוק Response Times**
  ```bash
  # צריך להיות < 10ms
  curl -w "@curl-format.txt" https://your-app/api/tasks
  ```

- [ ] **הגדר Rate Limiting נכון**
  - בדוק ב-Secrets.toml
  - התאם לצפי העומס

---

### 7. DNS & Domain (אופציונלי)

- [ ] **הגדר Custom Domain**
  ```bash
  # אם רוצה domain משלך במקום .shuttleapp.rs
  cargo shuttle domain add your-domain.com
  ```

- [ ] **הגדר SSL/HTTPS**
  - Shuttle מספק אוטומטית!
  - ודא שהאתר נגיש דרך HTTPS

---

### 8. Frontend Integration

- [ ] **עדכן Frontend URLs**
  ```javascript
  // frontend/js/config.js
  const API_URL = "https://your-app.shuttleapp.rs";
  ```

- [ ] **בדוק CORS**
  - הכנס request מהfrontend
  - ודא שאין CORS errors בconsole

---

### 9. CI/CD

- [ ] **הגדר GitHub Secrets**
  - Settings > Secrets > Actions
  - הוסף: `SHUTTLE_API_KEY`

- [ ] **בדוק שה-Workflows עובדים**
  ```bash
  git push origin main
  # עקוב אחרי GitHub Actions
  ```

- [ ] **ודא Auto-Deploy פועל**
  - Push ל-main אמור לעשות deploy אוטומטי

---

### 10. Backup & Recovery

- [ ] **יצא Backup של Database**
  ```bash
  # Shuttle עושה backups אוטומטיים
  # אבל כדאי גם local backup
  cargo shuttle db dump > backup.sql
  ```

- [ ] **תעד את ה-Secrets**
  - שמור Secrets.toml במקום מאובטח (לא Git!)
  - Password manager מומלץ

- [ ] **תכנית Recovery**
  - מה עושים אם השרת נופל?
  - איך משחזרים database?

---

## 📋 Deployment Steps

### Development → Production

1. **Local Testing**
   ```bash
   cd backend
   cargo shuttle run
   # בדוק שהכל עובד מקומית
   ```

2. **Update Secrets**
   ```bash
   cargo shuttle secrets set SMTP_USERNAME=...
   cargo shuttle secrets set SMTP_PASSWORD=...
   cargo shuttle secrets set JWT_SECRET=$(openssl rand -base64 32)
   ```

3. **Deploy**
   ```bash
   cargo shuttle deploy
   ```

4. **Verify**
   ```bash
   # בדוק health
   curl https://your-app.shuttleapp.rs/health

   # בדוק logs
   cargo shuttle logs --follow

   # צור משימת test
   curl -X POST https://your-app.shuttleapp.rs/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","category":"Test",...}'
   ```

5. **Monitor**
   ```bash
   # ראה שהכל עובד
   cargo shuttle logs --lines 100
   ```

---

## 🚨 Common Issues

### Issue: Email לא נשלח
**Fix:**
```bash
# בדוק שה-App Password נכון
cargo shuttle secrets list | grep SMTP

# ראה לוגים
cargo shuttle logs | grep email
```

### Issue: Database Connection Failed
**Fix:**
```bash
# Restart הפרויקט
cargo shuttle stop
cargo shuttle start

# בדוק logs
cargo shuttle logs | grep DATABASE
```

### Issue: JWT Errors
**Fix:**
```bash
# יצר secret חדש
openssl rand -base64 32

# עדכן
cargo shuttle secrets set JWT_SECRET=<new-secret>

# Deploy מחדש
cargo shuttle deploy
```

---

## 📊 Post-Deployment Monitoring

### מה לבדוק כל יום:
- [ ] Health endpoint (`/health`)
- [ ] Error logs (`cargo shuttle logs | grep ERROR`)
- [ ] Database size/usage
- [ ] Response times

### מה לבדוק כל שבוע:
- [ ] Security audit (`cargo audit`)
- [ ] Dependencies updates (`cargo update`)
- [ ] Backup verification
- [ ] Performance metrics

### מה לבדוק כל חודש:
- [ ] JWT Secret rotation (כל 90 יום)
- [ ] Database optimization
- [ ] Cost analysis (Shuttle billing)
- [ ] User feedback

---

## 🎯 Success Criteria

המערכת מוכנה לproduction כאשר:

✅ כל הטסטים עוברים
✅ Security audit נקי
✅ אין hardcoded secrets
✅ Email נשלח בהצלחה
✅ Database migrations עברו
✅ Health endpoints מחזירים OK
✅ Frontend מתחבר בהצלחה
✅ Response time < 10ms
✅ CI/CD פועל
✅ Backups מוגדרים

---

## 🔒 Security Best Practices

1. **Secrets Management**
   - השתמש ב-Shuttle Secrets (לא .env files!)
   - אל תשתף secrets ב-Slack/Email
   - החלף secrets אם חשדת לחשיפה

2. **Access Control**
   - הגבל גישה ל-Shuttle project
   - השתמש ב-2FA ב-GitHub
   - הגדר roles נכון

3. **Database**
   - אל תחשוף DB credentials
   - הגבל connections
   - סקור queries לSQL injection

4. **API**
   - הפעל rate limiting
   - ולידציה על כל input
   - החזר errors generic (לא לחשוף מידע רגיש)

---

**✅ כשסיימת את כל הסעיפים - אתה מוכן לפרודקשן!**

**⚖️ GH Law Office - Production Checklist**
