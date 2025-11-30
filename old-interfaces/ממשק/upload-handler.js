/**
 * ================================================
 * מנהל העלאות מתקדם - גרסה 3.0
 * העלאה ישירה ל-Google Drive
 * ================================================
 */

// ⚙️ הגדרות - **עדכן אותן עם המפתחות שלך!**
const DRIVE_CONFIG = {
  // 🔑 מפתחות API - קבל אותם משלב 1
  apiKey: 'YOUR_API_KEY_HERE', // 👈 שנה את זה!
  clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com', // 👈 שנה את זה!

  // 📁 הגדרות תיקייה
  folderName: 'קבצים מצורפים למשימות',

  // 🎯 Scopes נדרשים
  scope: 'https://www.googleapis.com/auth/drive.file',

  // ⚙️ הגדרות כלליות
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip']
};

// 🌍 משתנים גלובליים
let gapiLoaded = false;
let gisLoaded = false;
let tokenClient;
let accessToken = null;
let folderCache = null;

/**
 * 🚀 אתחול המערכת
 */
function initDriveUploader() {
  console.log('🔧 מאתחל מערכת העלאות...');

  // טעינת Google API
  loadGoogleAPIs();
}

/**
 * 📥 טעינת ספריות Google
 */
function loadGoogleAPIs() {
  // טעינת GAPI
  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = () => {
    console.log('✅ GAPI נטען');
    gapi.load('client', initializeGapiClient);
  };
  document.head.appendChild(gapiScript);

  // טעינת GIS (Google Identity Services)
  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => {
    console.log('✅ GIS נטען');
    initializeGisClient();
  };
  document.head.appendChild(gisScript);
}

/**
 * 🔧 אתחול GAPI Client
 */
async function initializeGapiClient() {
  try {
    await gapi.client.init({
      apiKey: DRIVE_CONFIG.apiKey,
      discoveryDocs: DRIVE_CONFIG.discoveryDocs,
    });

    gapiLoaded = true;
    console.log('✅ GAPI Client אותחל בהצלחה');

  } catch (error) {
    console.error('❌ שגיאה באתחול GAPI:', error);
    showNotification('שגיאה בטעינת מערכת ההעלאות', 'warning');
  }
}

/**
 * 🔧 אתחול GIS Client (OAuth)
 */
function initializeGisClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: DRIVE_CONFIG.clientId,
    scope: DRIVE_CONFIG.scope,
    callback: '', // יוגדר בזמן ההעלאה
  });

  gisLoaded = true;
  console.log('✅ GIS Client אותחל בהצלחה');
}

/**
 * 🔐 קבלת הרשאת גישה מהמשתמש
 */
function requestAccessToken() {
  return new Promise((resolve, reject) => {
    try {
      // אם יש כבר טוקן תקף
      if (accessToken && gapi.client.getToken()) {
        resolve(accessToken);
        return;
      }

      tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }

        accessToken = response.access_token;
        console.log('✅ הרשאת גישה התקבלה');
        resolve(accessToken);
      };

      // בקשת הרשאה
      if (!gapi.client.getToken()) {
        tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
        tokenClient.requestAccessToken({prompt: ''});
      }

    } catch (error) {
      console.error('❌ שגיאה בקבלת הרשאה:', error);
      reject(error);
    }
  });
}

/**
 * 📁 יצירה או קבלת תיקיית היעד
 */
