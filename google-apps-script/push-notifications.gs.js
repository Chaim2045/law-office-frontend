// ================================================
// Push Notifications - Google Apps Script
// ================================================
// Add this code to your existing Google Apps Script project
//
// SETUP:
// 1. In GAS editor, go to Project Settings > Script Properties
// 2. Add: PUSH_SHARED_SECRET = (generate a random string)
// 3. Add: NETLIFY_PUSH_URL = https://taskmangenet.netlify.app/.netlify/functions/send-push
// 4. Create a new sheet tab called "PushSubscriptions"
//    with headers: email | name | endpoint | p256dh | auth | created_at
//
// Then add "savePushSubscription" to your doPost() action switch:
//   case 'savePushSubscription':
//     return handleSavePushSubscription(e);
// ================================================

/**
 * Save push subscription from frontend
 */
function handleSavePushSubscription(e) {
  try {
    var email = (e.parameter.email || '').toLowerCase().trim();
    var name = e.parameter.name || '';
    var endpoint = e.parameter.endpoint || '';
    var p256dh = e.parameter.p256dh || '';
    var auth = e.parameter.auth || '';

    if (!email || !endpoint || !p256dh || !auth) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing required fields'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PushSubscriptions');

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('PushSubscriptions');
      sheet.appendRow(['email', 'name', 'endpoint', 'p256dh', 'auth', 'created_at']);
    }

    // Check if this endpoint already exists for this email
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === email && data[i][2] === endpoint) {
        // Update existing
        sheet.getRange(i + 1, 4).setValue(p256dh);
        sheet.getRange(i + 1, 5).setValue(auth);
        sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Subscription updated'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Add new subscription
    sheet.appendRow([email, name, endpoint, p256dh, auth, new Date().toISOString()]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Subscription saved'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send push notification to a user by email
 * Call this from markTaskCompleted, returnTask, etc.
 *
 * @param {string} email - User email
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} url - URL to open on click (optional)
 */
function sendPushToUser(email, title, message, url) {
  try {
    email = (email || '').toLowerCase().trim();
    if (!email) return;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('PushSubscriptions');
    if (!sheet) return;

    // Find all subscriptions for this email
    var data = sheet.getDataRange().getValues();
    var subscriptions = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        subscriptions.push({
          endpoint: data[i][2],
          p256dh: data[i][3],
          auth: data[i][4]
        });
      }
    }

    if (subscriptions.length === 0) return;

    // Send via Netlify function
    var props = PropertiesService.getScriptProperties();
    var pushUrl = props.getProperty('NETLIFY_PUSH_URL');
    var pushSecret = props.getProperty('PUSH_SHARED_SECRET');

    if (!pushUrl || !pushSecret) {
      Logger.log('Push notification config missing');
      return;
    }

    var payload = {
      subscriptions: subscriptions,
      title: title,
      message: message,
      url: url || '/',
      icon: '/images/icon-192.png'
    };

    var response = UrlFetchApp.fetch(pushUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + pushSecret
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var result = JSON.parse(response.getContentText());

    // Clean up expired subscriptions
    if (result.expired && result.expired.length > 0) {
      removeExpiredSubscriptions(result.expired);
    }

    Logger.log('Push sent to ' + email + ': ' + result.sent + ' sent, ' + result.failed + ' failed');

  } catch (error) {
    Logger.log('Push notification error: ' + error.toString());
  }
}

/**
 * Remove expired/invalid subscriptions
 */
function removeExpiredSubscriptions(expiredEndpoints) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PushSubscriptions');
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  // Delete from bottom to top to avoid index shifting
  for (var i = data.length - 1; i >= 1; i--) {
    if (expiredEndpoints.indexOf(data[i][2]) !== -1) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ================================================
// Integration points - add these calls to your existing handlers
// ================================================

// In your "mark task as completed" handler, add:
//   sendPushToUser(
//     taskRequesterEmail,
//     'המשימה בוצעה ✓',
//     'המשימה "' + taskDescription.substring(0, 60) + '" סומנה כבוצעה',
//     '/'
//   );

// In your "return task" handler, add:
//   sendPushToUser(
//     taskRequesterEmail,
//     'משימה הוחזרה להשלמה',
//     'המשימה "' + taskDescription.substring(0, 60) + '" הוחזרה: ' + reason.substring(0, 100),
//     '/'
//   );

// ================================================
// Daily overdue check - set up as time-driven trigger
// ================================================

/**
 * Check for overdue tasks and send notifications
 * Set up a daily trigger: Edit > Triggers > Add Trigger
 * Function: checkOverdueTasks, Time-driven, Day timer, 8am-9am
 */
function checkOverdueTasks() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tasksSheet = ss.getSheetByName('Tasks') || ss.getSheetByName('Sheet1');
    if (!tasksSheet) return;

    var data = tasksSheet.getDataRange().getValues();
    var headers = data[0];

    // Find column indices
    var colMap = {};
    for (var h = 0; h < headers.length; h++) {
      colMap[headers[h]] = h;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var notifiedToday = PropertiesService.getScriptProperties().getProperty('overdue_notified_' + today.toISOString().split('T')[0]);
    if (notifiedToday) return; // Already ran today

    var overdueByUser = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var status = row[colMap['status'] || colMap['סטטוס']] || '';
      var dueDate = row[colMap['dueDate'] || colMap['תאריך יעד']] || '';
      var email = row[colMap['requesterEmail'] || colMap['email'] || colMap['אימייל']] || '';
      var description = row[colMap['description'] || colMap['תיאור']] || '';

      // Skip completed/cancelled
      if (status === 'בוצע' || status === 'בוטל') continue;

      // Check if overdue
      if (dueDate) {
        var due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today && email) {
          email = email.toLowerCase().trim();
          if (!overdueByUser[email]) {
            overdueByUser[email] = [];
          }
          overdueByUser[email].push(description.substring(0, 50));
        }
      }
    }

    // Send one notification per user with count
    for (var userEmail in overdueByUser) {
      var tasks = overdueByUser[userEmail];
      var count = tasks.length;
      var title = count === 1 ? 'משימה באיחור' : count + ' משימות באיחור';
      var body = count === 1
        ? 'המשימה "' + tasks[0] + '" עברה את תאריך היעד'
        : 'יש לך ' + count + ' משימות שעברו את תאריך היעד';

      sendPushToUser(userEmail, title, body, '/');
    }

    // Mark as done for today
    PropertiesService.getScriptProperties().setProperty(
      'overdue_notified_' + today.toISOString().split('T')[0],
      'true'
    );

    Logger.log('Overdue check complete. Notified ' + Object.keys(overdueByUser).length + ' users');

  } catch (error) {
    Logger.log('Overdue check error: ' + error.toString());
  }
}
