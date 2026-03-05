/**
 * ================================================
 * מערכת ניהול משימות משרדית - גרסה 8.2 (מלאה)
 * ================================================
 *
 * תכונות עיקריות:
 * - ממשק API לניהול משימות
 * - תמיכה מלאה ב-JSONP לעקיפת CORS
 * - מיילים אוטומטיים חכמים (ללא אימוג'ים - תואם Gmail)
 * - מערכת גיבוי והגנה
 * - דוחות וסטטיסטיקות
 * - ממשק אישי למשתמשים
 * - דשבורד מזכירה (doPost routing)
 * - דף השלמת משימה שהוחזרה
 *
 * @version 8.2.0
 * @lastUpdate 2026-02
 *
 * ================================================
 * הוראות עדכון:
 * ================================================
 * 1. פתח https://script.google.com
 * 2. בחר את הפרויקט של מערכת המשימות
 * 3. מחק את כל התוכן של Code.gs
 * 4. הדבק את כל הקובץ הזה במקום
 * 5. שמור (Ctrl+S)
 * 6. Deploy > Manage deployments > עריכה > New version > Deploy
 *    (כך ה-URL לא ישתנה!)
 * ================================================
 */

// ================================================
// הגדרות מערכת
// ================================================
const CONFIG = {
  // הגדרות אימייל
  email: {
    admin: "HAIM@ghlawoffice.co.il",
    secretary: "office@ghlawoffice.co.il"
  },

  // הגדרות תיקיות
  folders: {
    attachments: "קבצים מצורפים למשימות"
  },

  // הגדרות מערכת
  system: {
    name: "מערכת ניהול משימות משרד עו\"ד",
    version: "8.2.0",
    maxDailyTasks: 300,
    timezone: "Asia/Jerusalem"
  },

  // שמות גיליונות
  sheets: {
    tasks: "משימות",
    dailyReports: "דוחות יומיים",
    userStats: "סטטיסטיקות משתמשים",
    systemLog: "לוג מערכת",
    backups: "גיבויי מחיקות"
  },

  // רשימות ערכים
  taskCategories: ["משפטית", "טכנית", "גבייה", "פגישה", "אדמיניסטרטיבית", "אחר"],
  priorityLevels: ["רגילה", "דחופה", "דחופה מאוד"],
  taskStatuses: ["ממתינה", "בביצוע", "בוצע", "הוחזר להשלמה", "בוטל", "פג תוקף - לא רלוונטי"],

  // רשימת משתמשים
  users: [
    {name: "חיים", email: "Haim@ghlawoffice.co.il", role: "מנהל"},
    {name: "גיא", email: "guy@ghlawoffice.co.il", role: "עורך דין"},
    {name: "רועי", email: "roi@ghlawoffice.co.il", role: "עורך דין"},
    {name: "שחר", email: "shahar@ghlawoffice.co.il", role: "עורך דין"},
    {name: "עוזי", email: "uzi@ghlawoffice.co.il", role: "עורך דין"},
    {name: "אורי", email: "ori@ghlawoffice.co.il", role: "עורך דין"},
    {name: "ראיד", email: "raad@ghlawoffice.co.il", role: "עורך דין"},
    {name: "מרווה", email: "Marva@ghlawoffice.co.il", role: "עורכת דין"},
    {name: "מירי", email: "miri@ghlawoffice.co.il", role: "עורכת דין"},
    {name: "שני", email: "office@ghlawoffice.co.il", role: "מנהלת משרד"},
    {name: "נטליה", email: "Natanikboyko@gmail.com", role: "רואת חשבון"},
    {name: "מריה", email: "ACC20@ACCOUNTER.ONE", role: "רואת חשבון"}
  ]
};

// ================================================
// נקודות כניסה ל-Web App
// ================================================

/**
 * טיפול בבקשות GET - API לממשק המזכירה + ממשק אישי + תמיכה ב-JSONP
 */
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  const user = e.parameter.user;

  try {
    let result;

    switch(action) {
      case 'getTasks':
        result = getAllTasksForSecretary();
        break;

      case 'updateTask':
        result = updateTaskFromSecretary(e);
        break;

      case 'getStats':
        result = getTaskStatistics();
        break;

      case 'incrementReturnCount':
        result = incrementReturnCount(e.parameter.row);
        break;

      case 'getUserTasks':
        result = getUserTasks(user);
        break;

      case 'getUserProfile':
        result = getUserProfile(user);
        break;

      case 'getUserStats':
        result = getUserStatistics(user);
        break;

      default:
        if (!action) {
          return HtmlService.createHtmlOutput(
            '<html dir="rtl"><head><title>מערכת ניהול משימות</title>'
            + '<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}'
            + '.container{background:white;padding:40px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.2);text-align:center}'
            + 'h1{color:#333}p{color:#666}.version{margin-top:20px;font-size:14px;color:#999}</style></head>'
            + '<body><div class="container"><h1>מערכת ניהול משימות</h1><p>המערכת פעילה ומוכנה לשימוש</p>'
            + '<div class="version">גרסה ' + CONFIG.system.version + '</div></div></body></html>'
          );
        }
        result = {status: 'error', message: 'Invalid action: ' + action};
    }

    return createResponse(result, callback);

  } catch (error) {
    console.error('Error in doGet:', error);
    logSystemEvent('שגיאה ב-doGet: ' + error.toString() + ', action: ' + action + ', user: ' + user, 'ERROR');
    return createResponse({
      status: 'error',
      message: error.toString(),
      stack: error.stack
    }, callback);
  }
}

/**
 * טיפול בבקשות POST - routing לפי action
 * תומך ב: משימה חדשה, דשבורד מזכירה, דף השלמת משימה
 */
