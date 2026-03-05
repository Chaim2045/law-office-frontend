# ✅ Checklist - פריסה ל-Netlify

## לפני שמתחילים

- [ ] יש לך חשבון GitHub (אם לא: https://github.com/join)
- [ ] Git מותקן במחשב (בדוק: `git --version`)
- [ ] הקבצים הבאים קיימים:
  - [ ] `frontend/index.html`
  - [ ] `frontend/dashboard.html`
  - [ ] `frontend/css/modern-style.css`
  - [ ] `frontend/js/modern-form.js`
  - [ ] `frontend/js/config.js`
  - [ ] `netlify.toml`

## שלב 1: העלאה ל-GitHub (5 דקות)

### 1.1 אתחול Git Repository
```bash
cd c:\Users\haim\law-office-backend-rust
git init
```
- [ ] הרצתי את הפקודה
- [ ] לא קיבלתי שגיאות

### 1.2 הוספת קבצים
```bash
git add .
git status
```
- [ ] רואה רשימה של קבצים בירוק
- [ ] אין קבצי `Secrets.toml` ברשימה (אם יש - הסר אותם!)

### 1.3 יצירת Commit
```bash
git commit -m "Initial commit - Modern law office frontend"
```
- [ ] Commit נוצר בהצלחה

### 1.4 יצירת Repository ב-GitHub
1. לך ל: https://github.com/new
2. שם Repository: `law-office-frontend` (או כל שם שתרצה)
3. תיאור: `Modern task management system for law office`
4. **ציבורי או פרטי**: בחר לפי העדפה
5. **אל** תסמן "Initialize with README" (יש לך כבר!)
6. לחץ "Create repository"

- [ ] Repository נוצר ב-GitHub
- [ ] העתקתי את ה-URL (למשל: `https://github.com/YOUR-USERNAME/law-office-frontend.git`)

### 1.5 חיבור ל-GitHub
```bash
git remote add origin https://github.com/YOUR-USERNAME/law-office-frontend.git
git branch -M main
git push -u origin main
```
- [ ] הקבצים הועלו ל-GitHub
- [ ] רואה אותם ב-https://github.com/YOUR-USERNAME/law-office-frontend

---

## שלב 2: פריסה ל-Netlify (3 דקות)

### 2.1 התחברות ל-Netlify
1. לך ל: https://app.netlify.com
2. לחץ "Sign up" או "Log in"
3. בחר "GitHub" כשיטת התחברות
4. אשר את ההרשאות

- [ ] מחובר ל-Netlify
- [ ] רואה את ה-dashboard

### 2.2 יצירת אתר חדש
1. לחץ "Add new site"
2. בחר "Import an existing project"
3. בחר "Deploy with GitHub"
4. אשר הרשאות נוספות אם נדרש
5. בחר את הrepository `law-office-frontend`

- [ ] בחרתי את הrepository הנכון

### 2.3 הגדרות Build
וודא שההגדרות הן:
```
Build command: (leave empty or: echo "Static site")
Publish directory: frontend
```

- [ ] הגדרות נכונות
- [ ] לחצתי "Deploy site"

### 2.4 המתנה לפריסה
- [ ] רואה "Site deploy in progress"
- [ ] אחרי 1-2 דקות: "Published" ✅

### 2.5 קבלת URL
Netlify נותן לך URL אוטומטי כמו:
```
https://wonderful-name-123456.netlify.app
```

- [ ] העתקתי את ה-URL
- [ ] פתחתי את האתר בדפדפן
- [ ] רואה את העיצוב המודרני!

---

## שלב 3: בדיקות (2 דקות)

### 3.1 בדיקה ויזואלית
- [ ] העמוד נטען
- [ ] רואה כותרת כחולה מעוצבת
- [ ] רואה 4 שלבים למעלה
- [ ] רואה 12 כפתורי שמות (חיים, גיא, רועי...)
- [ ] הגופן הוא Rubik (עברית קריאה)
- [ ] העיצוב responsive (נראה טוב גם בנייד)

### 3.2 בדיקת Dashboard
- [ ] לחצתי על "לוח בקרה" (או פתחתי `/dashboard.html`)
- [ ] רואה 4 כרטיסי סטטיסטיקה
- [ ] רואה שדה חיפוש
- [ ] רואה טבלה

### 3.3 בדיקת טופס
- [ ] לחצתי על כפתור שם - הוא מסומן בכחול
- [ ] לחצתי "המשך" - עבר לשלב 2
- [ ] ניסיתי לחזור - עובד
- [ ] כל הכפתורים עובדים

⚠️ **אם API לא רץ** - לא תוכל לשלוח משימות בפועל (זה תקין!)

---

## שלב 4: התאמות אישיות (אופציונלי)

### 4.1 שינוי שם האתר
1. ב-Netlify: "Site settings" → "Change site name"
2. בחר שם חדש (למשל: `gh-law-office`)
3. האתר יהיה: `https://gh-law-office.netlify.app`

- [ ] שיניתי את השם (אופציונלי)

### 4.2 Custom Domain
אם יש לך דומיין משלך:
1. "Domain settings" → "Add custom domain"
2. הזן את הדומיין (למשל: `tasks.ghlawoffice.co.il`)
3. עקוב אחרי ההנחיות להגדרת DNS

- [ ] הוספתי דומיין מותאם (אופציונלי)

### 4.3 HTTPS
Netlify נותן HTTPS אוטומטית - אין צורך לעשות כלום!
- [ ] רואה מנעול ירוק בדפדפן ✅

---

## שלב 5: Continuous Deployment (בדיקה)

### 5.1 עדכון קטן
```bash
# ערוך משהו קטן, למשל את הכותרת
notepad frontend\index.html

# שמור, ואז:
git add .
git commit -m "Update title"
git push
```

- [ ] Push הצליח
- [ ] חזרתי ל-Netlify ורואה "Deploy in progress"
- [ ] אחרי 1 דקה האתר התעדכן אוטומטית! 🎉

---

## שלב 6: חיבור ל-Backend (בהמשך)

כשתהיה מוכן לפרוס את ה-Rust backend:

### 6.1 פריסת Backend
```bash
cd backend
cargo shuttle deploy
```
- [ ] Backend deployed ל-Shuttle
- [ ] קיבלתי URL (למשל: `https://law-office-api.shuttleapp.rs`)

### 6.2 עדכון Frontend
אופציה A - דרך Netlify UI:
1. Site settings → Environment variables
2. הוסף: `API_URL` = `https://law-office-api.shuttleapp.rs`

אופציה B - דרך קוד:
```javascript
// frontend/js/config.js
const API_CONFIG = {
  PRODUCTION: 'https://law-office-api.shuttleapp.rs',
  // ...
}
```

- [ ] עדכנתי את ה-API URL
- [ ] האתר מתחבר ל-backend
- [ ] יכול ליצור משימות אמיתיות! 🎉

---

## ✅ סיימתי!

אם סימנת את כל הסעיפים - **מזל טוב!** 🎊

האתר שלך חי ב:
```
https://YOUR-SITE-NAME.netlify.app
```

### מה הלאה?
- [ ] שתף את הקישור עם הצוות
- [ ] פרוס את ה-Backend
- [ ] תהנה ממערכת ניהול משימות מהירה ב-500-1000x!

---

## 🆘 נתקעת?

### בעיות נפוצות:

**"Site not found" ב-Netlify**
→ ודא ש-`Publish directory` מוגדר ל-`frontend`

**"Page looks broken"**
→ פתח F12 → Console ובדוק שגיאות
→ ודא שהקבצים ב-`frontend/css/` קיימים ב-GitHub

**"Can't connect to API"**
→ זה תקין! ה-API עוד לא deployed
→ תוכל לפרוס אותו בהמשך

**Git אומר "permission denied"**
→ וודא שאתה מחובר ל-GitHub
→ נסה: `git config --global user.email "your@email.com"`

---

**💬 צריך עזרה נוספת?**
- קרא את [NETLIFY-DEPLOY.md](NETLIFY-DEPLOY.md)
- קרא את [QUICK-START.md](QUICK-START.md)
- בדוק את [frontend/README.md](frontend/README.md)
