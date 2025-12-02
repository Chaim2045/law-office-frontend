# 🚀 הגדרת Shuttle.rs ל-GitHub Actions

## מה זה עושה?

GitHub Action הזה מפרס אוטומטית את ה-Backend לכל push ל-`main` שמשנה קבצים ב-`backend/`.

---

## 📋 הוראות הגדרה (חד-פעמי)

### שלב 1: יצירת חשבון ב-Shuttle.rs

1. לך ל: **https://www.shuttle.rs**
2. לחץ "Sign up" או "Get Started"
3. התחבר עם GitHub (או email)
4. אשר את החשבון

### שלב 2: קבלת API Key

1. לאחר ההתחברות, לך ל: **https://console.shuttle.rs**
2. לחץ על **"Settings"** או **"API Keys"**
3. לחץ **"Generate New API Key"**
4. העתק את ה-API Key (זה יוצג רק פעם אחת!)

### שלב 3: הוספת Secret ל-GitHub

1. לך ל-GitHub repository שלך:
   ```
   https://github.com/Chaim2045/law-office-frontend
   ```

2. לחץ על **Settings** (בתפריט העליון)

3. בתפריט הצד, לחץ **Secrets and variables** → **Actions**

4. לחץ **"New repository secret"**

5. הוסף secret חדש:
   - **Name:** `SHUTTLE_API_KEY`
   - **Secret:** הדבק את ה-API Key ש-Shuttle נתן לך
   - לחץ **"Add secret"**

---

## ✅ זהו! עכשיו זה יעבוד אוטומטית

כל פעם שתעשה `git push` לקוד ב-`backend/`, GitHub Actions יריץ deploy אוטומטי.

---

## 🔍 בדיקת הפריסה

### לבדוק אם ה-Action רץ:

1. לך ל-GitHub repository
2. לחץ על **Actions** (בתפריט העליון)
3. תראה את הרצת "Deploy Backend to Shuttle"
4. לחץ עליה לראות את הלוג

### לבדוק אם ה-API עובד:

אחרי פריסה מוצלחת, בדוק:
```
https://law-office-api.shuttleapp.rs/health
```

אמור להחזיר:
```json
{"status": "healthy"}
```

---

## 🐛 פתרון בעיות

### "Shuttle API Key is invalid"
- ודא ש-Secret נוסף נכון ב-GitHub
- ודא שהשם הוא בדיוק: `SHUTTLE_API_KEY`

### "Build failed"
- בדוק את הלוג ב-Actions
- ייתכן שיש שגיאות קומפילציה ב-Rust

### "Deployment timeout"
- הפריסה הראשונה יכולה לקחת 5-10 דקות
- נסה שוב אם נכשל

---

## 📚 מסמכים נוספים

- **Shuttle Docs:** https://docs.shuttle.rs
- **GitHub Actions Docs:** https://docs.github.com/en/actions