function doPost(e) {
  try {
    var action = e.parameter.action || '';

    switch(action) {
      case 'getAllTasks':
        return createResponse(getAllTasksForSecretary());

      case 'markTaskCompleted':
        return createResponse(handleMarkCompleted(e.parameter));

      case 'returnTask':
        return createResponse(handleReturnTask(e.parameter));

      case 'getTask':
        return createResponse(getTaskForResubmit(e.parameter));

      case 'resubmitTask':
        return createResponse(handleTaskResubmit(e.parameter));

      default:
        // ברירת מחדל - משימה חדשה (תואם לטופס שליחת משימות)
        return handleNewTask(e);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    logSystemEvent('שגיאה ב-doPost: ' + error.toString(), 'ERROR');
    return createResponse({
      status: 'error',
      message: 'שגיאה בעיבוד הבקשה: ' + error.toString()
    });
  }
}

/**
 * יצירת תגובה עם תמיכה ב-JSONP
 */
function createResponse(data, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================
// פונקציות דשבורד מזכירה (חדש!)
// ================================================

/**
 * סימון משימה כבוצעה מהדשבורד
 * נקרא כש-action=markTaskCompleted
 */
function handleMarkCompleted(params) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);
    var rowIndex = parseInt(params.row);
    var taskId = params.taskId;
    var details = params.details || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'מספר שורה לא תקין: ' + rowIndex };
    }

    var now = new Date();

    // עדכון סטטוס
    sheet.getRange(rowIndex, colMap['סטטוס']).setValue('בוצע');

    // עדכון פרטי ביצוע
    if (colMap['פרטי ביצוע'] && details) {
      sheet.getRange(rowIndex, colMap['פרטי ביצוע']).setValue(details);
    }

    // עדכון תאריך ושעת השלמה
    if (colMap['תאריך השלמה']) {
      sheet.getRange(rowIndex, colMap['תאריך השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
      );
    }
    if (colMap['שעת השלמה']) {
      sheet.getRange(rowIndex, colMap['שעת השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
      );
    }

    // עדכון checkbox
    if (colMap['הושלם']) {
      sheet.getRange(rowIndex, colMap['הושלם']).setValue(true);
    }

    SpreadsheetApp.flush();

    // שליחת מייל השלמה למבקש
    try {
      sendCompletionEmailFromRow(sheet, rowIndex, colMap);
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
      logSystemEvent('שגיאה בשליחת מייל השלמה: ' + emailError.toString(), 'WARNING');
    }

    logSystemEvent('משימה ' + taskId + ' הושלמה מהדשבורד', 'SUCCESS');

    return {
      status: 'success',
      message: 'המשימה סומנה כבוצעת בהצלחה',
      taskId: taskId
    };

  } catch (error) {
    console.error('Error in handleMarkCompleted:', error);
    logSystemEvent('שגיאה בסימון משימה כבוצעת: ' + error.toString(), 'ERROR');
    return {
      status: 'error',
      message: 'שגיאה בעדכון המשימה: ' + error.toString()
    };
  }
}

/**
 * החזרת משימה למבקש מהדשבורד
 * נקרא כש-action=returnTask
 */
function handleReturnTask(params) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);
    var rowIndex = parseInt(params.row);
    var taskId = params.taskId;
    var reason = params.reason || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'מספר שורה לא תקין: ' + rowIndex };
    }

    // עדכון סטטוס
    sheet.getRange(rowIndex, colMap['סטטוס']).setValue('הוחזר להשלמה');

    // עדכון הערות מזכירה עם סיבת ההחזרה
    if (colMap['הערות מזכירה']) {
      var currentNotes = sheet.getRange(rowIndex, colMap['הערות מזכירה']).getValue() || '';
      var timestamp = Utilities.formatDate(new Date(), CONFIG.system.timezone, "dd/MM/yyyy HH:mm");
      var newNote = '[הוחזר ' + timestamp + '] ' + reason;
      var updatedNotes = currentNotes ? currentNotes + '\n' + newNote : newNote;
      sheet.getRange(rowIndex, colMap['הערות מזכירה']).setValue(updatedNotes);
    }

    // עדכון מונה החזרות
    if (colMap['מועבר פעמים']) {
      var currentCount = sheet.getRange(rowIndex, colMap['מועבר פעמים']).getValue() || 0;
      sheet.getRange(rowIndex, colMap['מועבר פעמים']).setValue(currentCount + 1);
    }

    SpreadsheetApp.flush();

    // שליחת מייל החזרה למבקש
    try {
      var email = sheet.getRange(rowIndex, colMap['אימייל המבקש']).getValue();
      var name = sheet.getRange(rowIndex, colMap['שם המבקש']).getValue();
      var description = sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue();

      if (email) {
        sendTaskReturnEmail(email, name, taskId, description, reason, rowIndex);
      }
    } catch (emailError) {
      console.error('Error sending return email:', emailError);
      logSystemEvent('שגיאה בשליחת מייל החזרה: ' + emailError.toString(), 'WARNING');
    }

    logSystemEvent('משימה ' + taskId + ' הוחזרה מהדשבורד. סיבה: ' + reason, 'INFO');

    return {
      status: 'success',
      message: 'המשימה הוחזרה למבקש בהצלחה',
      taskId: taskId
    };

  } catch (error) {
    console.error('Error in handleReturnTask:', error);
    logSystemEvent('שגיאה בהחזרת משימה: ' + error.toString(), 'ERROR');
    return {
      status: 'error',
      message: 'שגיאה בהחזרת המשימה: ' + error.toString()
    };
  }
}

// ================================================
// פונקציות דף השלמת משימה שהוחזרה (חדש!)
// ================================================

/**
 * טעינת פרטי משימה לדף השלמה
 * נקרא כש-action=getTask
 */
function getTaskForResubmit(params) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);
    var rowIndex = parseInt(params.row);
    var taskId = params.taskId;

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'שורה לא תקינה' };
    }

    // קריאת נתוני המשימה
    var task = {
      id: String(sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue()),
      date: sheet.getRange(rowIndex, colMap['תאריך שליחה']).getValue(),
      requester: sheet.getRange(rowIndex, colMap['שם המבקש']).getValue(),
      description: String(sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue() || ''),
      category: sheet.getRange(rowIndex, colMap['סיווג משימה']).getValue(),
      priority: sheet.getRange(rowIndex, colMap['דחיפות']).getValue(),
      status: sheet.getRange(rowIndex, colMap['סטטוס']).getValue(),
      secretaryNotes: String(sheet.getRange(rowIndex, colMap['הערות מזכירה']).getValue() || ''),
      dueDate: sheet.getRange(rowIndex, colMap['תאריך לביצוע']).getValue()
    };

    // וידוא תואם
    if (String(task.id) !== String(taskId)) {
      return { status: 'error', message: 'מזהה משימה לא תואם את השורה' };
    }

    // חילוץ סיבת ההחזרה האחרונה מהערות מזכירה
    var notes = task.secretaryNotes;
    var returnReason = '';
    var matches = notes.match(/\[הוחזר [^\]]+\] ([^\n]+)/g);
    if (matches && matches.length > 0) {
      var lastMatch = matches[matches.length - 1];
      returnReason = lastMatch.replace(/\[הוחזר [^\]]+\] /, '');
    }
    task.returnReason = returnReason;

    return { status: 'success', task: task };

  } catch (error) {
    console.error('Error in getTaskForResubmit:', error);
    return { status: 'error', message: 'שגיאה בטעינת המשימה: ' + error.toString() };
  }
}

/**
 * טיפול בשליחה מחדש של משימה שהוחזרה
 * נקרא כש-action=resubmitTask
 */
