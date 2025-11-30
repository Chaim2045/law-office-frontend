# 🎨 Law Office Frontend - Modern UI

ממשק משתמש מודרני ומעוצב למערכת ניהול משימות של משרד עורכי דין GH.

## ✨ תכונות

- 📋 **טופס 4 שלבים** עם מחוון התקדמות
- 👥 **12 כפתורי שמות** לבחירה מהירה
- 🎨 **עיצוב מודרני** עם Rubik font ו-CSS variables
- 📱 **Responsive** - עובד על כל המכשירים
- ⚡ **מהיר** - HTML/CSS/JS טהור, ללא frameworks כבדים
- 🔌 **API Integration** - מחובר ל-Rust backend

## 📁 מבנה

```
frontend/
├── index.html              # טופס יצירת משימות (4 שלבים)
├── dashboard.html          # לוח בקרה מזכירה
├── css/
│   ├── modern-style.css   # מערכת עיצוב מלאה
│   └── style.css          # סגנונות נוספים
└── js/
    ├── config.js          # הגדרות API
    ├── modern-form.js     # לוגיקת הטופס
    ├── dashboard.js       # לוגיקת הדשבורד
    └── task-form.js       # טופס פשוט (legacy)
```

## 🚀 הרצה מקומית

### אופציה 1: Python
```bash
cd frontend
python -m http.server 8080
# או
python3 -m http.server 8080
```

### אופציה 2: Node.js
```bash
npx serve frontend -p 8080
```

### אופציה 3: PHP
```bash
cd frontend
php -S localhost:8080
```

פתח בדפדפן: http://localhost:8080

## 🔌 חיבור ל-API

הפרונטאנד מזהה אוטומטית את הסביבה:

**פיתוח מקומי** (localhost):
```javascript
API_URL = 'http://localhost:8000'
```

**פרודקשן** (Netlify/הסטינג):
```javascript
API_URL = 'https://law-office-api.shuttleapp.rs'
```

ערוך ב-`js/config.js` אם צריך URL אחר.

## 🎨 מערכת העיצוב

### צבעים
- **Primary**: `#0049db` (כחול)
- **Primary Light**: `#2979ff` (כחול בהיר)
- **Success**: `#00d06c` (ירוק)
- **Warning**: `#f9a825` (צהוב)
- **Danger**: `#ff3c5f` (אדום)

### Typography
- **Font**: Rubik (Google Fonts)
- **Sizes**: מ-0.75rem עד 2rem
- **RTL**: תמיכה מלאה בעברית

### Components
- Cards
- Buttons (primary, secondary, danger)
- Forms (inputs, selects, textareas)
- Badges (status, priority, category)
- Modals
- Notifications
- Stepper (4-step wizard)

## 📋 דפים

### index.html - יצירת משימה
4 שלבים:
1. **פרטי המבקש** - בחירת שם + אימייל
2. **תיאור משימה** - כותרת, קטגוריה, תאריך יעד
3. **דחיפות** - רגילה / גבוהה / דחופה
4. **אישור** - סיכום ושליחה

### dashboard.html - לוח בקרה
- סטטיסטיקות (סה"כ, חדשות, בטיפול, הושלמו)
- חיפוש וסינון
- טבלת משימות
- פעולות (צפייה, עריכה, מחיקה)

## 🔧 התאמה אישית

### שינוי צבעים
ערוך את `css/modern-style.css`:
```css
:root {
  --color-primary: #YOUR-COLOR;
  --color-primary-light: #YOUR-LIGHT-COLOR;
}
```

### הוספת שם חדש
ערוך את `index.html`:
```html
<button type="button" class="name-chip"
        data-name="שם חדש"
        data-email="email@example.com">
  שם חדש
</button>
```

### שינוי קטגוריות
ערוך את `index.html` בבחירת הקטגוריה:
```html
<option value="קטגוריה חדשה">קטגוריה חדשה</option>
```

## 🌐 פריסה

### Netlify (מומלץ)
1. העלה לGitHub
2. התחבר ל-Netlify
3. בחר את הrepository
4. `Publish directory`: `frontend`
5. Deploy!

ראה [NETLIFY-DEPLOY.md](../NETLIFY-DEPLOY.md) למדריך מפורט.

### Vercel
```bash
vercel --prod
```

### GitHub Pages
```bash
# הגדר את frontend כספריית root
# או שנה את settings ב-GitHub
```

## 🐛 Debugging

### פתיחת Console
- Chrome/Edge: `F12` → Console
- Firefox: `F12` → Console
- Safari: Develop → Show JavaScript Console

### בעיות נפוצות

**לא רואה את העיצוב**
- בדוק שהקובץ `css/modern-style.css` קיים
- בדוק ב-Network tab (F12) שהקובץ נטען

**API לא עובד**
- בדוק שה-backend רץ
- בדוק את `js/config.js`
- בדוק ב-Console את השגיאות

**כפתורי שמות לא עובדים**
- בדוק ב-Console שגיאות JavaScript
- בדוק שהקובץ `js/modern-form.js` נטען

## 📱 תמיכה בדפדפנים

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS/Android)

## 🔐 אבטחה

- XSS Protection: `escapeHtml()` בכל הoutputs
- HTTPS: מומלץ בפרודקשן
- CORS: מוגדר ב-backend
- Input Validation: client-side + server-side

## 📚 טכנולוגיות

- **HTML5**: Semantic markup
- **CSS3**: Variables, Grid, Flexbox
- **JavaScript ES6+**: Async/await, Fetch API
- **Font Awesome 6**: Icons
- **Google Fonts**: Rubik

## 🎯 דרישות מערכת

- דפדפן מודרני (2020+)
- JavaScript enabled
- Internet connection (לGoogle Fonts)

## 💡 Tips

- השתמש ב-`localStorage` לשמירת משתמש נוכחי
- כל הטפסים כוללים validation
- התקדמות אוטומטית בין שלבים
- Auto-hide של הודעות הצלחה אחרי 5 שניות

---

**Built with ❤️ for GH Law Office**
