// ================================================
// Modern Form Handler - Connected to Rust API
// Adapted from original secretary interface
// ================================================

document.addEventListener('DOMContentLoaded', function() {
  // קבלת רכיבים
  const taskForm = document.getElementById('taskForm');
  const stepper = document.querySelector('.stepper');
  const steps = document.querySelectorAll('.step');
  const formSteps = document.querySelectorAll('.form-step');
  const notification = document.getElementById('notification');
  const notificationIcon = document.getElementById('notificationIcon');
  const notificationTitle = document.getElementById('notificationTitle');
  const notificationMessage = document.getElementById('notificationMessage');
  const notificationClose = document.getElementById('notificationClose');
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

  // פונקציות ניהול משתמשים
  function initUserSystem() {
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user.name, user.email);
    } else {
      userSwitchModal.classList.add('active');
    }

    userMenu.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenuDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function() {
      userMenuDropdown.classList.remove('active');
    });

    switchUserBtn.addEventListener('click', function() {
      userSwitchModal.classList.add('active');
    });

    userSwitchChips.querySelectorAll('.name-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        userSwitchChips.querySelectorAll('.name-chip').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
      });
    });

    confirmUserBtn.addEventListener('click', function() {
      const selectedChip = userSwitchChips.querySelector('.name-chip.selected');
      if (selectedChip) {
        const userName = selectedChip.getAttribute('data-name');
        const userEmail = selectedChip.getAttribute('data-email');

        setCurrentUser(userName, userEmail);
        userSwitchModal.classList.remove('active');

        nameChips.forEach(chip => {
          if (chip.getAttribute('data-name') === userName) {
            chip.click();
          }
        });

        showNotification('המשתמש הוחלף ל-' + userName, 'info');
      } else {
        showNotification('נא לבחור משתמש', 'warning');
      }
    });
  }

  function setCurrentUser(name, email) {
    currentUserName.textContent = name;
    const firstChar = name.trim().charAt(0);
    userAvatar.textContent = firstChar || '?';

    localStorage.setItem('currentUser', JSON.stringify({
      name: name,
      email: email
    }));
  }

  notificationClose.addEventListener('click', function() {
    notification.style.display = 'none';
  });

  // פונקציה להצגת התראות
  function showNotification(message, type = 'info') {
    notificationIcon.className = `notification-icon ${type}`;
    notificationIcon.innerHTML = type === 'warning' ?
      '<i class="fas fa-exclamation-triangle"></i>' :
      '<i class="fas fa-info-circle"></i>';

    notificationTitle.textContent = type === 'warning' ? 'שגיאה' : 'הודעה';
    notificationMessage.textContent = message;

    notification.style.display = 'flex';

    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }

  // ניווט בשלבים
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

  // התקדמות אוטומטית
  requesterName.addEventListener('blur', function() {
    if (this.value.trim() !== '' && customEmailGroup.style.display === 'none') {
      setTimeout(() => {
        document.getElementById('nextToStep2').click();
      }, 300);
    }
  });

  // פונקציה למעבר בין שלבים
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

  // וולידציות
  function validateStep1() {
    if (!requesterName.value.trim()) {
      showNotification('יש להזין שם מבקש', 'warning');
      requesterName.focus();
      return false;
    }

    if (customEmailGroup.style.display !== 'none' && !customEmail.value) {
      showNotification('יש להזין אימייל עבור משתמש חדש', 'warning');
      customEmail.focus();
      return false;
    }

    return true;
  }

  function validateStep2() {
    if (!document.getElementById('taskDescription').value.trim()) {
      showNotification('יש להזין תיאור משימה', 'warning');
      document.getElementById('taskDescription').focus();
      return false;
    }

    if (!document.getElementById('taskCategory').value) {
      showNotification('יש לבחור סיווג משימה', 'warning');
      document.getElementById('taskCategory').focus();
      return false;
    }

    if (!document.getElementById('dueDate').value) {
      showNotification('יש לבחור תאריך יעד', 'warning');
      document.getElementById('dueDate').focus();
      return false;
    }

    return true;
  }

  function validateAllFields() {
    if (!validateStep1()) return false;
    if (!validateStep2()) return false;
    return true;
  }

  // עדכון תצוגת אישור
  function updatePreview() {
    document.getElementById('previewName').textContent = requesterName.value;

    if (requesterEmail.value) {
      document.getElementById('previewEmail').textContent = requesterEmail.value;
      document.getElementById('previewEmailItem').classList.remove('hidden');
    } else {
      document.getElementById('previewEmailItem').classList.add('hidden');
    }

    document.getElementById('previewDescription').textContent = document.getElementById('taskDescription').value;
    document.getElementById('previewCategory').textContent = document.getElementById('taskCategory').value;

    const dueDate = new Date(document.getElementById('dueDate').value);
    const formattedDate = dueDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('previewDueDate').textContent = formattedDate;

    const priority = document.querySelector('input[name="priority"]:checked').value;
    const priorityElement = document.getElementById('previewPriority');
    priorityElement.textContent = priority;

    priorityElement.className = 'summary-value priority';
    if (priority === 'רגילה') {
      priorityElement.classList.add('normal');
    } else if (priority === 'גבוהה') {
      priorityElement.classList.add('medium');
    } else if (priority === 'דחופה') {
      priorityElement.classList.add('high');
    }
  }

  // טיפול בכפתורי שמות
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

  // בדיקת שם בקלט
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

  // בדיקת דחיפות גבוהה
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

  // טיפול בטופס - שליחה ל-API Rust
  taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שולח...';
    submitButton.disabled = true;

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"מערכת","email":"office@ghlawoffice.co.il"}');

    // יצירת אובייקט המשימה עבור Rust API
    const taskData = {
      title: requesterName.value + ': ' + document.getElementById('taskDescription').value.substring(0, 100),
      description: document.getElementById('taskDescription').value,
      category: document.getElementById('taskCategory').value,
      assigned_to: "שני",  // כל המשימות מוטלות על שני (המזכירה)
      assigned_to_email: "office@ghlawoffice.co.il",  // אימייל של שני
      created_by: requesterName.value,  // שם המבקש (חיים, גיא, רועי וכו')
      created_by_email: requesterEmail.value || customEmail.value,  // אימייל המבקש
      due_date: document.getElementById('dueDate').value || null,
      priority: document.querySelector('input[name="priority"]:checked').value,
      notes: null
    };

    // שליחת המשימה ל-Rust API
    fetch(`${window.API_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        // הצגת הודעת הצלחה
        successModal.classList.add('active');

        // Display task ID if available
        if (data.task_id) {
          document.getElementById('taskIdDisplay').textContent = `מזהה משימה: ${data.task_id}`;
        }

        // איפוס הטופס
        taskForm.reset();
        nameChips.forEach(btn => btn.classList.remove('selected'));
        customEmailGroup.style.display = 'none';

        goToStep(1);

        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification(`אירעה שגיאה בשליחת המשימה: ${error.message}`, 'warning');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      });
  });

  successCloseBtn.addEventListener('click', function() {
    successModal.classList.remove('active');

    taskForm.reset();
    nameChips.forEach(btn => btn.classList.remove('selected'));
    customEmailGroup.style.display = 'none';
    goToStep(1);
  });
});