function handleTaskResubmit(params) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);
    var rowIndex = parseInt(params.row);
    var taskId = params.taskId;
    var responseText = params.response || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'מספר שורה לא תקין: ' + rowIndex };
    }

    // וידוא מזהה משימה תואם
    var actualTaskId = String(sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue());
    if (actualTaskId !== String(taskId)) {
      return { status: 'error', message: 'מזהה משימה לא תואם את השורה' };
    }

    // החזרת סטטוס לממתינה
    sheet.getRange(rowIndex, colMap['סטטוס']).setValue('ממתינה');

    // הוספת תשובת המבקש להערות מזכירה
    if (colMap['הערות מזכירה']) {
      var currentNotes = sheet.getRange(rowIndex, colMap['הערות מזכירה']).getValue() || '';
      var timestamp = Utilities.formatDate(new Date(), CONFIG.system.timezone, "dd/MM/yyyy HH:mm");
      var newNote = '[תשובת מבקש ' + timestamp + '] ' + responseText;
      var updatedNotes = currentNotes ? currentNotes + '\n' + newNote : newNote;
      sheet.getRange(rowIndex, colMap['הערות מזכירה']).setValue(updatedNotes);
    }

    SpreadsheetApp.flush();

    // שליחת הודעה למזכירה
    try {
      var requesterName = sheet.getRange(rowIndex, colMap['שם המבקש']).getValue();
      var description = sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue();
      sendResubmitNotificationToSecretary(taskId, requesterName, String(description || ''), responseText);
    } catch (emailError) {
      console.error('Error sending resubmit notification:', emailError);
      logSystemEvent('שגיאה בשליחת הודעת שליחה מחדש: ' + emailError.toString(), 'WARNING');
    }

    logSystemEvent('משימה ' + taskId + ' נשלחה מחדש ע"י המבקש', 'INFO');

    return {
      status: 'success',
      message: 'המשימה נשלחה מחדש בהצלחה',
      taskId: taskId
    };

  } catch (error) {
    console.error('Error in handleTaskResubmit:', error);
    logSystemEvent('שגיאה בשליחה מחדש של משימה: ' + error.toString(), 'ERROR');
    return {
      status: 'error',
      message: 'שגיאה בשליחת המשימה מחדש: ' + error.toString()
    };
  }
}

// ================================================
// פונקציות API עיקריות
// ================================================

/**
 * קבלת כל המשימות לממשק המזכירה
 */
function getAllTasksForSecretary() {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return {
        status: 'success',
        tasks: [],
        count: 0
      };
    }

    var colMap = getColumnMap(sheet);
    var tasks = [];

    for (var i = 1; i < data.length; i++) {
      try {
        var task = extractTaskData(data[i], colMap, i + 1);
        if (task) {
          tasks.push(task);
        }
      } catch (rowError) {
        console.error('Error processing row ' + (i + 1) + ':', rowError);
      }
    }

    return {
      status: 'success',
      tasks: tasks,
      count: tasks.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getAllTasksForSecretary:', error);
    return {
      status: 'error',
      message: error.toString(),
      tasks: [],
      count: 0
    };
  }
}

/**
 * עדכון משימה מהממשק
 */
function updateTaskFromSecretary(e) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);

    var rowIndex = parseInt(e.parameter.row);
    var field = e.parameter.field;
    var value = e.parameter.value || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return {
        status: 'error',
        message: 'מספר שורה לא תקין: ' + rowIndex
      };
    }

    var allowedFields = {
      'סטטוס': 'סטטוס',
      'דחיפות': 'דחיפות',
      'הערות מזכירה': 'הערות מזכירה',
      'פרטי ביצוע': 'פרטי ביצוע',
      'תאריך השלמה': 'תאריך השלמה',
      'שעת השלמה': 'שעת השלמה'
    };

    var columnName = allowedFields[field];
    if (!columnName || !colMap[columnName]) {
      return {
        status: 'error',
        message: 'שדה לא מורשה לעדכון: ' + field
      };
    }

    sheet.getRange(rowIndex, colMap[columnName]).setValue(value);

    if (field === 'סטטוס' && value === 'בוצע') {
      handleStatusUpdateToCompleted(sheet, rowIndex, colMap);
    }

    var taskId = sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue();
    logSystemEvent('משימה ' + taskId + ' עודכנה מהדשבורד - ' + field + ': ' + value, 'INFO');

    return {
      status: 'success',
      message: 'המשימה עודכנה בהצלחה',
      taskId: taskId,
      field: field,
      value: value
    };

  } catch (error) {
    console.error('Error in updateTaskFromSecretary:', error);
    logSystemEvent('שגיאה בעדכון משימה מהדשבורד: ' + error.toString(), 'ERROR');
    return {
      status: 'error',
      message: 'שגיאה בעדכון המשימה: ' + error.toString()
    };
  }
}

/**
 * טיפול בעדכון סטטוס להושלם מהדשבורד
 */
function handleStatusUpdateToCompleted(sheet, rowIndex, colMap) {
  try {
    var now = new Date();

    var currentCompletionDate = sheet.getRange(rowIndex, colMap['תאריך השלמה']).getValue();
    if (!currentCompletionDate) {
      sheet.getRange(rowIndex, colMap['תאריך השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
      );
    }

    var currentCompletionTime = sheet.getRange(rowIndex, colMap['שעת השלמה']).getValue();
    if (!currentCompletionTime) {
      sheet.getRange(rowIndex, colMap['שעת השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
      );
    }

    if (colMap['הושלם']) {
      sheet.getRange(rowIndex, colMap['הושלם']).setValue(true);
    }

    try {
      sendCompletionEmailFromRow(sheet, rowIndex, colMap);
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
    }

    logSystemEvent('משימה הושלמה מהדשבורד - שורה ' + rowIndex, 'SUCCESS');

  } catch (error) {
    console.error('Error in handleStatusUpdateToCompleted:', error);
    logSystemEvent('שגיאה בטיפול בהשלמה מהדשבורד: ' + error.toString(), 'ERROR');
  }
}

/**
 * עדכון מונה החזרות
 */
function incrementReturnCount(rowIndex) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var colMap = getColumnMap(sheet);

    if (!rowIndex || rowIndex < 2) {
      return {
        status: 'error',
        message: 'מספר שורה לא תקין'
      };
    }

    if (colMap['מועבר פעמים']) {
      var currentCount = sheet.getRange(rowIndex, colMap['מועבר פעמים']).getValue() || 0;
      sheet.getRange(rowIndex, colMap['מועבר פעמים']).setValue(currentCount + 1);
    }

    return {
      status: 'success',
      message: 'מונה החזרות עודכן'
    };

  } catch (error) {
    console.error('Error in incrementReturnCount:', error);
    return {
      status: 'error',
      message: 'שגיאה בעדכון מונה החזרות: ' + error.toString()
    };
  }
}

/**
 * קבלת סטטיסטיקות משימות
 */
function getTaskStatistics() {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var data = sheet.getDataRange().getValues();

    var stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      returned: 0,
      cancelled: 0,
      overdue: 0,
      urgent: 0,
      completedWeek: 0
    };

    if (data.length < 2) {
      return {
        status: 'success',
        stats: stats
      };
    }

    var colMap = getColumnMap(sheet);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (var i = 1; i < data.length; i++) {
      stats.total++;

      var status = data[i][colMap['סטטוס'] - 1];
      var priority = data[i][colMap['דחיפות'] - 1];
      var dueDateValue = data[i][colMap['תאריך לביצוע'] - 1];
      var completionDateValue = data[i][colMap['תאריך השלמה'] - 1];

      updateStatusCount(stats, status);

      if (priority === 'דחופה' || priority === 'דחופה מאוד') {
        stats.urgent++;
      }

      if (dueDateValue && isOverdue(dueDateValue, status, today)) {
        stats.overdue++;
      }

      if (status === 'בוצע' && completionDateValue) {
        var completionDate = parseDate(completionDateValue);
        if (completionDate && completionDate >= weekAgo) {
          stats.completedWeek++;
        }
      }
    }

    return {
      status: 'success',
      stats: stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getTaskStatistics:', error);
    return {
      status: 'error',
      message: error.toString(),
      stats: {}
    };
  }
}

