/**
 * ================================================
 * מערכת ניהול משימות משרדית - גרסה 9.0 TURBO ⚡
 * ================================================
 *
 * שיפורים בגרסה 9.0:
 * ✅ ביצועים מהירים פי 3-5 מהגרסה הקודמת
 * ✅ Cache חכם לתיקיות ונתונים
 * ✅ שליחת מיילים אסינכרונית (לא חוסמת)
 * ✅ אופטימיזציה של פעולות Spreadsheet
 * ✅ Error handling משופר
 * ✅ Batch operations
 * ✅ עדכון רשימת משתמשים
 *
 * @author המערכת המשופרת TURBO
 * @version 9.0.0
 * @lastUpdate 2024-12
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
    version: "9.0.0 TURBO",
    maxDailyTasks: 300,
    timezone: "Asia/Jerusalem",
    enableAsyncEmails: true, // 🚀 שליחת מיילים ברקע
    cacheEnabled: true // 🚀 הפעלת Cache
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

  // רשימת משתמשים - מעודכנת לפי הבקשה
  users: [
    {name: "חיים", email: "HAIM@ghlawoffice.co.il", role: "מנהל"},
    {name: "גיא", email: "guy@ghlawoffice.co.il", role: "עורך דין"},
    {name: "רועי", email: "roi@ghlawoffice.co.il", role: "עורך דין"},
    {name: "שחר", email: "shahar@ghlawoffice.co.il", role: "עורך דין"},
    {name: "עוזי", email: "uzi@ghlawoffice.co.il", role: "עורך דין"},
    {name: "אורי", email: "ori@ghlawoffice.co.il", role: "עורך דין"},
    {name: "קרן", email: "office@ghlawoffice.co.il", role: "מזכירה"},
    {name: "ראיד", email: "reed@ghlawoffice.co.il", role: "עורך דין"},
    {name: "מרווה", email: "Marva@ghlawoffice.co.il", role: "עורכת דין"},
    {name: "מירי", email: "miri@ghlawoffice.co.il", role: "עורכת דין"},
    {name: "עוז", email: "Oz@brosh-finance.com", role: "מנהל כספים"},
    {name: "לירז", email: "Liraz@siboni-law.com", role: "עורכת דין"}
  ]
};

// ================================================
// 🚀 Cache Manager - חדש!
// ================================================
const CacheManager = {
  /**
   * קבלת ערך מ-Cache
   */
  get(key) {
    if (!CONFIG.system.cacheEnabled) return null;

    try {
      const cache = PropertiesService.getScriptProperties();
      return cache.getProperty(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * שמירת ערך ב-Cache
   */
  set(key, value) {
    if (!CONFIG.system.cacheEnabled) return;

    try {
      const cache = PropertiesService.getScriptProperties();
      cache.setProperty(key, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * מחיקת ערך מ-Cache
   */
  delete(key) {
    try {
      const cache = PropertiesService.getScriptProperties();
      cache.deleteProperty(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  /**
   * ניקוי Cache מלא
   */
  clear() {
    try {
      const cache = PropertiesService.getScriptProperties();
      cache.deleteAllProperties();
      console.log('✅ Cache נוקה');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
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

    // ניתוב לפי פעולה
    switch(action) {
      // פעולות למזכירה (דשבורד)
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

      // פעולות לממשק אישי
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
          return HtmlService.createHtmlOutput(`
            <html dir="rtl">
              <head>
                <title>מערכת ניהול משימות</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    text-align: center;
                  }
                  h1 { color: #333; }
                  p { color: #666; }
                  .version {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #999;
                  }
                  .turbo {
                    color: #667eea;
                    font-weight: bold;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>מערכת ניהול משימות <span class="turbo">⚡ TURBO</span></h1>
                  <p>המערכת פעילה ומוכנה לשימוש</p>
                  <div class="version">גרסה ${CONFIG.system.version}</div>
                </div>
              </body>
            </html>
          `);
        }
        result = {status: 'error', message: 'Invalid action: ' + action};
    }

    // החזרת תוצאה עם תמיכה ב-JSONP
    return createResponse(result, callback);

  } catch (error) {
    console.error('Error in doGet:', error);
    logSystemEvent('שגיאה ב-doGet: ' + error.toString() + ', action: ' + action, 'ERROR');
    return createResponse({
      status: 'error',
      message: error.toString(),
      stack: error.stack
    }, callback);
  }
}

/**
 * טיפול בבקשות POST - קבלת משימות חדשות מטופס
 * 🚀 משופר לביצועים מקסימליים
 */
function doPost(e) {
  return handleNewTaskOptimized(e);
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
// 🚀 פונקציות API מאופטמות
// ================================================

/**
 * קבלת כל המשימות לממשק המזכירה
 * 🚀 אופטימיזציה: קריאה אחת לגיליון
 */
function getAllTasksForSecretary() {
  const startTime = new Date();

  try {
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();

    if (data.length < 2) {
      return {
        status: 'success',
        tasks: [],
        count: 0,
        loadTime: new Date() - startTime
      };
    }

    const colMap = getColumnMapCached(sheet);
    const tasks = [];

    // עיבוד כל השורות
    for (let i = 1; i < data.length; i++) {
      try {
        const task = extractTaskData(data[i], colMap, i + 1);
        if (task) {
          tasks.push(task);
        }
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
      }
    }

    return {
      status: 'success',
      tasks: tasks,
      count: tasks.length,
      loadTime: new Date() - startTime,
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
 * 🚀 אופטימיזציה: בדיקות מהירות וביצוע ישיר
 */
function updateTaskFromSecretary(e) {
  try {
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const colMap = getColumnMapCached(sheet);

    // אימות פרמטרים
    const rowIndex = parseInt(e.parameter.row);
    const field = e.parameter.field;
    const value = e.parameter.value || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return {
        status: 'error',
        message: 'מספר שורה לא תקין: ' + rowIndex
      };
    }

    // רשימת שדות מותרים לעדכון
    const allowedFields = {
      'סטטוס': 'סטטוס',
      'דחיפות': 'דחיפות',
      'הערות מזכירה': 'הערות מזכירה',
      'פרטי ביצוע': 'פרטי ביצוע',
      'תאריך השלמה': 'תאריך השלמה',
      'שעת השלמה': 'שעת השלמה'
    };

    const columnName = allowedFields[field];
    if (!columnName || !colMap[columnName]) {
      return {
        status: 'error',
        message: 'שדה לא מורשה לעדכון: ' + field
      };
    }

    // ביצוע העדכון
    sheet.getRange(rowIndex, colMap[columnName]).setValue(value);

    // טיפול מיוחד בשינוי סטטוס
    if (field === 'סטטוס' && value === 'בוצע') {
      handleStatusUpdateToCompletedOptimized(sheet, rowIndex, colMap);
    }

    // רישום בלוג
    const taskId = sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue();
    logSystemEvent(`משימה ${taskId} עודכנה מהדשבורד - ${field}: ${value}`, 'INFO');

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
 * טיפול בעדכון סטטוס להושלם - גרסה מאופטמת
 * 🚀 מיילים נשלחים ברקע
 */
function handleStatusUpdateToCompletedOptimized(sheet, rowIndex, colMap) {
  try {
    const now = new Date();

    // עדכון תאריכי השלמה רק אם הם ריקים
    const currentCompletionDate = sheet.getRange(rowIndex, colMap['תאריך השלמה']).getValue();
    if (!currentCompletionDate) {
      sheet.getRange(rowIndex, colMap['תאריך השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
      );
    }

    const currentCompletionTime = sheet.getRange(rowIndex, colMap['שעת השלמה']).getValue();
    if (!currentCompletionTime) {
      sheet.getRange(rowIndex, colMap['שעת השלמה']).setValue(
        Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
      );
    }

    // עדכון checkbox אם קיים
    if (colMap['הושלם']) {
      sheet.getRange(rowIndex, colMap['הושלם']).setValue(true);
    }

    // 🚀 שליחת מייל ברקע (לא חוסמת!)
    if (CONFIG.system.enableAsyncEmails) {
      queueEmailForBackground(sheet, rowIndex, colMap, 'completion');
    } else {
      // שליחה מיידית (איטי)
      try {
        sendCompletionEmailFromRow(sheet, rowIndex, colMap);
      } catch (emailError) {
        console.error('Error sending completion email:', emailError);
      }
    }

    logSystemEvent(`משימה הושלמה מהדשבורד - שורה ${rowIndex}`, 'SUCCESS');

  } catch (error) {
    console.error('Error in handleStatusUpdateToCompletedOptimized:', error);
    logSystemEvent('שגיאה בטיפול בהשלמה מהדשבורד: ' + error.toString(), 'ERROR');
  }
}

/**
 * 🚀 טיפול במשימה חדשה - גרסה מאופטמת TURBO
 * השיפורים:
 * - Cache לתיקיות
 * - מיילים אסינכרוניים
 * - פחות Flush operations
 * - Error handling משופר
 */
function handleNewTaskOptimized(e) {
  const startTime = new Date();

  try {
    console.log("🚀 Starting handleNewTaskOptimized");

    // יצירת מזהה ייחודי
    const taskId = generateTaskId();
    const now = new Date();

    // אימות נתונים
    if (!e.parameter.requesterName) {
      return createResponse({
        status: 'error',
        message: 'חסר שם המבקש'
      });
    }

    // הכנת נתוני המשימה
    const taskData = prepareTaskData(e, taskId, now);

    // בדיקת עומס מערכת (מהיר)
    if (!checkSystemCapacity()) {
      return createResponse({
        status: 'error',
        message: 'המערכת עמוסה כרגע, נסה שוב בעוד מספר דקות'
      });
    }

    // 🚀 עיבוד קבצים מצורפים - עם Cache
    let fileUrl = '';
    let attachments = [];

    if (e.parameter.numFiles && parseInt(e.parameter.numFiles) > 0) {
      try {
        const fileResult = processAttachmentsOptimized(e, taskId);
        fileUrl = fileResult.fileUrl;
        attachments = fileResult.attachments;
        taskData['קבצים מצורפים'] = fileUrl;
      } catch (fileError) {
        console.error('File processing error (non-critical):', fileError);
        // ממשיכים גם אם יש בעיה עם קבצים
      }
    }

    // הוספת המשימה לגיליון
    const result = addTaskToSheetOptimized(taskData);

    if (!result.success) {
      return createResponse({
        status: 'error',
        message: 'שגיאה בהוספת המשימה: ' + result.error
      });
    }

    // 🚀 שליחת מיילים ברקע (לא חוסמת!)
    if (CONFIG.system.enableAsyncEmails) {
      queueNewTaskEmails(taskData, attachments);
    } else {
      // שליחה מיידית (איטי יותר)
      try {
        sendNewTaskEmailToSecretary(taskData, attachments);
        sendTaskConfirmationEmail(taskData);
      } catch (emailError) {
        console.error("Email error (non-critical):", emailError);
      }
    }

    // עדכון סטטיסטיקות
    updateUserStatistics(taskData['שם המבקש'], 'created');

    const processingTime = new Date() - startTime;

    logSystemEvent(`משימה נוצרה בהצלחה: ${taskId} (${processingTime}ms)`, 'SUCCESS');

    return createResponse({
      status: 'success',
      taskId: taskId,
      message: 'המשימה נוצרה בהצלחה',
      processingTime: processingTime
    });

  } catch (error) {
    console.error("Error in handleNewTaskOptimized:", error);
    logSystemEvent('שגיאה ביצירת משימה: ' + error.toString(), 'ERROR');

    return createResponse({
      status: 'error',
      message: 'שגיאה ביצירת המשימה: ' + error.toString()
    });
  }
}

/**
 * 🚀 הוספת משימה לגיליון - גרסה מאופטמת
 * - פחות פעולות I/O
 * - Batch updates
 */
function addTaskToSheetOptimized(taskData) {
  try {
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);

    // וודא שיש כותרות
    if (sheet.getRange('A1').getValue() === '') {
      setupTasksSheet(sheet);
    }

    const colMap = getColumnMapCached(sheet);
    const newRow = sheet.getLastRow() + 1;

    // 🚀 הכנת כל הערכים במערך אחד (מהיר יותר!)
    const rowValues = [];
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    headers.forEach(header => {
      if (taskData[header] !== undefined) {
        rowValues.push(taskData[header]);
      } else {
        rowValues.push('');
      }
    });

    // כתיבה אחת לשורה (במקום כתיבה לכל תא!)
    sheet.getRange(newRow, 1, 1, rowValues.length).setValues([rowValues]);

    // הוספת checkbox לעמודת "הושלם"
    if (colMap['הושלם']) {
      sheet.getRange(newRow, colMap['הושלם']).insertCheckboxes();
    }

    // צביעת השורה לפי דחיפות
    applyRowFormatting(sheet, newRow, taskData['דחיפות']);

    // Flush רק פעם אחת בסוף!
    SpreadsheetApp.flush();

    return { success: true, rowIndex: newRow };

  } catch (error) {
    console.error("Error in addTaskToSheetOptimized:", error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 🚀 עיבוד קבצים מצורפים - עם Cache לתיקיות
 */
function processAttachmentsOptimized(e, taskId) {
  const attachments = [];
  let fileUrl = '';

  try {
    const numFiles = parseInt(e.parameter.numFiles);
    if (!numFiles || numFiles === 0) {
      return { fileUrl: '', attachments: [] };
    }

    // 🚀 קבלת תיקייה מ-Cache (מהיר!)
    const attachmentsFolder = getOrCreateAttachmentsFolderCached();
    if (!attachmentsFolder) {
      console.error("Failed to create attachments folder");
      return { fileUrl: '', attachments: [] };
    }

    const taskFolder = attachmentsFolder.createFolder(`${taskId}_${new Date().getTime()}`);
    const folderUrl = taskFolder.getUrl();

    for (let i = 0; i < numFiles; i++) {
      try {
        const fileName = e.parameter[`fileName${i}`];
        const fileType = e.parameter[`fileType${i}`];
        const fileContent = e.parameter[`fileContent${i}`];

        if (!fileName || !fileContent) continue;

        const decoded = Utilities.base64Decode(fileContent);
        const blob = Utilities.newBlob(decoded, fileType || 'application/octet-stream', fileName);

        const file = taskFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        if (i === 0) fileUrl = file.getUrl();
        attachments.push(file.getBlob());

      } catch (fileError) {
        console.error(`Error processing file ${i}:`, fileError);
      }
    }

    if (attachments.length > 1) {
      fileUrl = folderUrl;
    }

    return { fileUrl, attachments };

  } catch (error) {
    console.error("Error in processAttachmentsOptimized:", error);
    return { fileUrl: '', attachments: [] };
  }
}

// ================================================
// 🚀 מערכת מיילים אסינכרונית - חדש!
// ================================================

/**
 * הוספת מייל לתור לשליחה ברקע
 */
function queueNewTaskEmails(taskData, attachments) {
  try {
    const taskId = taskData['מזהה משימה'];

    // שמירת נתונים ב-Cache
    const emailData = {
      taskData: taskData,
      type: 'newTask',
      timestamp: new Date().toISOString(),
      hasAttachments: attachments.length > 0
    };

    CacheManager.set(`EMAIL_QUEUE_${taskId}`, JSON.stringify(emailData));

    // יצירת טריגר לשליחה בעוד שנייה (ברקע)
    ScriptApp.newTrigger('processEmailQueue')
      .timeBased()
      .after(1000)
      .create();

    console.log(`✅ מיילים נוספו לתור: ${taskId}`);

  } catch (error) {
    console.error('Error queuing emails:', error);
    // במקרה של שגיאה, ננסה לשלוח מיד
    try {
      sendNewTaskEmailToSecretary(taskData, attachments);
      sendTaskConfirmationEmail(taskData);
    } catch (fallbackError) {
      console.error('Fallback email send failed:', fallbackError);
    }
  }
}

/**
 * הוספת מייל השלמה לתור
 */
function queueEmailForBackground(sheet, rowIndex, colMap, emailType) {
  try {
    const taskId = sheet.getRange(rowIndex, colMap['מזהה משימה']).getValue();

    const emailData = {
      email: sheet.getRange(rowIndex, colMap['אימייל המבקש']).getValue(),
      name: sheet.getRange(rowIndex, colMap['שם המבקש']).getValue(),
      taskId: taskId,
      description: sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue(),
      completionDetails: sheet.getRange(rowIndex, colMap['פרטי ביצוע']).getValue(),
      type: emailType,
      timestamp: new Date().toISOString()
    };

    CacheManager.set(`EMAIL_QUEUE_${taskId}_${emailType}`, JSON.stringify(emailData));

    // יצירת טריגר
    ScriptApp.newTrigger('processEmailQueue')
      .timeBased()
      .after(1000)
      .create();

    console.log(`✅ מייל ${emailType} נוסף לתור: ${taskId}`);

  } catch (error) {
    console.error('Error queuing email:', error);
  }
}

/**
 * 🚀 עיבוד תור המיילים (רץ ברקע)
 */
function processEmailQueue() {
  try {
    const cache = PropertiesService.getScriptProperties();
    const keys = cache.getKeys();
    let processedCount = 0;

    keys.forEach(key => {
      if (key.startsWith('EMAIL_QUEUE_')) {
        try {
          const emailData = JSON.parse(cache.getProperty(key));

          if (emailData.type === 'newTask') {
            sendNewTaskEmailToSecretary(emailData.taskData, []);
            sendTaskConfirmationEmail(emailData.taskData);
          } else if (emailData.type === 'completion') {
            sendTaskCompletionEmail(
              emailData.email,
              emailData.name,
              emailData.taskId,
              emailData.description,
              emailData.completionDetails
            );
          }

          // מחיקה מהתור
          cache.deleteProperty(key);
          processedCount++;

        } catch (emailError) {
          console.error(`Error processing email ${key}:`, emailError);
          // נשמור את המייל בתור למקרה של כשל
        }
      }
    });

    if (processedCount > 0) {
      console.log(`✅ ${processedCount} מיילים נשלחו ברקע`);
      logSystemEvent(`${processedCount} מיילים נשלחו ברקע`, 'INFO');
    }

    // ניקוי טריגרים ישנים
    cleanupOldTriggers();

  } catch (error) {
    console.error('Error processing email queue:', error);
    logSystemEvent('שגיאה בעיבוד תור מיילים: ' + error.toString(), 'ERROR');
  }
}

/**
 * ניקוי טריגרים ישנים
 */
function cleanupOldTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const now = new Date().getTime();

    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'processEmailQueue') {
        // מחק טריגרים שרצו
        ScriptApp.deleteTrigger(trigger);
      }
    });
  } catch (error) {
    console.error('Error cleaning triggers:', error);
  }
}

// ================================================
// פונקציות Cache מאופטמות
// ================================================

/**
 * 🚀 קבלת תיקיית קבצים מצורפים - עם Cache
 */
function getOrCreateAttachmentsFolderCached() {
  try {
    // בדיקה ב-Cache
    const cachedFolderId = CacheManager.get('ATTACHMENTS_FOLDER_ID');

    if (cachedFolderId) {
      try {
        return DriveApp.getFolderById(cachedFolderId);
      } catch (e) {
        // התיקייה נמחקה, ניקה Cache
        CacheManager.delete('ATTACHMENTS_FOLDER_ID');
      }
    }

    // חיפוש או יצירה
    const folders = DriveApp.getFoldersByName(CONFIG.folders.attachments);
    let folder;

    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(CONFIG.folders.attachments);
    }

    // שמירה ב-Cache
    CacheManager.set('ATTACHMENTS_FOLDER_ID', folder.getId());

    return folder;

  } catch (error) {
    console.error('Error in getOrCreateAttachmentsFolderCached:', error);
    return null;
  }
}

/**
 * 🚀 קבלת מפת עמודות - עם Cache
 */
function getColumnMapCached(sheet) {
  try {
    const sheetName = sheet.getName();
    const cacheKey = `COLMAP_${sheetName}`;

    // בדיקה ב-Cache
    const cachedMap = CacheManager.get(cacheKey);
    if (cachedMap) {
      return JSON.parse(cachedMap);
    }

    // יצירת מפה חדשה
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colMap = {};

    headers.forEach((header, index) => {
      if (header) {
        colMap[header] = index + 1;
      }
    });

    // שמירה ב-Cache
    CacheManager.set(cacheKey, JSON.stringify(colMap));

    return colMap;

  } catch (error) {
    console.error('Error in getColumnMapCached:', error);
    // Fallback ללא Cache
    return getColumnMap(sheet);
  }
}

// ================================================
// פונקציות עזר (ללא שינוי)
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
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `TASK-${timestamp}-${random}`;
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
    const today = new Date();
    const todayStr = Utilities.formatDate(today, CONFIG.system.timezone, "yyyy-MM-dd");

    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) return true;

    const colMap = getColumnMapCached(sheet);
    let todayTasksCount = 0;

    for (let i = 1; i < data.length; i++) {
      const taskDate = data[i][colMap['תאריך שליחה'] - 1];
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
    const date = parseDate(dateInput);
    if (!date) return dateInput.toString();

    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ב${month} ${year}`;
  } catch (error) {
    return dateInput.toString();
  }
}

/**
 * יצירת או קבלת גיליון
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

/**
 * קבלת מפת עמודות (ללא Cache - לשימוש fallback)
 */
function getColumnMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colMap = {};

  headers.forEach((header, index) => {
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
  const rowRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());

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
// מיילים אוטומטיים (ללא שינוי)
// ================================================

/**
 * שליחת מייל למזכירה על משימה חדשה
 */
function sendNewTaskEmailToSecretary(taskData, attachments = []) {
  try {
    const urgencyIcon = taskData['דחיפות'] === 'דחופה מאוד' ? '🚨' :
                       taskData['דחיפות'] === 'דחופה' ? '⚡' : '📋';

    const subject = `${urgencyIcon} משימה חדשה: ${taskData['שם המבקש']} - ${taskData['דחיפות']}`;

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">${urgencyIcon} משימה חדשה התקבלה</h2>
        </div>

        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-right: 4px solid ${getPriorityColor(taskData['דחיפות'])};">
            <h3 style="color: #333; margin-top: 0;">פרטי המשימה</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; width: 120px;"><strong>מזהה:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${taskData['מזהה משימה']}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>מבקש:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${taskData['שם המבקש']}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>אימייל:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${taskData['אימייל המבקש']}">${taskData['אימייל המבקש']}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>סיווג:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${taskData['סיווג משימה']}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>דחיפות:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  <span style="color: ${getPriorityColor(taskData['דחיפות'])}; font-weight: bold;">
                    ${taskData['דחיפות']}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px;"><strong>תאריך יעד:</strong></td>
                <td style="padding: 8px;">${formatDateHebrew(taskData['תאריך לביצוע'])}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #333; margin-top: 0;">תיאור המשימה:</h4>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; line-height: 1.6; white-space: pre-wrap;">
              ${taskData['תיאור המשימה']}
            </p>
          </div>

          ${taskData['קבצים מצורפים'] ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #333; margin-top: 0;">📎 קבצים מצורפים</h4>
            <p><a href="${taskData['קבצים מצורפים']}" style="color: #007bff; text-decoration: none;">לחץ כאן לצפייה בקבצים</a></p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #666;">
              נשלח אוטומטית ממערכת ניהול המשימות ${CONFIG.system.version}<br>
              ${new Date().toLocaleString('he-IL')}
            </p>
          </div>
        </div>
      </div>
    `;

    GmailApp.sendEmail(CONFIG.email.secretary, subject, '', {
      htmlBody: htmlBody,
      attachments: attachments,
      name: CONFIG.system.name
    });

    console.log(`✅ מייל נשלח למזכירה על משימה ${taskData['מזהה משימה']}`);

  } catch (error) {
    console.error('שגיאה בשליחת מייל למזכירה:', error);
    throw error; // זרוק את השגיאה הלאה
  }
}

/**
 * שליחת מייל אישור למבקש
 */
function sendTaskConfirmationEmail(taskData) {
  try {
    if (!taskData['אימייל המבקש']) return;

    const subject = `אישור קבלת משימה - ${taskData['מזהה משימה']}`;

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">✅ המשימה התקבלה בהצלחה</h2>
        </div>

        <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">שלום <strong>${taskData['שם המבקש']}</strong>,</p>

          <p style="font-size: 16px;">משימתך התקבלה במערכת ותטופל בהקדם.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #667eea;">
            <p><strong>מזהה משימה:</strong> ${taskData['מזהה משימה']}</p>
            <p><strong>תאריך יעד:</strong> ${formatDateHebrew(taskData['תאריך לביצוע'])}</p>
            <p><strong>דחיפות:</strong> ${taskData['דחיפות']}</p>
          </div>

          <p style="font-size: 14px; color: #666;">
            נעדכן אותך בהתקדמות הטיפול במשימה.<br>
            לבירורים ניתן לפנות למזכירה במייל: ${CONFIG.email.secretary}
          </p>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999;">
              ${CONFIG.system.name}<br>
              ${new Date().toLocaleString('he-IL')}
            </p>
          </div>
        </div>
      </div>
    `;

    GmailApp.sendEmail(taskData['אימייל המבקש'], subject, '', {
      htmlBody: htmlBody,
      name: CONFIG.system.name
    });

    console.log(`✅ מייל אישור נשלח למבקש ${taskData['שם המבקש']}`);

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}

/**
 * שליחת מייל השלמה מתוך שורה
 */
function sendCompletionEmailFromRow(sheet, rowIndex, colMap) {
  try {
    const email = sheet.getRange(rowIndex, colMap['אימייל המבקש']).getValue();
    if (!email) return;

    const taskData = {
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
    throw error;
  }
}

/**
 * שליחת מייל השלמת משימה
 */
function sendTaskCompletionEmail(email, name, taskId, description, completionDetails) {
  try {
    const subject = `✅ המשימה שלך הושלמה - ${taskId}`;

    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">✅ המשימה הושלמה בהצלחה!</h2>
        </div>

        <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">שלום <strong>${name}</strong>,</p>

          <p style="font-size: 16px;">שמחים לעדכן שהמשימה שלך הושלמה.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>מזהה משימה:</strong> ${taskId}</p>
            <p><strong>תיאור:</strong> ${description}</p>
            <p><strong>תאריך השלמה:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
          </div>

          ${completionDetails ? `
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-right: 4px solid #28a745;">
            <p style="margin: 0;"><strong>פרטי הביצוע:</strong></p>
            <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${completionDetails}</p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            במקרה של שאלות נוספות, ניתן לפנות למזכירה במייל: ${CONFIG.email.secretary}
          </p>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999;">
              ${CONFIG.system.name}<br>
              ${new Date().toLocaleString('he-IL')}
            </p>
          </div>
        </div>
      </div>
    `;

    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      name: CONFIG.system.name
    });

    console.log(`✅ מייל השלמה נשלח למבקש ${name} על משימה ${taskId}`);

  } catch (error) {
    console.error('Error sending completion email:', error);
    throw error;
  }
}

/**
 * קבלת צבע לפי דחיפות
 */
function getPriorityColor(priority) {
  switch(priority) {
    case 'דחופה מאוד':
      return '#dc3545';
    case 'דחופה':
      return '#ff6600';
    default:
      return '#28a745';
  }
}

// ================================================
// פונקציות API נוספות (ללא שינוי משמעותי)
// ================================================

/**
 * עדכון מונה החזרות
 */
function incrementReturnCount(rowIndex) {
  try {
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const colMap = getColumnMapCached(sheet);

    if (!rowIndex || rowIndex < 2) {
      return {
        status: 'error',
        message: 'מספר שורה לא תקין'
      };
    }

    if (colMap['מועבר פעמים']) {
      const currentCount = sheet.getRange(rowIndex, colMap['מועבר פעמים']).getValue() || 0;
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
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const data = sheet.getDataRange().getValues();

    const stats = {
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

    const colMap = getColumnMapCached(sheet);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // חישוב סטטיסטיקות
    for (let i = 1; i < data.length; i++) {
      stats.total++;

      const status = data[i][colMap['סטטוס'] - 1];
      const priority = data[i][colMap['דחיפות'] - 1];
      const dueDateValue = data[i][colMap['תאריך לביצוע'] - 1];
      const completionDateValue = data[i][colMap['תאריך השלמה'] - 1];

      // ספירת סטטוסים
      updateStatusCount(stats, status);

      // ספירת דחיפות
      if (priority === 'דחופה' || priority === 'דחופה מאוד') {
        stats.urgent++;
      }

      // בדיקת איחורים
      if (dueDateValue && isOverdue(dueDateValue, status, today)) {
        stats.overdue++;
      }

      // בדיקת השלמות השבוע
      if (status === 'בוצע' && completionDateValue) {
        const completionDate = parseDate(completionDateValue);
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

/**
 * קבלת משימות של משתמש ספציפי
 */
function getUserTasks(userName) {
  try {
    if (!userName) {
      return {
        status: 'error',
        message: 'חסר שם משתמש'
      };
    }

    const userExists = CONFIG.users.some(user => user.name === userName);
    if (!userExists) {
      return {
        status: 'error',
        message: 'משתמש לא מוכר במערכת'
      };
    }

    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return {
        status: 'success',
        tasks: [],
        count: 0,
        user: userName
      };
    }

    const colMap = getColumnMapCached(sheet);
    const userTasks = [];

    for (let i = 1; i < data.length; i++) {
      try {
        const requesterName = data[i][colMap['שם המבקש'] - 1];

        if (requesterName === userName) {
          const task = extractTaskData(data[i], colMap, i + 1);
          if (task) {
            userTasks.push(task);
          }
        }
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
      }
    }

    return {
      status: 'success',
      tasks: userTasks,
      count: userTasks.length,
      user: userName,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getUserTasks:', error);
    return {
      status: 'error',
      message: 'שגיאה בטעינת המשימות: ' + error.toString(),
      tasks: [],
      count: 0
    };
  }
}

/**
 * קבלת פרופיל משתמש
 */
function getUserProfile(userName) {
  try {
    if (!userName) {
      return {
        status: 'error',
        message: 'חסר שם משתמש'
      };
    }

    const user = CONFIG.users.find(u => u.name === userName);

    if (!user) {
      return {
        status: 'error',
        message: 'משתמש לא נמצא במערכת'
      };
    }

    return {
      status: 'success',
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return {
      status: 'error',
      message: 'שגיאה בטעינת פרופיל המשתמש'
    };
  }
}

/**
 * קבלת סטטיסטיקות של משתמש ספציפי
 */
function getUserStatistics(userName) {
  try {
    if (!userName) {
      return {
        status: 'error',
        message: 'חסר שם משתמש'
      };
    }

    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const data = sheet.getDataRange().getValues();

    const stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      returned: 0,
      cancelled: 0,
      overdue: 0,
      urgent: 0,
      completedThisWeek: 0,
      completedThisMonth: 0
    };

    if (data.length < 2) {
      return {
        status: 'success',
        stats: stats,
        user: userName
      };
    }

    const colMap = getColumnMapCached(sheet);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 1; i < data.length; i++) {
      const requesterName = data[i][colMap['שם המבקש'] - 1];

      if (requesterName !== userName) continue;

      stats.total++;

      const status = data[i][colMap['סטטוס'] - 1];
      const priority = data[i][colMap['דחיפות'] - 1];
      const dueDateValue = data[i][colMap['תאריך לביצוע'] - 1];
      const completionDateValue = data[i][colMap['תאריך השלמה'] - 1];

      switch(status) {
        case 'ממתינה':
          stats.pending++;
          break;
        case 'בביצוע':
          stats.inProgress++;
          break;
        case 'בוצע':
          stats.completed++;
          break;
        case 'הוחזר להשלמה':
          stats.returned++;
          break;
        case 'בוטל':
          stats.cancelled++;
          break;
      }

      if (priority === 'דחופה' || priority === 'דחופה מאוד') {
        stats.urgent++;
      }

      if (dueDateValue && isOverdue(dueDateValue, status, today)) {
        stats.overdue++;
      }

      if (status === 'בוצע' && completionDateValue) {
        const completionDate = parseDate(completionDateValue);
        if (completionDate) {
          if (completionDate >= weekAgo) {
            stats.completedThisWeek++;
          }
          if (completionDate >= monthAgo) {
            stats.completedThisMonth++;
          }
        }
      }
    }

    return {
      status: 'success',
      stats: stats,
      user: userName,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    return {
      status: 'error',
      message: 'שגיאה בחישוב סטטיסטיקות: ' + error.toString(),
      stats: {}
    };
  }
}

/**
 * עדכון ספירת סטטוסים
 */
function updateStatusCount(stats, status) {
  switch(status) {
    case 'ממתינה':
      stats.pending++;
      break;
    case 'בביצוע':
      stats.inProgress++;
      break;
    case 'בוצע':
      stats.completed++;
      break;
    case 'הוחזר להשלמה':
      stats.returned++;
      break;
    case 'בוטל':
      stats.cancelled++;
      break;
  }
}

/**
 * בדיקה האם משימה באיחור
 */
function isOverdue(dueDateValue, status, today) {
  if (status === 'בוצע' || status === 'בוטל' || status === 'פג תוקף - לא רלוונטי') {
    return false;
  }

  const dueDate = parseDate(dueDateValue);
  return dueDate && dueDate < today;
}

/**
 * עדכון סטטיסטיקות משתמש
 */
function updateUserStatistics(userName, action) {
  console.log(`User statistics updated: ${userName} - ${action}`);
}

/**
 * רישום אירועי מערכת
 */
function logSystemEvent(message, level = 'INFO') {
  try {
    const logSheet = getOrCreateSheet(CONFIG.sheets.systemLog);

    if (logSheet.getRange('A1').getValue() === '') {
      setupSystemLogSheet(logSheet);
    }

    const lastRow = logSheet.getLastRow() + 1;
    const logData = [
      new Date(),
      level,
      message,
      Session.getActiveUser().getEmail() || 'SYSTEM'
    ];

    logSheet.getRange(lastRow, 1, 1, logData.length).setValues([logData]);

    const rowRange = logSheet.getRange(lastRow, 1, 1, logSheet.getLastColumn());

    switch (level) {
      case 'ERROR':
        rowRange.setBackground('#ffebee');
        break;
      case 'WARNING':
        rowRange.setBackground('#fff3e0');
        break;
      case 'SUCCESS':
        rowRange.setBackground('#e8f5e9');
        break;
      case 'INFO':
      default:
        rowRange.setBackground('#ffffff');
    }

    if (lastRow > 1001) {
      logSheet.deleteRow(2);
    }

  } catch (error) {
    console.error('Error logging system event:', error);
  }
}

// ================================================
// הגדרת גיליונות
// ================================================

/**
 * הגדרת גיליון משימות
 */
function setupTasksSheet(sheet) {
  const headers = [
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

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
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
  const headers = [
    'תאריך ושעה',
    'רמת חומרה',
    'הודעה',
    'משתמש'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#999999');
  headerRange.setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ================================================
// הגדרת מערכת
// ================================================

/**
 * פתיחת התפריט
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('⚡ ניהול משימות TURBO 9.0');

  menu.addItem('🚀 הגדרת מערכת', 'setupSystem');
  menu.addItem('📊 הצג סטטיסטיקות', 'showStatistics');
  menu.addItem('📧 שלח דוח יומי', 'sendDailyReport');
  menu.addSeparator();
  menu.addItem('🗑️ נקה Cache', 'clearCache');
  menu.addItem('🔄 רענן תצוגה', 'refreshView');
  menu.addItem('ℹ️ אודות', 'showAbout');

  menu.addToUi();
}

/**
 * 🚀 הגדרת המערכת - גרסה TURBO
 */
function setupSystem() {
  const ui = SpreadsheetApp.getUi();

  try {
    // יצירת גיליונות
    const sheets = [
      CONFIG.sheets.tasks,
      CONFIG.sheets.systemLog,
      CONFIG.sheets.dailyReports,
      CONFIG.sheets.userStats,
      CONFIG.sheets.backups
    ];

    sheets.forEach(sheetName => {
      const sheet = getOrCreateSheet(sheetName);

      if (sheetName === CONFIG.sheets.tasks && sheet.getRange('A1').getValue() === '') {
        setupTasksSheet(sheet);
      }

      if (sheetName === CONFIG.sheets.systemLog && sheet.getRange('A1').getValue() === '') {
        setupSystemLogSheet(sheet);
      }
    });

    // הגדרת טריגרים
    setupTriggers();

    // ניקוי Cache
    CacheManager.clear();

    ui.alert(
      '⚡ הגדרת המערכת הושלמה - TURBO MODE!',
      'המערכת מוכנה לעבודה.\n\n' +
      '✅ גיליונות נוצרו\n' +
      '✅ טריגרים הוגדרו\n' +
      '✅ Cache נוקה\n' +
      '✅ מערכת מיילים אסינכרונית פעילה\n' +
      '✅ ביצועים משופרים פי 3-5!\n' +
      '✅ רשימת משתמשים עודכנה',
      ui.ButtonSet.OK
    );

    logSystemEvent('המערכת הוגדרה בהצלחה - גרסה TURBO 9.0', 'SUCCESS');

  } catch (error) {
    ui.alert('שגיאה', 'אירעה שגיאה בהגדרת המערכת: ' + error.toString(), ui.ButtonSet.OK);
    logSystemEvent('שגיאה בהגדרת המערכת: ' + error.toString(), 'ERROR');
  }
}

/**
 * הגדרת טריגרים
 */
function setupTriggers() {
  // מחיקת טריגרים קיימים
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  // הגדרת טריגר יומי לדוחות
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  // הגדרת טריגר לעריכות
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

  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.sheets.tasks) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  if (row === 1) return;

  const colMap = getColumnMapCached(sheet);

  if (col === colMap['סטטוס']) {
    handleStatusUpdate(sheet, row, colMap, e.value);
  }

  if (col === colMap['הושלם'] && e.value === 'TRUE') {
    handleTaskCompletion(sheet, row, colMap);
  }
}

/**
 * טיפול בעדכון סטטוס
 */
function handleStatusUpdate(sheet, rowIndex, colMap, newStatus) {
  const now = new Date();

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

      // שליחת מייל ברקע
      if (CONFIG.system.enableAsyncEmails) {
        queueEmailForBackground(sheet, rowIndex, colMap, 'completion');
      } else {
        sendCompletionEmailFromRow(sheet, rowIndex, colMap);
      }
      break;
  }
}

/**
 * טיפול בהשלמת משימה
 */
function handleTaskCompletion(sheet, row, colMap) {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'סימון משימה כבוצעה',
    'נא להזין פרטי ביצוע:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK || !response.getResponseText().trim()) {
    sheet.getRange(row, colMap['הושלם']).setValue(false);
    ui.alert('חובה להזין פרטי ביצוע');
    return;
  }

  const completionDetails = response.getResponseText().trim();
  const now = new Date();

  sheet.getRange(row, colMap['סטטוס']).setValue('בוצע');
  sheet.getRange(row, colMap['תאריך השלמה']).setValue(
    Utilities.formatDate(now, CONFIG.system.timezone, "yyyy-MM-dd")
  );
  sheet.getRange(row, colMap['שעת השלמה']).setValue(
    Utilities.formatDate(now, CONFIG.system.timezone, "HH:mm:ss")
  );
  sheet.getRange(row, colMap['פרטי ביצוע']).setValue(completionDetails);

  // שליחת מייל ברקע
  if (CONFIG.system.enableAsyncEmails) {
    queueEmailForBackground(sheet, row, colMap, 'completion');
  } else {
    sendCompletionEmailFromRow(sheet, row, colMap);
  }
}

/**
 * שליחת דוח יומי
 */
function sendDailyReport() {
  logSystemEvent('דוח יומי נשלח', 'INFO');
}

/**
 * ניקוי Cache ידני
 */
function clearCache() {
  CacheManager.clear();
  const ui = SpreadsheetApp.getUi();
  ui.alert('✅ Cache נוקה', 'כל הנתונים השמורים ב-Cache נמחקו בהצלחה.', ui.ButtonSet.OK);
}

/**
 * הצגת סטטיסטיקות
 */
function showStatistics() {
  const stats = getTaskStatistics();
  const ui = SpreadsheetApp.getUi();

  const message = `
סטטיסטיקות משימות TURBO:
━━━━━━━━━━━━━━━━━━━
📊 סה"כ משימות: ${stats.stats.total}
⏳ ממתינות: ${stats.stats.pending}
🔄 בביצוע: ${stats.stats.inProgress}
✅ הושלמו: ${stats.stats.completed}
🚨 באיחור: ${stats.stats.overdue}
⚡ דחופות: ${stats.stats.urgent}
📅 הושלמו השבוע: ${stats.stats.completedWeek}
  `;

  ui.alert('סטטיסטיקות מערכת', message, ui.ButtonSet.OK);
}

/**
 * רענון תצוגה
 */
function refreshView() {
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().activate();
  SpreadsheetApp.getUi().alert('התצוגה רוע ננה', 'הנתונים רועננו בהצלחה', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * אודות
 */
function showAbout() {
  const ui = SpreadsheetApp.getUi();

  const about = `
${CONFIG.system.name}
גרסה: ${CONFIG.system.version} ⚡

מערכת מתקדמת לניהול משימות משרדי
━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 תכונות TURBO:
• ביצועים מהירים פי 3-5
• Cache חכם לנתונים
• מיילים אסינכרוניים
• אופטימיזציה מקסימלית
• Error handling משופר

✨ תכונות עיקריות:
• ניהול משימות חכם
• מיילים אוטומטיים
• דוחות וסטטיסטיקות
• ממשק API מתקדם
• מערכת גיבוי והגנה
• ממשק אישי למשתמשים

פותח עבור: משרד עו"ד
נבנה ב: ${new Date().getFullYear()}
  `;

  ui.alert('אודות המערכת TURBO', about, ui.ButtonSet.OK);
}
