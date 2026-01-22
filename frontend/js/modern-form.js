// ================================================
// Modern Form Handler - Refactored with Utils & API Service
// Using centralized utilities and API calls
// ================================================

document.addEventListener('DOMContentLoaded', function() {
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
    const savedUser = localStorage.getItem('currentUser');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user.name, user.email);
    } else {
      // No user - show selection modal
      if (userSwitchModal) {
        userSwitchModal.classList.add('active');
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

    // Switch user button
    if (switchUserBtn && userSwitchModal) {
      switchUserBtn.addEventListener('click', function() {
        userSwitchModal.classList.add('active');
      });
    }

    // User selection chips
    if (userSwitchChips) {
      userSwitchChips.querySelectorAll('.name-chip').forEach(chip => {
        chip.addEventListener('click', function() {
          userSwitchChips.querySelectorAll('.name-chip').forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
        });
      });
    }

    // Confirm user selection
    if (confirmUserBtn && userSwitchChips) {
      confirmUserBtn.addEventListener('click', function() {
        const selectedChip = userSwitchChips.querySelector('.name-chip.selected');
        if (selectedChip) {
          const userName = selectedChip.getAttribute('data-name');
          const userEmail = selectedChip.getAttribute('data-email');

          setCurrentUser(userName, userEmail);
          userSwitchModal.classList.remove('active');

          // Auto-select corresponding chip in main form
          nameChips.forEach(chip => {
            if (chip.getAttribute('data-name') === userName) {
              chip.click();
            }
          });

          Utils.showToast(`המשתמש הוחלף ל-${userName}`, 'info');
        } else {
          Utils.showToast('נא לבחור משתמש', 'warning');
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

  // התקדמות אוטומטית אחרי בחירת שם
  requesterName.addEventListener('blur', function() {
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
      const formData = new FormData();
      formData.append('title', taskData.title);
      formData.append('description', taskData.description);
      formData.append('category', taskData.category);
      formData.append('assigned_to', taskData.assigned_to);
      formData.append('assigned_to_email', taskData.assigned_to_email);
      formData.append('created_by', taskData.created_by);
      formData.append('created_by_email', taskData.created_by_email);
      formData.append('due_date', taskData.due_date || '');
      formData.append('priority', taskData.priority);

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
    goToStep(1);
  }

});