// ================================================
// פונקציות לממשק אישי
// ================================================

/**
 * קבלת משימות של משתמש ספציפי
 */
function getUserTasks(userName) {
  try {
    if (!userName) {
      return { status: 'error', message: 'חסר שם משתמש' };
    }

    var userExists = CONFIG.users.some(function(user) { return user.name === userName; });
    if (!userExists) {
      return { status: 'error', message: 'משתמש לא מוכר במערכת' };
    }

    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return { status: 'success', tasks: [], count: 0, user: userName };
    }

    var colMap = getColumnMap(sheet);
    var userTasks = [];

    for (var i = 1; i < data.length; i++) {
      try {
        var requesterName = data[i][colMap['שם המבקש'] - 1];
        if (requesterName === userName) {
          var task = extractTaskData(data[i], colMap, i + 1);
          if (task) {
            userTasks.push(task);
          }
        }
      } catch (rowError) {
        console.error('Error processing row ' + (i + 1) + ':', rowError);
      }
    }

    logSystemEvent('משתמש ' + userName + ' ביקש את המשימות שלו (' + userTasks.length + ' משימות)', 'INFO');

    return {
      status: 'success',
      tasks: userTasks,
      count: userTasks.length,
      user: userName,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getUserTasks:', error);
    logSystemEvent('שגיאה ב-getUserTasks: ' + error.toString(), 'ERROR');
    return { status: 'error', message: 'שגיאה בטעינת המשימות: ' + error.toString(), tasks: [], count: 0 };
  }
}

/**
 * קבלת פרופיל משתמש
 */
function getUserProfile(userName) {
  try {
    if (!userName) {
      return { status: 'error', message: 'חסר שם משתמש' };
    }

    var user = CONFIG.users.find(function(u) { return u.name === userName; });

    if (!user) {
      return { status: 'error', message: 'משתמש לא נמצא במערכת' };
    }

    return {
      status: 'success',
      user: { name: user.name, email: user.email, role: user.role }
    };

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return { status: 'error', message: 'שגיאה בטעינת פרופיל המשתמש' };
  }
}

/**
 * קבלת סטטיסטיקות של משתמש ספציפי
 */
function getUserStatistics(userName) {
  try {
    if (!userName) {
      return { status: 'error', message: 'חסר שם משתמש' };
    }

    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var data = sheet.getDataRange().getValues();

    var stats = {
      total: 0, pending: 0, inProgress: 0, completed: 0,
      returned: 0, cancelled: 0, overdue: 0, urgent: 0,
      completedThisWeek: 0, completedThisMonth: 0
    };

    if (data.length < 2) {
      return { status: 'success', stats: stats, user: userName };
    }

    var colMap = getColumnMap(sheet);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    var monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (var i = 1; i < data.length; i++) {
      var requesterName = data[i][colMap['שם המבקש'] - 1];
      if (requesterName !== userName) continue;

      stats.total++;

      var status = data[i][colMap['סטטוס'] - 1];
      var priority = data[i][colMap['דחיפות'] - 1];
      var dueDateValue = data[i][colMap['תאריך לביצוע'] - 1];
      var completionDateValue = data[i][colMap['תאריך השלמה'] - 1];

      switch(status) {
        case 'ממתינה': stats.pending++; break;
        case 'בביצוע': stats.inProgress++; break;
        case 'בוצע': stats.completed++; break;
        case 'הוחזר להשלמה': stats.returned++; break;
        case 'בוטל': stats.cancelled++; break;
      }

      if (priority === 'דחופה' || priority === 'דחופה מאוד') {
        stats.urgent++;
      }

      if (dueDateValue && isOverdue(dueDateValue, status, today)) {
        stats.overdue++;
      }

      if (status === 'בוצע' && completionDateValue) {
        var completionDate = parseDate(completionDateValue);
        if (completionDate) {
          if (completionDate >= weekAgo) stats.completedThisWeek++;
          if (completionDate >= monthAgo) stats.completedThisMonth++;
        }
      }
    }

    logSystemEvent('סטטיסטיקות נוצרו עבור ' + userName, 'INFO');

    return {
      status: 'success',
      stats: stats,
      user: userName,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    logSystemEvent('שגיאה ב-getUserStatistics: ' + error.toString(), 'ERROR');
    return { status: 'error', message: 'שגיאה בחישוב סטטיסטיקות: ' + error.toString(), stats: {} };
  }
}

// ================================================
// טיפול במשימות חדשות
// ================================================

/**
 * טיפול במשימה חדשה מטופס
 */
function handleNewTask(e) {
  try {
    console.log("Starting handleNewTask");
    logSystemEvent('התחלת יצירת משימה חדשה', 'INFO');

    var taskId = generateTaskId();
    var now = new Date();

    if (!e.parameter.requesterName) {
      return createResponse({ status: 'error', message: 'חסר שם המבקש' });
    }

    var taskData = prepareTaskData(e, taskId, now);

    if (!checkSystemCapacity()) {
      return createResponse({ status: 'error', message: 'המערכת עמוסה כרגע, נסה שוב בעוד מספר דקות' });
    }

    var fileUrl = '';
    var attachments = [];

    if (e.parameter.numFiles && parseInt(e.parameter.numFiles) > 0) {
      var fileResult = processAttachments(e, taskId);
      fileUrl = fileResult.fileUrl;
      attachments = fileResult.attachments;
      taskData['קבצים מצורפים'] = fileUrl;
    }

    var result = addTaskToSheet(taskData);

    if (!result.success) {
      return createResponse({ status: 'error', message: 'שגיאה בהוספת המשימה: ' + result.error });
    }

    try {
      sendNewTaskEmailToSecretary(taskData, attachments);
      sendTaskConfirmationEmail(taskData);
    } catch (emailError) {
      console.error("Email error (non-critical):", emailError);
      logSystemEvent('שגיאה בשליחת מייל: ' + emailError.toString(), 'WARNING');
    }

    updateUserStatistics(taskData['שם המבקש'], 'created');

    logSystemEvent('משימה נוצרה בהצלחה: ' + taskId, 'SUCCESS');

    return createResponse({ status: 'success', taskId: taskId, message: 'המשימה נוצרה בהצלחה' });

  } catch (error) {
    console.error("Error in handleNewTask:", error);
    logSystemEvent('שגיאה ביצירת משימה: ' + error.toString(), 'ERROR');
    return createResponse({ status: 'error', message: 'שגיאה ביצירת המשימה: ' + error.toString() });
  }
}

// ================================================
// פונקציות עזר
// ================================================

/**
 * חילוץ נתוני משימה משורה
 */
function extractTaskData(rowData, colMap, rowNumber) {
  return {
    row: rowNumber,
    id: rowData[colMap['מזהה משימה'] - 1] || '',
    date: formatDate(rowData[colMap['תאריך שליחה'] - 1]),
    time: rowData[colMap['שעת שליחה'] - 1] || '',
    requester: rowData[colMap['שם המבקש'] - 1] || '',
    requesterName: rowData[colMap['שם המבקש'] - 1] || '',
    requesterEmail: rowData[colMap['אימייל המבקש'] - 1] || '',
    description: rowData[colMap['תיאור המשימה'] - 1] || '',
    category: rowData[colMap['סיווג משימה'] - 1] || '',
    dueDate: formatDate(rowData[colMap['תאריך לביצוע'] - 1]),
    priority: rowData[colMap['דחיפות'] - 1] || 'רגילה',
    status: rowData[colMap['סטטוס'] - 1] || 'ממתינה',
    completed: rowData[colMap['הושלם'] - 1] || false,
    completionDate: formatDate(rowData[colMap['תאריך השלמה'] - 1]),
    completionTime: rowData[colMap['שעת השלמה'] - 1] || '',
    attachments: rowData[colMap['קבצים מצורפים'] - 1] || '',
    secretaryNotes: rowData[colMap['הערות מזכירה'] - 1] || '',
    notes: rowData[colMap['הערות מזכירה'] - 1] || '',
    completionDetails: rowData[colMap['פרטי ביצוע'] - 1] || ''
  };
}

/**
 * יצירת מזהה משימה ייחודי
 */
function generateTaskId() {
  var timestamp = new Date().getTime();
  var random = Math.floor(Math.random() * 1000);
  return 'TASK-' + timestamp + '-' + random;
}

/**
 * הכנת נתוני משימה חדשה
 */
function prepareTaskData(e, taskId, now) {
  return {
    'מזהה משימה': taskId,
    'תאריך שליחה': Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd"),
    'שעת שליחה': Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss"),
    'שם המבקש': e.parameter.requesterName || '',
    'אימייל המבקש': e.parameter.requesterEmail || '',
    'תיאור המשימה': e.parameter.taskDescription || '',
    'סיווג משימה': e.parameter.taskCategory || 'אחר',
    'תאריך לביצוע': e.parameter.dueDate || '',
    'דחיפות': e.parameter.priority || 'רגילה',
    'סטטוס': 'ממתינה',
    'הושלם': false,
    'תאריך השלמה': '',
    'שעת השלמה': '',
    'קבצים מצורפים': '',
    'הערות מזכירה': '',
    'פרטי ביצוע': '',
    'מועבר פעמים': 0,
    'היסטוריית העברות': '',
    'תאריך יצירה': now
  };
}

/**
 * בדיקת יכולת המערכת
 */
function checkSystemCapacity() {
  try {
    var today = new Date();
    var todayStr = Utilities.formatDate(today, CONFIG.system.timezone, "yyyy-MM-dd");

    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) return true;

    var colMap = getColumnMap(sheet);
    var todayTasksCount = 0;

    for (var i = 1; i < data.length; i++) {
      var taskDate = data[i][colMap['תאריך שליחה'] - 1];
      if (taskDate && formatDate(taskDate) === todayStr) {
        todayTasksCount++;
      }
    }

    return todayTasksCount < CONFIG.system.maxDailyTasks;

  } catch (error) {
    console.error('Error checking system capacity:', error);
    return true;
  }
}

