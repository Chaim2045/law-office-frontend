// ================================================
// Modern Form Handler - Google Apps Script Integration
// ================================================

// Utility Functions
const Utils = {
  validateRequired: function(value, fieldName) {
    if (!value || value.trim() === '') {
      return {
        valid: false,
        message: `יש למלא את השדה: ${fieldName}`
      };
    }
    return { valid: true };
  },

  validateEmail: function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  formatDate: function(date, format = 'short') {
    const options = format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('he-IL', options).format(date);
  },

  showToast: function(message, type = 'info') {
    // Simple alert for now - can be enhanced later
    if (type === 'error' || type === 'warning') {
      alert(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  },

  showLoading: function(button, text) {
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
  },

  hideLoading: function(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

function initModernForm() {
  // DEBUG - temporary
  var _d = document.createElement('div');
  _d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:4px 8px;font-size:11px;z-index:99999;text-align:center;direction:ltr;';
  var _auth = window.auth ? window.auth.isAuthenticated() : 'NO_AUTH';
  var _usr = (window.auth && window.auth.getCurrentUser()) ? window.auth.getCurrentUser().name : 'null';
  var _chips = document.querySelector('.form-step[data-step="1"] .name-chips');
  var _nav = document.querySelectorAll('.bottom-nav-item').length;
  var _card = document.getElementById('newTaskCard') ? 'Y' : 'N';
  var _sect = document.getElementById('myTasksSection') ? 'Y' : 'N';
  _d.textContent = 'v2.2 | nav=' + _nav + ' | card=' + _card + ' | sect=' + _sect + ' | chips=' + (_chips ? 'FOUND' : 'NULL');
  document.body.appendChild(_d);

  // בדיקת חיבור -- redirect ללוגין אם לא מחובר
  if (window.auth && !window.auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // קבלת רכיבים
  const taskForm = document.getElementById('taskForm');
  const stepper = document.querySelector('.stepper');
  const steps = document.querySelectorAll('.step');
  const formSteps = document.querySelectorAll('.form-step');
  const successModal = document.getElementById('successModal');
  const successCloseBtn = document.getElementById('successCloseBtn');
  const nameChips = document.querySelectorAll('.name-chip');
  const requesterName = document.getElementById('requesterName');
  const requesterEmail = document.getElementById('requesterEmail');
  const customEmailGroup = document.getElementById('customEmailGroup');
  const customEmail = document.getElementById('customEmail');
  const priorityConfirmModal = document.getElementById('priorityConfirmModal');
  const priorityConfirmCancel = document.getElementById('priorityConfirmCancel');
  const priorityConfirmOk = document.getElementById('priorityConfirmOk');
  const priorityHighOption = document.getElementById('priority3');

  // קבצים מצורפים
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  let selectedFiles = [];

  // ניהול משתמש
  const userMenu = document.getElementById('userMenu');
  const userMenuDropdown = document.getElementById('userMenuDropdown');
  const userAvatar = document.getElementById('userAvatar');
  const currentUserName = document.getElementById('currentUserName');
  const switchUserBtn = document.getElementById('switchUserBtn');
  const userSwitchModal = document.getElementById('userSwitchModal');
  const userSwitchChips = document.getElementById('userSwitchChips');
  const confirmUserBtn = document.getElementById('confirmUserBtn');

  // Initialize user system
  initUserSystem();

  // ================================================
  // פונקציות ניהול משתמשים
  // ================================================

  function initUserSystem() {
    // אם מחובר דרך auth -- נעילת זהות
    if (window.auth && window.auth.isAuthenticated()) {
      const authUser = window.auth.getCurrentUser();
      setCurrentUser(authUser.name, authUser.email);

      // מילוי אוטומטי ונעילת שלב 1
      requesterName.value = authUser.name;
      requesterEmail.value = authUser.email;
      requesterName.readOnly = true;
      requesterName.style.background = '#f5f5f5';

      // הסתרת name chips בטופס
      const formChips = document.querySelector('.form-step[data-step="1"] .name-chips');
      if (formChips) formChips.style.display = 'none';

      // הסתרת hint ושדה אימייל מותאם
      const hint = document.querySelector('.form-step[data-step="1"] .form-hint');
      if (hint) hint.style.display = 'none';
      if (customEmailGroup) customEmailGroup.style.display = 'none';
    } else {
      // fallback -- משתמש לא מחובר, טוען מ-localStorage
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user.name, user.email);
      }
    }

    // User menu dropdown toggle
    if (userMenu && userMenuDropdown) {
      userMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('active');
      });

      document.addEventListener('click', function() {
        userMenuDropdown.classList.remove('active');
      });
    }

    // Switch user button -> logout and redirect to login
    if (switchUserBtn) {
      switchUserBtn.addEventListener('click', function() {
        if (window.auth) {
          window.auth.logout();
        } else {
          localStorage.removeItem('currentUser');
          window.location.href = 'login.html';
        }
      });
    }
  }

  function setCurrentUser(name, email) {
    if (currentUserName) {
      currentUserName.textContent = name;
    }

    if (userAvatar) {
      const firstChar = name.trim().charAt(0);
      userAvatar.textContent = firstChar || '?';
    }

    localStorage.setItem('currentUser', JSON.stringify({
      name: name,
      email: email
    }));
  }

  // ================================================
  // ניווט בשלבים (Steps Navigation)
  // ================================================

  document.getElementById('nextToStep2').addEventListener('click', function() {
    if (validateStep1()) {
      goToStep(2);
    }
  });

  document.getElementById('backToStep1').addEventListener('click', function() {
    goToStep(1);
  });

  document.getElementById('nextToStep3').addEventListener('click', function() {
    if (validateStep2()) {
      goToStep(3);
    }
  });

  document.getElementById('backToStep2').addEventListener('click', function() {
    goToStep(2);
  });

  document.getElementById('nextToStep4').addEventListener('click', function() {
    updatePreview();
    goToStep(4);
  });

  document.getElementById('backToStep3').addEventListener('click', function() {
    goToStep(3);
  });

  // התקדמות אוטומטית אחרי בחירת שם (רק אם השדה לא נעול)
  requesterName.addEventListener('blur', function() {
    if (this.readOnly) return;
    if (this.value.trim() !== '' && customEmailGroup.style.display === 'none') {
      setTimeout(() => {
        document.getElementById('nextToStep2').click();
      }, 300);
    }
  });

  /**
   * מעבר בין שלבים
   */
  function goToStep(stepNumber) {
    stepper.setAttribute('data-step', stepNumber);

    steps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.remove('active', 'completed');

      if (stepNum < stepNumber) {
        step.classList.add('completed');
      } else if (stepNum === stepNumber) {
        step.classList.add('active');
      }
    });

    formSteps.forEach(formStep => {
      formStep.classList.remove('active');
    });

    document.querySelector(`.form-step[data-step="${stepNumber}"]`).classList.add('active');
  }

  // ================================================
  // וולידציות (Validations)
  // ================================================

  function validateStep1() {
    const nameValidation = Utils.validateRequired(requesterName.value, 'שם המבקש');
    if (!nameValidation.valid) {
      Utils.showToast(nameValidation.message, 'warning');
      requesterName.focus();
      return false;
    }

    // בדיקה אם נדרש אימייל מותאם
    if (customEmailGroup.style.display !== 'none') {
      const emailValue = customEmail.value.trim();
      if (!emailValue) {
        Utils.showToast('יש להזין אימייל עבור משתמש חדש', 'warning');
        customEmail.focus();
        return false;
      }

      if (!Utils.validateEmail(emailValue)) {
        Utils.showToast('כתובת האימייל אינה תקינה', 'warning');
        customEmail.focus();
        return false;
      }
    }

    return true;
  }

  function validateStep2() {
    const descriptionEl = document.getElementById('taskDescription');
    const descValidation = Utils.validateRequired(descriptionEl.value, 'תיאור המשימה');
    if (!descValidation.valid) {
      Utils.showToast(descValidation.message, 'warning');
      descriptionEl.focus();
      return false;
    }

    const categoryEl = document.getElementById('taskCategory');
    const categoryValidation = Utils.validateRequired(categoryEl.value, 'סיווג המשימה');
    if (!categoryValidation.valid) {
      Utils.showToast(categoryValidation.message, 'warning');
      categoryEl.focus();
      return false;
    }

    const dueDateEl = document.getElementById('dueDate');
    const dateValidation = Utils.validateRequired(dueDateEl.value, 'תאריך יעד');
    if (!dateValidation.valid) {
      Utils.showToast(dateValidation.message, 'warning');
      dueDateEl.focus();
      return false;
    }

    return true;
  }

  function validateAllFields() {
    if (!validateStep1()) return false;
    if (!validateStep2()) return false;
    return true;
  }

  // ================================================
  // עדכון תצוגת אישור (Preview)
  // ================================================

  function updatePreview() {
    document.getElementById('previewName').textContent = requesterName.value;

    const emailValue = requesterEmail.value;
    const previewEmailItem = document.getElementById('previewEmailItem');
    if (emailValue) {
      document.getElementById('previewEmail').textContent = emailValue;
      previewEmailItem.classList.remove('hidden');
    } else {
      previewEmailItem.classList.add('hidden');
    }

    document.getElementById('previewDescription').textContent =
      document.getElementById('taskDescription').value;

    document.getElementById('previewCategory').textContent =
      document.getElementById('taskCategory').value;

    // Format date using Utils
    const dueDateValue = document.getElementById('dueDate').value;
    const formattedDate = Utils.formatDate(new Date(dueDateValue), 'long');
    document.getElementById('previewDueDate').textContent = formattedDate;

    // Priority display
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const priorityElement = document.getElementById('previewPriority');
    priorityElement.textContent = priority;

    // Apply priority classes
    priorityElement.className = 'summary-value priority';
    if (priority === 'רגילה') {
      priorityElement.classList.add('normal');
    } else if (priority === 'גבוהה') {
      priorityElement.classList.add('medium');
    } else if (priority === 'דחופה') {
      priorityElement.classList.add('high');
    }

    // Files preview
    var previewFilesItem = document.getElementById('previewFilesItem');
    var previewFiles = document.getElementById('previewFiles');
    if (previewFilesItem && previewFiles) {
      if (selectedFiles.length > 0) {
        previewFilesItem.style.display = '';
        previewFiles.innerHTML = '<i class="fas fa-paperclip"></i> ' +
          selectedFiles.length + ' קבצים: ' +
          selectedFiles.map(function(f) { return f.name; }).join(', ');
        previewFiles.className = 'summary-value files';
      } else {
        previewFilesItem.style.display = 'none';
      }
    }
  }

  // ================================================
  // טיפול בכפתורי שמות (Name Chips)
  // ================================================

  nameChips.forEach(button => {
    button.addEventListener('click', function() {
      nameChips.forEach(btn => btn.classList.remove('selected'));
      this.classList.add('selected');

      requesterName.value = this.getAttribute('data-name');
      requesterEmail.value = this.getAttribute('data-email');
      customEmailGroup.style.display = 'none';
      customEmail.value = '';
    });
  });

  // בדיקת שם בקלט - auto-match with chips
  requesterName.addEventListener('input', function() {
    const inputValue = this.value.toLowerCase();
    let matchFound = false;

    nameChips.forEach(btn => {
      const chipName = btn.getAttribute('data-name').toLowerCase();
      if (chipName === inputValue) {
        btn.classList.add('selected');
        requesterEmail.value = btn.getAttribute('data-email');
        matchFound = true;
      } else {
        btn.classList.remove('selected');
      }
    });

    if (!matchFound) {
      customEmailGroup.style.display = 'block';
      requesterEmail.value = customEmail.value;
    } else {
      customEmailGroup.style.display = 'none';
    }
  });

  // טיפול באימייל מותאם
  customEmail.addEventListener('input', function() {
    requesterEmail.value = this.value;
  });

  // ================================================
  // בדיקת דחיפות גבוהה (Priority Confirmation)
  // ================================================

  priorityHighOption.addEventListener('change', function() {
    if (this.checked) {
      priorityConfirmModal.classList.add('active');
    }
  });

  priorityConfirmCancel.addEventListener('click', function() {
    document.getElementById('priority1').checked = true;
    priorityConfirmModal.classList.remove('active');
  });

  priorityConfirmOk.addEventListener('click', function() {
    priorityConfirmModal.classList.remove('active');
  });

  // ================================================
  // טיפול בקבצים מצורפים
  // ================================================

  if (fileUploadArea && fileInput) {
    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });

    fileUploadArea.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });

    fileUploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });

    // Click to select
    fileInput.addEventListener('change', function() {
      handleFiles(this.files);
      this.value = ''; // allow re-selecting same file
    });
  }

  function handleFiles(files) {
    for (var i = 0; i < files.length; i++) {
      if (selectedFiles.length >= MAX_FILES) {
        Utils.showToast('ניתן לצרף עד ' + MAX_FILES + ' קבצים', 'warning');
        break;
      }
      if (files[i].size > MAX_FILE_SIZE) {
        Utils.showToast('הקובץ "' + files[i].name + '" גדול מ-10MB', 'warning');
        continue;
      }
      selectedFiles.push(files[i]);
    }
    renderFileList();
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
  }

  function getFileIcon(fileName) {
    var ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return { icon: 'fa-file-pdf', cls: 'pdf' };
    if (['doc', 'docx', 'rtf'].indexOf(ext) !== -1) return { icon: 'fa-file-word', cls: 'doc' };
    if (['xls', 'xlsx'].indexOf(ext) !== -1) return { icon: 'fa-file-excel', cls: 'xls' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].indexOf(ext) !== -1) return { icon: 'fa-file-image', cls: 'img' };
    return { icon: 'fa-file', cls: 'other' };
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = '';
    selectedFiles.forEach(function(file, index) {
      var fi = getFileIcon(file.name);
      var item = document.createElement('div');
      item.className = 'file-item';

      var iconDiv = document.createElement('div');
      iconDiv.className = 'file-item-icon ' + fi.cls;
      iconDiv.innerHTML = '<i class="fas ' + fi.icon + '"></i>';

      var infoDiv = document.createElement('div');
      infoDiv.className = 'file-item-info';
      var nameDiv = document.createElement('div');
      nameDiv.className = 'file-item-name';
      nameDiv.textContent = file.name;
      var sizeDiv = document.createElement('div');
      sizeDiv.className = 'file-item-size';
      sizeDiv.textContent = formatFileSize(file.size);
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(sizeDiv);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'file-item-remove';
      removeBtn.setAttribute('data-index', index);
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';

      item.appendChild(iconDiv);
      item.appendChild(infoDiv);
      item.appendChild(removeBtn);
      fileList.appendChild(item);
    });

    // Attach remove handlers
    fileList.querySelectorAll('.file-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeFile(parseInt(this.getAttribute('data-index')));
      });
    });
  }

  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() {
        // Remove the data:...;base64, prefix
        var base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ================================================
  // טיפול בטופס - שליחה ל-API
  // ================================================

  taskForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    // Show loading state
    Utils.showLoading(submitButton, 'שולח...');

    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(
        localStorage.getItem('currentUser') ||
        '{"name":"מערכת","email":"office@ghlawoffice.co.il"}'
      );

      // יצירת אובייקט המשימה
      const taskData = {
        title: requesterName.value + ': ' +
               document.getElementById('taskDescription').value.substring(0, 100),
        description: document.getElementById('taskDescription').value,
        category: document.getElementById('taskCategory').value,
        assigned_to: "שני",  // כל המשימות מוטלות על שני (המזכירה)
        assigned_to_email: "office@ghlawoffice.co.il",
        created_by: requesterName.value,  // שם המבקש
        created_by_email: requesterEmail.value || customEmail.value,
        due_date: document.getElementById('dueDate').value || null,
        priority: document.querySelector('input[name="priority"]:checked').value,
        notes: null
      };

      // שליחת המשימה דרך Google Apps Script
      // הסקריפט מצפה לשדות בעברית כפי שהוגדר בקוד המקורי
      const formData = new FormData();
      formData.append('requesterName', taskData.created_by);
      formData.append('requesterEmail', taskData.created_by_email);
      formData.append('taskDescription', taskData.description);
      formData.append('taskCategory', taskData.category);
      formData.append('dueDate', taskData.due_date || '');
      formData.append('priority', taskData.priority);

      // צירוף קבצים כ-base64
      if (selectedFiles.length > 0) {
        formData.append('numFiles', selectedFiles.length);
        for (let i = 0; i < selectedFiles.length; i++) {
          const base64 = await fileToBase64(selectedFiles[i]);
          formData.append('fileName' + i, selectedFiles[i].name);
          formData.append('fileType' + i, selectedFiles[i].type);
          formData.append('fileContent' + i, base64);
        }
      }

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.status || data.status !== 'success') {
        throw new Error(data.message || 'שגיאה בשליחת המשימה');
      }

      // הצלחה!
      if (window.Utils && typeof window.Utils.showToast === 'function') {
        Utils.showToast('המשימה נשלחה בהצלחה!', 'success');
      }

      // Show success modal
      successModal.classList.add('active');

      // Display task ID if available
      if (data.taskId || data.task_id) {
        document.getElementById('taskIdDisplay').textContent =
          `מזהה משימה: ${data.taskId || data.task_id}`;
      }

      // Reset form
      resetForm();

    } catch (error) {
      console.error('Error creating task:', error);
      // Error toast is already shown by API Service
      // But we can add more context if needed
      Utils.showToast('אירעה שגיאה בשליחת המשימה', 'error');
    } finally {
      // Hide loading state
      Utils.hideLoading(submitButton, originalText);
    }
  });

  // ================================================
  // Success Modal - Close Handler
  // ================================================

  successCloseBtn.addEventListener('click', function() {
    successModal.classList.remove('active');
    resetForm();
  });

  // ================================================
  // Helper Functions
  // ================================================

  /**
   * Reset form to initial state
   */
  function resetForm() {
    taskForm.reset();
    nameChips.forEach(btn => btn.classList.remove('selected'));
    customEmailGroup.style.display = 'none';
    selectedFiles = [];
    renderFileList();
    goToStep(1);
  }

}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModernForm);
} else {
  initModernForm();
}
