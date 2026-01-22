# 🚀 הגדרת Google Apps Script

המערכת עברה להשתמש ב-Google Apps Script במקום Netlify Functions.

## 📝 שלבים להגדרה:

### 1️⃣ העלאת הקוד ל-Google Apps Script

1. פתח את Google Sheets שלך
2. עבור ל: **Extensions → Apps Script**
3. מחק את הקוד הקיים
4. העתק את הקוד מהקובץ: `old-interfaces/ממשק משימות למזכירה/skript-OPTIMIZED.js`
5. הדבק בעורך
6. שמור (Ctrl+S)

### 2️⃣ פרסום ה-Web App

1. לחץ על **Deploy → New deployment**
2. בחר **Web app**
3. הגדר:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. לחץ **Deploy**
5. **העתק את ה-URL** שמתקבל (נראה כך: `https://script.google.com/macros/s/AKfycbw.../exec`)

### 3️⃣ עדכון ה-Frontend

1. פתח את הקובץ: `frontend/index.html`
2. חפש את השורה:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec';
   ```
3. **החלף** את `YOUR_SCRIPT_ID_HERE` ב-URL שקיבלת בשלב 2
4. שמור

### 4️⃣ בדיקה

1. פתח את `frontend/index.html` בדפדפן
2. מלא משימה חדשה
3. שלח
4. בדוק שהמשימה הגיעה ל-Google Sheets

## ✅ מה השתנה?

- ❌ **הוסר**: Netlify Functions + Supabase
- ❌ **הוסר**: לוח הבקרה (Dashboard)
- ✅ **נוסף**: חיבור ישיר ל-Google Apps Script
- ✅ **נשמר**: העיצוב המודרני עם ה-Stepper

## 📂 קבצים שהשתנו:

- `frontend/index.html` - הוסר קישור ללוח בקרה, נוסף GOOGLE_SCRIPT_URL
- `frontend/js/modern-form.js` - עודכן לשלוח ל-Google Apps Script במקום API

## 🔍 קוד Google Apps Script:

הקוד המלא נמצא ב:
`old-interfaces/ממשק משימות למזכירה/skript-OPTIMIZED.js`

זהו הקוד שצריך להעלות ל-Apps Script Editor.

## ⚙️ הגדרות נוספות:

### רשימת משתמשים בקוד:
```javascript
{name: "חיים", email: "HAIM@ghlawoffice.co.il"},
{name: "גיא", email: "guy@ghlawoffice.co.il"},
{name: "רועי", email: "roi@ghlawoffice.co.il"},
{name: "שחר", email: "shahar@ghlawoffice.co.il"},
{name: "עוזי", email: "uzi@ghlawoffice.co.il"},
{name: "אורי", email: "ori@ghlawoffice.co.il"},
{name: "קרן", email: "office@ghlawoffice.co.il"},
{name: "ראיד", email: "reed@ghlawoffice.co.il"},
{name: "מרווה", email: "Marva@ghlawoffice.co.il"},
{name: "מירי", email: "miri@ghlawoffice.co.il"},
{name: "עוז", email: "Oz@brosh-finance.com"},
{name: "לירז", email: "Liraz@siboni-law.com"}
```

---

**💡 טיפ**: שמור את ה-URL של ה-Google Apps Script במקום בטוח!