/**
 * הוספת משימה לגיליון
 */
function addTaskToSheet(taskData) {
  try {
    var sheet = getOrCreateSheet(CONFIG.sheets.tasks);

    if (sheet.getRange('A1').getValue() === '') {
      setupTasksSheet(sheet);
    }

    var colMap = getColumnMap(sheet);
    var newRow = sheet.getLastRow() + 1;

    Object.keys(taskData).forEach(function(key) {
      if (colMap[key] && taskData[key] !== undefined) {
        sheet.getRange(newRow, colMap[key]).setValue(taskData[key]);
      }
    });

    if (colMap['הושלם']) {
      sheet.getRange(newRow, colMap['הושלם']).insertCheckboxes();
    }

    applyRowFormatting(sheet, newRow, taskData['דחיפות']);

    SpreadsheetApp.flush();

    return { success: true, rowIndex: newRow };

  } catch (error) {
    console.error("Error in addTaskToSheet:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * עיבוד קבצים מצורפים
 */
function processAttachments(e, taskId) {
  var attachments = [];
  var fileUrl = '';

  try {
    var numFiles = parseInt(e.parameter.numFiles);
    if (!numFiles || numFiles === 0) {
      return { fileUrl: '', attachments: [] };
    }

    var attachmentsFolder = getOrCreateAttachmentsFolder();
    if (!attachmentsFolder) {
      console.error("Failed to create attachments folder");
      return { fileUrl: '', attachments: [] };
    }

    var taskFolder = attachmentsFolder.createFolder(taskId + '_' + new Date().getTime());
    var folderUrl = taskFolder.getUrl();

    for (var i = 0; i < numFiles; i++) {
      try {
        var fileName = e.parameter['fileName' + i];
        var fileType = e.parameter['fileType' + i];
        var fileContent = e.parameter['fileContent' + i];

        if (!fileName || !fileContent) continue;

        var decoded = Utilities.base64Decode(fileContent);
        var blob = Utilities.newBlob(decoded, fileType || 'application/octet-stream', fileName);

        var file = taskFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        if (i === 0) fileUrl = file.getUrl();
        attachments.push(file.getBlob());

      } catch (fileError) {
        console.error('Error processing file ' + i + ':', fileError);
      }
    }

    if (attachments.length > 1) {
      fileUrl = folderUrl;
    }

    return { fileUrl: fileUrl, attachments: attachments };

  } catch (error) {
    console.error("Error in processAttachments:", error);
    return { fileUrl: '', attachments: [] };
  }
}

/**
 * טיפול בעדכון סטטוס
 */
function handleStatusUpdate(sheet, rowIndex, colMap, newStatus) {
  var now = new Date();

  switch(newStatus) {
    case 'בוצע':
      sheet.getRange(rowIndex, colMap['תאריך השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
      );
      sheet.getRange(rowIndex, colMap['שעת השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
      );
      if (colMap['הושלם']) {
        sheet.getRange(rowIndex, colMap['הושלם']).setValue(true);
      }
      sendCompletionEmailFromRow(sheet, rowIndex, colMap);
      break;

    case 'בביצוע':
      break;

    case 'הוחזר להשלמה':
      break;
  }
}

/**
 * עדכון ספירת סטטוסים
 */
function updateStatusCount(stats, status) {
  switch(status) {
    case 'ממתינה': stats.pending++; break;
    case 'בביצוע': stats.inProgress++; break;
    case 'בוצע': stats.completed++; break;
    case 'הוחזר להשלמה': stats.returned++; break;
    case 'בוטל': stats.cancelled++; break;
  }
}

/**
 * בדיקה האם משימה באיחור
 */
function isOverdue(dueDateValue, status, today) {
  if (status === 'בוצע' || status === 'בוטל' || status === 'פג תוקף - לא רלוונטי') {
    return false;
  }
  var dueDate = parseDate(dueDateValue);
  return dueDate && dueDate < today;
}

/**
 * פורמט תאריך בטוח
 */
function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    if (dateValue instanceof Date) {
      return Utilities.formatDate(dateValue, CONFIG.system.timezone, "yyyy-MM-dd");
    }
    return dateValue.toString();
  } catch (error) {
    return dateValue ? dateValue.toString() : '';
  }
}

/**
 * המרת תאריך לאובייקט Date
 */
function parseDate(dateValue) {
  if (!dateValue) return null;
  try {
    return new Date(dateValue);
  } catch (error) {
    return null;
  }
}

/**
 * פורמט תאריך בעברית
 */
function formatDateHebrew(dateInput) {
  if (!dateInput) return '';
  try {
    var date = parseDate(dateInput);
    if (!date) return dateInput.toString();

    var months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();

    return day + ' ב' + month + ' ' + year;
  } catch (error) {
    return dateInput.toString();
  }
}

/**
 * יצירת או קבלת גיליון
 */
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * יצירת או קבלת תיקיית קבצים מצורפים
 */
function getOrCreateAttachmentsFolder() {
  try {
    var folders = DriveApp.getFoldersByName(CONFIG.folders.attachments);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(CONFIG.folders.attachments);
    }
  } catch (error) {
    console.error('Error creating attachments folder:', error);
    return null;
  }
}

/**
 * קבלת מפת עמודות
 */
function getColumnMap(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  headers.forEach(function(header, index) {
    if (header) {
      colMap[header] = index + 1;
    }
  });
  return colMap;
}

/**
 * החלת עיצוב לשורה
 */
function applyRowFormatting(sheet, row, priority) {
  var rowRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
  switch (priority) {
    case 'דחופה':
      rowRange.setBackground('#fff3cd');
      break;
    case 'דחופה מאוד':
      rowRange.setBackground('#f8d7da');
      break;
    default:
      rowRange.setBackground('#ffffff');
  }
}

// ================================================
// מיילים אוטומטיים (ללא אימוג'ים - תואם Gmail)
// ================================================

/**
 * שליחת מייל למזכירה על משימה חדשה
 */
function sendNewTaskEmailToSecretary(taskData, attachments) {
  try {
    var urgencyLabel = taskData['דחיפות'] === 'דחופה מאוד' ? '[דחוף!]' :
                       taskData['דחיפות'] === 'דחופה' ? '[דחוף]' : '';

    var subject = (urgencyLabel ? urgencyLabel + ' ' : '') + 'משימה חדשה: ' + taskData['שם המבקש'] + ' - ' + taskData['דחיפות'];

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">משימה חדשה התקבלה</h2>'
      + '</div>'
      + '<div style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">'
      + '<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid ' + getPriorityColor(taskData['דחיפות']) + ';">'
      + '<h3 style="color: #333; margin-top: 0;">פרטי המשימה</h3>'
      + '<table style="width: 100%; border-collapse: collapse;">'
      + '<tr><td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>מזהה:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">' + taskData['מזהה משימה'] + '</td></tr>'
      + '<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>מבקש:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">' + taskData['שם המבקש'] + '</td></tr>'
      + '<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>אימייל:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:' + taskData['אימייל המבקש'] + '">' + taskData['אימייל המבקש'] + '</a></td></tr>'
      + '<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>סיווג:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">' + taskData['סיווג משימה'] + '</td></tr>'
      + '<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>דחיפות:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><span style="color: ' + getPriorityColor(taskData['דחיפות']) + '; font-weight: bold;">' + taskData['דחיפות'] + '</span></td></tr>'
      + '<tr><td style="padding: 8px;"><strong>תאריך יעד:</strong></td><td style="padding: 8px;">' + formatDateHebrew(taskData['תאריך לביצוע']) + '</td></tr>'
      + '</table></div>'
      + '<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;"><h4 style="color: #333; margin-top: 0;">תיאור המשימה:</h4><p style="background: #f8f9fa; padding: 15px; border-radius: 5px; line-height: 1.6; white-space: pre-wrap;">' + taskData['תיאור המשימה'] + '</p></div>'
      + (taskData['קבצים מצורפים'] ? '<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;"><h4 style="color: #333; margin-top: 0;">קבצים מצורפים</h4><p><a href="' + taskData['קבצים מצורפים'] + '" style="color: #007bff; text-decoration: none;">לחץ כאן לצפייה בקבצים</a></p></div>' : '')
      + '<div style="text-align: center; margin-top: 20px;"><p style="font-size: 12px; color: #666;">נשלח אוטומטית ממערכת ניהול המשימות<br>' + new Date().toLocaleString('he-IL') + '</p></div>'
      + '</div></div>';

    var emailOptions = {
      htmlBody: htmlBody,
      name: "מערכת ניהול משימות",
      charset: "UTF-8"
    };

    if (attachments && attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    GmailApp.sendEmail(CONFIG.email.secretary, subject, '', emailOptions);
    logSystemEvent('נשלח מייל למזכירה על משימה ' + taskData['מזהה משימה'], 'INFO');

  } catch (error) {
    console.error('שגיאה בשליחת מייל למזכירה:', error);
    logSystemEvent('שגיאה בשליחת מייל למזכירה: ' + error.toString(), 'ERROR');
  }
}

/**
 * שליחת מייל אישור למבקש
 */
function sendTaskConfirmationEmail(taskData) {
  try {
    if (!taskData['אימייל המבקש']) return;

    var subject = 'אישור קבלת משימה - ' + taskData['מזהה משימה'];

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">המשימה התקבלה בהצלחה</h2></div>'
      + '<div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">'
      + '<p style="font-size: 16px;">שלום <strong>' + taskData['שם המבקש'] + '</strong>,</p>'
      + '<p style="font-size: 16px;">משימתך התקבלה במערכת ותטופל בהקדם.</p>'
      + '<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #667eea;">'
      + '<p><strong>מזהה משימה:</strong> ' + taskData['מזהה משימה'] + '</p>'
      + '<p><strong>תאריך יעד:</strong> ' + formatDateHebrew(taskData['תאריך לביצוע']) + '</p>'
      + '<p><strong>דחיפות:</strong> ' + taskData['דחיפות'] + '</p></div>'
      + '<p style="font-size: 14px; color: #666;">נעדכן אותך בהתקדמות הטיפול במשימה.<br>לבירורים ניתן לפנות למזכירה במייל: ' + CONFIG.email.secretary + '</p>'
      + '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">'
      + '<p style="font-size: 12px; color: #999;">מערכת ניהול משימות<br>' + new Date().toLocaleString('he-IL') + '</p></div>'
      + '</div></div>';

    GmailApp.sendEmail(taskData['אימייל המבקש'], subject, '', {
      htmlBody: htmlBody,
      name: "מערכת ניהול משימות",
      charset: "UTF-8"
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * שליחת מייל השלמה מתוך שורה
 */
function sendCompletionEmailFromRow(sheet, rowIndex, colMap) {
  try {
    var email = sheet.getRange(rowIndex, colMap['אימייל המבקש']).getValue();
    if (!email) return;

    var taskData = {
      email: email,
      name: sheet.getRange(rowIndex, colMap['שם המבקש']).getValue(),
      taskId: sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue(),
      description: sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue(),
      completionDetails: sheet.getRange(rowIndex, colMap['פרטי ביצוע']).getValue()
    };

    sendTaskCompletionEmail(
      taskData.email,
      taskData.name,
      taskData.taskId,
      taskData.description,
      taskData.completionDetails
    );

  } catch (error) {
    console.error('Error sending completion email from row:', error);
  }
}

/**
 * שליחת מייל השלמת משימה
 */
function sendTaskCompletionEmail(email, name, taskId, description, completionDetails) {
  try {
    var subject = 'המשימה שלך הושלמה - ' + taskId;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">המשימה הושלמה בהצלחה!</h2></div>'
      + '<div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">'
      + '<p style="font-size: 16px;">שלום <strong>' + name + '</strong>,</p>'
      + '<p style="font-size: 16px;">שמחים לעדכן שהמשימה שלך הושלמה.</p>'
      + '<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">'
      + '<p><strong>מזהה משימה:</strong> ' + taskId + '</p>'
      + '<p><strong>תיאור:</strong> ' + description + '</p>'
      + '<p><strong>תאריך השלמה:</strong> ' + new Date().toLocaleDateString('he-IL') + '</p></div>'
      + (completionDetails ? '<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-right: 4px solid #28a745;"><p style="margin: 0;"><strong>פרטי הביצוע:</strong></p><p style="margin: 5px 0 0 0; white-space: pre-wrap;">' + completionDetails + '</p></div>' : '')
      + '<p style="font-size: 14px; color: #666; margin-top: 30px;">במקרה של שאלות נוספות, ניתן לפנות למזכירה במייל: ' + CONFIG.email.secretary + '</p>'
      + '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">'
      + '<p style="font-size: 12px; color: #999;">מערכת ניהול משימות<br>' + new Date().toLocaleString('he-IL') + '</p></div>'
      + '</div></div>';

    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: "מערכת ניהול משימות",
      charset: "UTF-8"
    });

    logSystemEvent('נשלח מייל השלמה למבקש ' + name + ' על משימה ' + taskId, 'INFO');

  } catch (error) {
    console.error('Error sending completion email:', error);
  }
}

/**
 * שליחת מייל החזרת משימה למבקש
 */
function sendTaskReturnEmail(email, name, taskId, description, reason, row) {
  try {
    var subject = 'המשימה שלך הוחזרה להשלמה - ' + taskId;

    var resubmitUrl = 'https://taskmangenet.netlify.app/task-response.html?taskId='
      + encodeURIComponent(taskId) + '&row=' + row;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">המשימה הוחזרה להשלמה</h2>'
      + '</div>'
      + '<div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">'
      + '<p style="font-size: 16px;">שלום <strong>' + name + '</strong>,</p>'
      + '<p style="font-size: 16px;">המשימה שלך הוחזרה ודורשת השלמה.</p>'
      + '<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;">'
      + '<p><strong>מזהה משימה:</strong> ' + taskId + '</p>'
      + '<p><strong>תיאור:</strong> ' + description + '</p>'
      + '</div>'
      + '<div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-right: 4px solid #f59e0b;">'
      + '<p style="margin: 0;"><strong>סיבת ההחזרה:</strong></p>'
      + '<p style="margin: 5px 0 0 0; white-space: pre-wrap;">' + reason + '</p>'
      + '</div>'
      + '<div style="text-align: center; margin: 30px 0 20px;">'
      + '<a href="' + resubmitUrl + '" style="display: inline-block; background: linear-gradient(135deg, #0049db, #2979ff); color: white; text-decoration: none; padding: 14px 40px; border-radius: 25px; font-size: 16px; font-weight: 600;">השלם ושלח מחדש</a>'
      + '</div>'
      + '<p style="font-size: 13px; color: #888; text-align: center;">לחץ על הכפתור למעלה כדי להשלים ולשלוח את המשימה מחדש</p>'
      + '<p style="font-size: 13px; color: #888; text-align: center;">או פנה למזכירה לבירורים במייל: ' + CONFIG.email.secretary + '</p>'
      + '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">'
      + '<p style="font-size: 12px; color: #999;">מערכת ניהול משימות<br>' + new Date().toLocaleString('he-IL') + '</p>'
      + '</div>'
      + '</div>'
      + '</div>';

    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: "מערכת ניהול משימות",
      charset: "UTF-8"
    });

    logSystemEvent('נשלח מייל החזרה למבקש ' + name + ' על משימה ' + taskId, 'INFO');

  } catch (error) {
    console.error('Error sending return email:', error);
    logSystemEvent('שגיאה בשליחת מייל החזרה: ' + error.toString(), 'ERROR');
  }
}

/**
 * שליחת הודעה למזכירה על שליחה מחדש של משימה
 */
function sendResubmitNotificationToSecretary(taskId, requesterName, description, responseText) {
  try {
    var subject = 'משימה נשלחה מחדש: ' + taskId + ' - ' + requesterName;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">משימה נשלחה מחדש</h2>'
      + '</div>'
      + '<div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">'
      + '<p style="font-size: 16px;"><strong>' + requesterName + '</strong> השלים/ה את המשימה ושלח/ה אותה מחדש.</p>'
      + '<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #667eea;">'
      + '<p><strong>מזהה משימה:</strong> ' + taskId + '</p>'
      + '<p><strong>תיאור:</strong> ' + description + '</p>'
      + '</div>'
      + '<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-right: 4px solid #28a745;">'
      + '<p style="margin: 0;"><strong>תשובת המבקש:</strong></p>'
      + '<p style="margin: 5px 0 0 0; white-space: pre-wrap;">' + responseText + '</p>'
      + '</div>'
      + '<div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">'
      + '<p style="font-size: 12px; color: #999;">מערכת ניהול משימות<br>' + new Date().toLocaleString('he-IL') + '</p>'
      + '</div>'
      + '</div>'
      + '</div>';

    GmailApp.sendEmail(CONFIG.email.secretary, subject, '', {
      htmlBody: htmlBody,
      name: "מערכת ניהול משימות",
      charset: "UTF-8"
    });

    logSystemEvent('נשלחה הודעה למזכירה על שליחה מחדש של משימה ' + taskId, 'INFO');

  } catch (error) {
    console.error('Error sending resubmit notification:', error);
    logSystemEvent('שגיאה בשליחת הודעת שליחה מחדש: ' + error.toString(), 'ERROR');
  }
}

/**
 * קבלת צבע לפי דחיפות
 */
function getPriorityColor(priority) {
  switch(priority) {
    case 'דחופה מאוד': return '#dc3545';
    case 'דחופה': return '#ff6600';
    default: return '#28a745';
  }
}

// ================================================
// הגדרת גיליונות
// ================================================

/**
 * הגדרת גיליון משימות
 */
function setupTasksSheet(sheet) {
  var headers = [
    'מזהה משימה',
    'תאריך שליחה',
    'שעת שליחה',
    'שם המבקש',
    'אימייל המבקש',
    'תיאור המשימה',
    'סיווג משימה',
    'תאריך לביצוע',
    'דחיפות',
    'סטטוס',
    'הושלם',
    'תאריך השלמה',
    'שעת השלמה',
    'קבצים מצורפים',
    'הערות מזכירה',
    'פרטי ביצוע',
    'מועבר פעמים',
    'היסטוריית העברות',
    'תאריך יצירה'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * הגדרת גיליון לוג מערכת
 */
function setupSystemLogSheet(sheet) {
  var headers = ['תאריך ושעה', 'רמת חומרה', 'הודעה', 'משתמש'];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#999999');
  headerRange.setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ================================================
// רישום אירועים ולוגים
// ================================================

/**
 * רישום אירועי מערכת
 */
function logSystemEvent(message, level) {
  level = level || 'INFO';
  try {
    var logSheet = getOrCreateSheet(CONFIG.sheets.systemLog);

    if (logSheet.getRange('A1').getValue() === '') {
      setupSystemLogSheet(logSheet);
    }

    var lastRow = logSheet.getLastRow() + 1;
    var logData = [
      new Date(),
      level,
      message,
      Session.getActiveUser().getEmail() || 'SYSTEM'
    ];

    logSheet.getRange(lastRow, 1, 1, logData.length).setValues([logData]);

    var rowRange = logSheet.getRange(lastRow, 1, 1, logSheet.getLastColumn());
    switch (level) {
      case 'ERROR': rowRange.setBackground('#ffebee'); break;
      case 'WARNING': rowRange.setBackground('#fff3e0'); break;
      case 'SUCCESS': rowRange.setBackground('#e8f5e9'); break;
      default: rowRange.setBackground('#ffffff');
    }

    if (lastRow > 1001) {
      logSheet.deleteRow(2);
    }

  } catch (error) {
    console.error('Error logging system event:', error);
  }
}

/**
 * עדכון סטטיסטיקות משתמש
 */
function updateUserStatistics(userName, action) {
  console.log('User statistics updated: ' + userName + ' - ' + action);
}

// ================================================
// הגדרת מערכת ותפריטים
// ================================================

/**
 * פתיחת התפריט
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('ניהול משימות 8.2');

  menu.addItem('הגדרת מערכת', 'setupSystem');
  menu.addItem('הצג סטטיסטיקות', 'showStatistics');
  menu.addItem('שלח דוח יומי', 'sendDailyReport');
  menu.addSeparator();
  menu.addItem('רענן תצוגה', 'refreshView');
  menu.addItem('אודות', 'showAbout');

  menu.addToUi();
}

/**
 * הגדרת המערכת
 */
function setupSystem() {
  var ui = SpreadsheetApp.getUi();

  try {
    var sheets = [
      CONFIG.sheets.tasks,
      CONFIG.sheets.systemLog,
      CONFIG.sheets.dailyReports,
      CONFIG.sheets.userStats,
      CONFIG.sheets.backups
    ];

    sheets.forEach(function(sheetName) {
      var sheet = getOrCreateSheet(sheetName);
      if (sheetName === CONFIG.sheets.tasks && sheet.getRange('A1').getValue() === '') {
        setupTasksSheet(sheet);
      }
      if (sheetName === CONFIG.sheets.systemLog && sheet.getRange('A1').getValue() === '') {
        setupSystemLogSheet(sheet);
      }
    });

    setupTriggers();

    ui.alert('הגדרת המערכת הושלמה!',
      'המערכת מוכנה לעבודה.\n\n'
      + 'גיליונות נוצרו\n'
      + 'טריגרים הוגדרו\n'
      + 'המערכת מוכנה לקבל משימות\n'
      + 'ממשק אישי פעיל',
      ui.ButtonSet.OK
    );

    logSystemEvent('המערכת הוגדרה בהצלחה', 'SUCCESS');

  } catch (error) {
    ui.alert('שגיאה', 'אירעה שגיאה בהגדרת המערכת: ' + error.toString(), ui.ButtonSet.OK);
    logSystemEvent('שגיאה בהגדרת המערכת: ' + error.toString(), 'ERROR');
  }
}

/**
 * הגדרת טריגרים
 */
function setupTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
}

/**
 * טריגר עריכה
 */
function onEdit(e) {
  if (!e) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.sheets.tasks) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();

  if (row === 1) return;

  var colMap = getColumnMap(sheet);

  if (col === colMap['סטטוס']) {
    handleStatusUpdate(sheet, row, colMap, e.value);
  }

  if (col === colMap['הושלם'] && e.value === 'TRUE') {
    handleTaskCompletion(sheet, row, colMap);
  }
}

/**
 * טיפול בהשלמת משימה
 */
function handleTaskCompletion(sheet, row, colMap) {
  var ui = SpreadsheetApp.getUi();

  var response = ui.prompt(
    'סימון משימה כבוצעה',
    'נא להזין פרטי ביצוע:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK || !response.getResponseText().trim()) {
    sheet.getRange(row, colMap['הושלם']).setValue(false);
    ui.alert('חובה להזין פרטי ביצוע');
    return;
  }

  var completionDetails = response.getResponseText().trim();
  var now = new Date();

  sheet.getRange(row, colMap['סטטוס']).setValue('בוצע');
  sheet.getRange(row, colMap['תאריך השלמה']).setValue(
    Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
  );
  sheet.getRange(row, colMap['שעת השלמה']).setValue(
    Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
  );
  sheet.getRange(row, colMap['פרטי ביצוע']).setValue(completionDetails);

  sendCompletionEmailFromRow(sheet, row, colMap);
}

/**
 * שליחת דוח יומי
 */
function sendDailyReport() {
  logSystemEvent('דוח יומי נשלח', 'INFO');
}

/**
 * הצגת סטטיסטיקות
 */
function showStatistics() {
  var stats = getTaskStatistics();
  var ui = SpreadsheetApp.getUi();

  var message = 'סטטיסטיקות משימות:\n'
    + '-------------------\n'
    + 'סה"כ משימות: ' + stats.stats.total + '\n'
    + 'ממתינות: ' + stats.stats.pending + '\n'
    + 'בביצוע: ' + stats.stats.inProgress + '\n'
    + 'הושלמו: ' + stats.stats.completed + '\n'
    + 'באיחור: ' + stats.stats.overdue + '\n'
    + 'דחופות: ' + stats.stats.urgent + '\n'
    + 'הושלמו השבוע: ' + stats.stats.completedWeek;

  ui.alert('סטטיסטיקות מערכת', message, ui.ButtonSet.OK);
}

/**
 * רענון תצוגה
 */
function refreshView() {
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().activate();
  SpreadsheetApp.getUi().alert('התצוגה רועננה', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * אודות
 */
function showAbout() {
  var ui = SpreadsheetApp.getUi();

  var about = CONFIG.system.name + '\n'
    + 'גרסה: ' + CONFIG.system.version + '\n\n'
    + 'מערכת מתקדמת לניהול משימות משרדי\n'
    + '----------------------------\n\n'
    + 'תכונות עיקריות:\n'
    + '- ניהול משימות חכם\n'
    + '- מיילים אוטומטיים\n'
    + '- דוחות וסטטיסטיקות\n'
    + '- ממשק API מתקדם\n'
    + '- מערכת גיבוי והגנה\n'
    + '- דשבורד מזכירה\n'
    + '- דף השלמת משימה שהוחזרה\n\n'
    + 'פותח עבור: משרד עו"ד GH';

  ui.alert('אודות המערכת', about, ui.ButtonSet.OK);
}
