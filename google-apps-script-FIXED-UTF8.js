/**
 * ================================================
 * מערכת ניהול משימות משרדית - תיקוני דשבורד
 * ================================================
 *
 * תיקונים:
 * 1. doPost() - routing לפי action (getAllTasks, markTaskCompleted, returnTask)
 * 2. handleMarkCompleted() - סימון משימה כבוצעה מהדשבורד
 * 3. handleReturnTask() - החזרת משימה למבקש + שליחת מייל
 * 4. sendTaskReturnEmail() - מייל חדש להודעה על החזרת משימה
 * 5. UTF-8 charset בכל המיילים
 *
 * @version 8.2.0
 *
 * ================================================
 * הוראות עדכון ב-Google Apps Script:
 * ================================================
 *
 * 1. פתח https://script.google.com
 * 2. פתח את הפרויקט של מערכת המשימות
 *
 * 3. ===== תיקון doPost =====
 *    מצא את הפונקציה doPost ו-**החלף אותה** בפונקציה למטה.
 *    הפונקציה הישנה נראית כך:
 *      function doPost(e) {
 *        return handleNewTask(e);
 *      }
 *    החלף אותה ב:
 */

// ========== החלף את doPost הישן בזה: ==========

function doPost(e) {
  try {
    // בדיקה אם יש action parameter
    const action = e.parameter.action || '';

    switch(action) {
      case 'getAllTasks':
        return createResponse(getAllTasksForSecretary());

      case 'markTaskCompleted':
        return createResponse(handleMarkCompleted(e.parameter));

      case 'returnTask':
        return createResponse(handleReturnTask(e.parameter));

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

// ========== הוסף את הפונקציות הבאות (חדשות): ==========

/**
 * סימון משימה כבוצעה מהדשבורד
 * נקרא כש-action=markTaskCompleted
 */
function handleMarkCompleted(params) {
  try {
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const colMap = getColumnMap(sheet);
    const rowIndex = parseInt(params.row);
    const taskId = params.taskId;
    const details = params.details || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'מספר שורה לא תקין: ' + rowIndex };
    }

    const now = new Date();

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
    const sheet = getOrCreateSheet(CONFIG.sheets.tasks);
    const colMap = getColumnMap(sheet);
    const rowIndex = parseInt(params.row);
    const taskId = params.taskId;
    const reason = params.reason || '';

    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { status: 'error', message: 'מספר שורה לא תקין: ' + rowIndex };
    }

    // עדכון סטטוס
    sheet.getRange(rowIndex, colMap['סטטוס']).setValue('הוחזר להשלמה');

    // עדכון הערות מזכירה עם סיבת ההחזרה
    if (colMap['הערות מזכירה']) {
      const currentNotes = sheet.getRange(rowIndex, colMap['הערות מזכירה']).getValue() || '';
      const timestamp = Utilities.formatDate(new Date(), CONFIG.system.timezone, "dd/MM/yyyy HH:mm");
      const newNote = '[הוחזר ' + timestamp + '] ' + reason;
      const updatedNotes = currentNotes ? currentNotes + '\n' + newNote : newNote;
      sheet.getRange(rowIndex, colMap['הערות מזכירה']).setValue(updatedNotes);
    }

    // עדכון מונה החזרות
    if (colMap['מועבר פעמים']) {
      const currentCount = sheet.getRange(rowIndex, colMap['מועבר פעמים']).getValue() || 0;
      sheet.getRange(rowIndex, colMap['מועבר פעמים']).setValue(currentCount + 1);
    }

    SpreadsheetApp.flush();

    // שליחת מייל החזרה למבקש
    try {
      const email = sheet.getRange(rowIndex, colMap['אימייל המבקש']).getValue();
      const name = sheet.getRange(rowIndex, colMap['שם המבקש']).getValue();
      const description = sheet.getRange(rowIndex, colMap['תיאור המשימה']).getValue();

      if (email) {
        sendTaskReturnEmail(email, name, taskId, description, reason);
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

/**
 * שליחת מייל החזרת משימה למבקש - פונקציה חדשה!
 * זו הפונקציה שהייתה חסרה ולכן המשתמשים לא קיבלו מייל
 */
function sendTaskReturnEmail(email, name, taskId, description, reason) {
  try {
    var subject = '🔄 המשימה שלך הוחזרה להשלמה - ' + taskId;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">🔄 המשימה הוחזרה להשלמה</h2>'
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
      + '<p style="font-size: 14px; color: #666; margin-top: 30px;">אנא השלם את הנדרש ושלח מחדש, או פנה למזכירה לבירורים במייל: ' + CONFIG.email.secretary + '</p>'
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

// ========== תיקון פונקציות מייל קיימות (UTF-8): ==========

/**
 * שליחת מייל למזכירה על משימה חדשה - עם UTF-8
 * (החלף את הפונקציה הקיימת)
 */
function sendNewTaskEmailToSecretary(taskData, attachments) {
  try {
    var urgencyIcon = taskData['דחיפות'] === 'דחופה מאוד' ? '🚨' :
                      taskData['דחיפות'] === 'דחופה' ? '⚡' : '📋';

    var subject = urgencyIcon + ' משימה חדשה: ' + taskData['שם המבקש'] + ' - ' + taskData['דחיפות'];

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">' + urgencyIcon + ' משימה חדשה התקבלה</h2>'
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
      + (taskData['קבצים מצורפים'] ? '<div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;"><h4 style="color: #333; margin-top: 0;">📎 קבצים מצורפים</h4><p><a href="' + taskData['קבצים מצורפים'] + '" style="color: #007bff; text-decoration: none;">לחץ כאן לצפייה בקבצים</a></p></div>' : '')
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
 * שליחת מייל אישור למבקש - עם UTF-8
 * (החלף את הפונקציה הקיימת)
 */
function sendTaskConfirmationEmail(taskData) {
  try {
    if (!taskData['אימייל המבקש']) return;

    var subject = 'אישור קבלת משימה - ' + taskData['מזהה משימה'];

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">✅ המשימה התקבלה בהצלחה</h2></div>'
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
 * שליחת מייל השלמת משימה - עם UTF-8
 * (החלף את הפונקציה הקיימת)
 */
function sendTaskCompletionEmail(email, name, taskId, description, completionDetails) {
  try {
    var subject = '✅ המשימה שלך הושלמה - ' + taskId;

    var htmlBody = '<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
      + '<div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">'
      + '<h2 style="margin: 0;">✅ המשימה הושלמה בהצלחה!</h2></div>'
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

// ================================================
// הוראות עדכון ב-Google Apps Script:
// ================================================
//
// 1. פתח https://script.google.com ומצא את הפרויקט
//
// 2. ===== תיקון doPost (קריטי!) =====
//    מצא: function doPost(e) { return handleNewTask(e); }
//    החלף ב-doPost החדש מלמעלה
//
// 3. ===== הוסף פונקציות חדשות =====
//    העתק והדבק:
//    - handleMarkCompleted()
//    - handleReturnTask()
//    - sendTaskReturnEmail()
//
// 4. ===== עדכן פונקציות מייל =====
//    החלף את 3 פונקציות המייל הקיימות בגרסאות המעודכנות
//
// 5. שמור (Ctrl+S)
//
// 6. ===== פרסום גרסה חדשה (חובה!) =====
//    Deploy > New deployment > Web app
//    Execute as: Me
//    Who has access: Anyone
//    Deploy > Copy URL
//    * ה-URL ישתנה! עדכן אותו בדשבורד ובממשק המשימות
//
//    ** לחלופין: Deploy > Manage deployments > עריכת deployment קיים
//    ** ובחר "New version" - כך ה-URL לא ישתנה
//