async function getOrCreateTargetFolder(taskId) {
  try {
    // אם יש cache של תיקיית הבסיס
    if (!folderCache) {
      // חיפוש תיקיית הבסיס
      const searchResponse = await gapi.client.drive.files.list({
        q: `name='${DRIVE_CONFIG.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (searchResponse.result.files.length > 0) {
        folderCache = searchResponse.result.files[0].id;
      } else {
        // יצירת תיקיית בסיס
        const createResponse = await gapi.client.drive.files.create({
          resource: {
            name: DRIVE_CONFIG.folderName,
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });

        folderCache = createResponse.result.id;
      }
    }

    // יצירת תיקייה למשימה הספציפית
    const taskFolderName = `${taskId}_${new Date().getTime()}`;
    const createTaskFolder = await gapi.client.drive.files.create({
      resource: {
        name: taskFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderCache]
      },
      fields: 'id, webViewLink'
    });

    const folderId = createTaskFolder.result.id;

    // הגדרת הרשאות צפייה לכולם עם הקישור
    await gapi.client.drive.permissions.create({
      fileId: folderId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return createTaskFolder.result;

  } catch (error) {
    console.error('❌ שגיאה ביצירת תיקייה:', error);
    throw error;
  }
}

/**
 * 📤 העלאה ישירה של קובץ ל-Drive
 */
async function uploadFileToDrive(file, folderId, onProgress) {
  try {
    // בדיקת גודל קובץ
    if (file.size > DRIVE_CONFIG.maxFileSize) {
      throw new Error(`הקובץ ${file.name} גדול מדי. מקסימום: ${DRIVE_CONFIG.maxFileSize / 1024 / 1024}MB`);
    }

    console.log(`📤 מעלה קובץ: ${file.name} (${formatFileSize(file.size)})`);

    // יצירת metadata
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [folderId]
    };

    // יצירת form data
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // העלאה עם progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // מעקב אחר התקדמות
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete, file.name);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);

          // הגדרת הרשאות
          try {
            await gapi.client.drive.permissions.create({
              fileId: result.id,
              resource: {
                role: 'reader',
                type: 'anyone'
              }
            });
          } catch (permError) {
            console.warn('⚠️ לא ניתן להגדיר הרשאות:', permError);
          }

          // קבלת URL לצפייה
          const fileDetails = await gapi.client.drive.files.get({
            fileId: result.id,
            fields: 'webViewLink, webContentLink'
          });

          console.log(`✅ קובץ הועלה: ${file.name}`);

          resolve({
            id: result.id,
            name: file.name,
            url: fileDetails.result.webViewLink,
            downloadUrl: fileDetails.result.webContentLink
          });
        } else {
          reject(new Error(`שגיאה בהעלאה: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('שגיאת רשת בהעלאה'));
      });

      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(form);
    });

  } catch (error) {
    console.error('❌ שגיאה בהעלאת קובץ:', error);
    throw error;
  }
}

/**
 * 🎯 פונקציה ראשית - העלאת כל הקבצים
 */
async function uploadAllFiles(files, taskId) {
  try {
    console.log(`🚀 מתחיל העלאה של ${files.length} קבצים...`);

    // בדיקה שהמערכת מוכנה
    if (!gapiLoaded || !gisLoaded) {
      throw new Error('המערכת עדיין טוענת, אנא נסה שוב בעוד רגע');
    }

    // קבלת הרשאת גישה
    showUploadStatus('מבקש הרשאת גישה...', 0);
    await requestAccessToken();

    // יצירת תיקיית יעד
    showUploadStatus('יוצר תיקייה...', 10);
    const folder = await getOrCreateTargetFolder(taskId);

    // העלאת קבצים במקביל
    const uploadPromises = [];
    const uploadedFiles = [];
    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const uploadPromise = uploadFileToDrive(file, folder.id, (percent, fileName) => {
        completedCount++;
        const totalProgress = 10 + Math.round((completedCount / files.length) * 80);
        showUploadStatus(`מעלה: ${fileName} (${percent}%)`, totalProgress);
      }).then(result => {
        uploadedFiles.push(result);
        console.log(`✅ ${result.name} הועלה בהצלחה`);
      });

      uploadPromises.push(uploadPromise);
    }

    // המתנה לכל ההעלאות
    await Promise.all(uploadPromises);

    showUploadStatus('כל הקבצים הועלו בהצלחה!', 100);

    console.log(`✅ סיימתי להעלות ${uploadedFiles.length} קבצים`);

    return {
      folderUrl: folder.webViewLink,
      files: uploadedFiles
    };

  } catch (error) {
    console.error('❌ שגיאה בהעלאת קבצים:', error);
    showUploadStatus('שגיאה בהעלאה: ' + error.message, 0);
    throw error;
  }
}

/**
 * 📊 הצגת סטטוס העלאה
 */
function showUploadStatus(message, percent) {
  const progressContainer = document.querySelector('.upload-progress-container');
  const progressBar = document.querySelector('.upload-progress-bar');
  const statusText = document.getElementById('upload-status-text');

  if (progressContainer) {
    progressContainer.style.display = 'block';
  }

  if (progressBar) {
    progressBar.style.width = percent + '%';
  }

  if (statusText) {
    statusText.textContent = message;
  }

  console.log(`📊 ${message} - ${percent}%`);
}

/**
 * 🔧 פורמט גודל קובץ
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

// 🚀 אתחול אוטומטי כשהדף נטען
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDriveUploader);
} else {
  initDriveUploader();
}

/**
 * 🌐 ייצוא לשימוש גלובלי
 */
window.DriveUploader = {
  upload: uploadAllFiles,
  init: initDriveUploader,
  isReady: () => gapiLoaded && gisLoaded
};
