// ================================================
// Modern Dashboard Handler - Office Manager & Users
// ================================================

let allTasks = [];
let filteredTasks = [];
let lastRefreshTime = null;
let currentTab = 'active'; // 'active' or 'completed'

// Office Manager email addresses - these users see ALL tasks and can update them
const OFFICE_MANAGER_EMAILS = [
  'office@ghlawoffice.co.il',  // שני
  'miri@ghlawoffice.co.il'     // מירי
];

// Check if current user is office manager
function isOfficeManager() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"email":"guest@ghlawoffice.co.il"}');
  return OFFICE_MANAGER_EMAILS.includes(currentUser.email.toLowerCase());
}

// ================================================
// Initialization
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 דשבורד ניהול משימות - טוען...');
  initializeUser();
  setupEventListeners();
  setupTabs();
  loadTasks();

  // Auto-refresh every 60 seconds
  setInterval(() => {
    loadTasks(true); // Silent refresh
  }, 60000);
});

// ================================================
// User Management
// ================================================

function initializeUser() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"אורח","email":"guest@ghlawoffice.co.il"}');

  document.getElementById('currentUserName').textContent = currentUser.name;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);

  // Update page title and role based on user
  const pageTitle = document.getElementById('dashboardTitle');
  const pageSubtitle = document.getElementById('dashboardSubtitle');
  const userRole = document.querySelector('.user-role');

  if (pageTitle && pageSubtitle) {
    if (isOfficeManager()) {
      pageTitle.textContent = 'דשבורד מנהלת משרד';
      pageSubtitle.textContent = 'ניהול כל המשימות במשרד';
      if (userRole) userRole.textContent = 'מנהלת משרד';
    } else {
      pageTitle.textContent = `דשבורד - ${currentUser.name}`;
      pageSubtitle.textContent = 'המשימות שלי';
      if (userRole) userRole.textContent = 'עורך דין';
    }
  }

  // User menu toggle
  const userMenu = document.getElementById('userMenu');
  const userMenuDropdown = document.getElementById('userMenuDropdown');

  userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenuDropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    userMenuDropdown.classList.remove('active');
  });

  // Switch user button
  document.getElementById('switchUserBtn').addEventListener('click', () => {
    userMenuDropdown.classList.remove('active');
    document.getElementById('userSwitchModal').classList.add('active');
  });

  // User switch chips
  document.querySelectorAll('#userSwitchChips .name-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.name;
      const email = chip.dataset.email;

      localStorage.setItem('currentUser', JSON.stringify({ name, email }));

      document.getElementById('currentUserName').textContent = name;
      document.getElementById('userAvatar').textContent = name.charAt(0);

      document.getElementById('userSwitchModal').classList.remove('active');

      // Update page title and reload tasks
      const pageTitle = document.querySelector('.card-title-clean');
      const pageSubtitle = document.querySelector('.card-subtitle-clean');

      if (pageTitle && pageSubtitle) {
        if (isOfficeManager()) {
          pageTitle.textContent = 'דשבורד מזכירה';
          pageSubtitle.textContent = 'ניהול כל המשימות במשרד';
        } else {
          pageTitle.textContent = `דשבורד - ${name}`;
          pageSubtitle.textContent = 'המשימות שלי';
        }
      }

      // Reload tasks for new user
      loadTasks();

      Utils.showToast(`התחבר כ-${name}`, 'success');
    });
  });
}

// ================================================
// Event Listeners
// ================================================

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadTasks();
    Utils.showToast('המשימות רוענו', 'success');
  });

  // Search input
  document.getElementById('searchInput').addEventListener('input', (e) => {
    applyFilters();
  });

  // Filters
  document.getElementById('statusFilter').addEventListener('change', applyFilters);
  document.getElementById('priorityFilter').addEventListener('change', applyFilters);
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);

  // Task modal close
  document.getElementById('closeTaskModal').addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('active');
  });

  document.getElementById('closeTaskModalBtn').addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('active');
  });

  // Close modal on overlay click
  document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') {
      document.getElementById('taskModal').classList.remove('active');
    }
  });

  // Create Task Modal - New Task Button
  const newTaskBtn = document.getElementById('newTaskBtn');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', openCreateTaskModal);
  }

  const newTaskMenuItem = document.getElementById('newTaskMenuItem');
  if (newTaskMenuItem) {
    newTaskMenuItem.addEventListener('click', openCreateTaskModal);
  }

  // Create Task Modal - Close buttons
  document.getElementById('closeCreateModal')?.addEventListener('click', () => {
    document.getElementById('createTaskModal').classList.remove('active');
  });

  document.getElementById('cancelCreateBtn')?.addEventListener('click', () => {
    document.getElementById('createTaskModal').classList.remove('active');
  });

  // Create Task Modal - Save button
  document.getElementById('saveCreateBtn')?.addEventListener('click', saveNewTask);

  // Close create modal on overlay click
  document.getElementById('createTaskModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'createTaskModal') {
      document.getElementById('createTaskModal').classList.remove('active');
    }
  });
}

// ================================================
// Load Tasks
// ================================================

async function loadTasks(silent = false) {
  const container = document.getElementById('tasksContainer');

  if (!silent) {
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>טוען משימות...</p></div>';
  }

  try {
    console.log(`📥 טוען משימות מ-API...`);

    // Use API Service instead of raw fetch
    const data = await window.api.getTasks();
    let tasks = Array.isArray(data) ? data : [];

    // Filter tasks based on user role
    if (isOfficeManager()) {
      // Secretary sees ALL tasks
      allTasks = tasks;
      console.log(`👑 מזכירה - מציג את כל ${tasks.length} המשימות`);
    } else {
      // Regular user sees only their own tasks
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      allTasks = tasks.filter(task =>
        task.created_by === currentUser.name ||
        task.created_by_email === currentUser.email
      );
      console.log(`👤 משתמש רגיל - מציג ${allTasks.length} מתוך ${tasks.length} משימות`);
    }

    filteredTasks = [...allTasks];

    lastRefreshTime = new Date();
    updateStatistics();
    applyFilters();

    console.log(`✅ נטענו ${allTasks.length} משימות בהצלחה`);

    if (!silent) {
      Utils.showToast(`נטענו ${allTasks.length} משימות`, 'success');
    }

  } catch (error) {
    console.error('❌ שגיאה בטעינת המשימות:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
        <p style="color: #6b7280; margin: var(--space-3) 0;">שגיאה בטעינת המשימות</p>
        <p style="font-size: var(--font-size-sm); color: #9ca3af; margin-bottom: var(--space-4);">${error.message}</p>
        <button class="btn btn-primary-clean" onclick="loadTasks()">
          <i class="fas fa-sync-alt"></i>
          נסה שוב
        </button>
      </div>
    `;

    if (!silent) {
      Utils.showToast('שגיאה בטעינת המשימות', 'error');
    }
  }
}

// ================================================
// Update Statistics
// ================================================

function updateStatistics() {
  const total = allTasks.length;
  const newTasks = allTasks.filter(t => t.status === 'חדשה').length;
  const inProgress = allTasks.filter(t => t.status === 'בטיפול').length;
  const completed = allTasks.filter(t => t.status === 'הושלמה').length;

  animateValue('totalTasks', total);
  animateValue('newTasks', newTasks);
  animateValue('inProgressTasks', inProgress);
  animateValue('completedTasks', completed);

  // Update tab badges
  if (typeof updateTabBadges === 'function') {
    updateTabBadges();
  }
}

function animateValue(elementId, value) {
  const element = document.getElementById(elementId);
  element.textContent = value;

  // Animate
  element.style.transform = 'scale(1.2)';
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 200);
}

// ================================================
// Apply Filters
// ================================================

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const priorityFilter = document.getElementById('priorityFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  filteredTasks = allTasks.filter(task => {
    // Tab filter - Active or Completed
    let tabMatch = true;
    if (currentTab === 'active') {
      // Active tasks: all except הושלמה and בוטלה
      tabMatch = task.status !== 'הושלמה' && task.status !== 'בוטלה';
    } else if (currentTab === 'completed') {
      // Completed tasks: הושלמה or בוטלה
      tabMatch = task.status === 'הושלמה' || task.status === 'בוטלה';
    }

    // Search filter
    const searchMatch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm) ||
      task.assigned_to.toLowerCase().includes(searchTerm) ||
      task.category.toLowerCase().includes(searchTerm) ||
      (task.description && task.description.toLowerCase().includes(searchTerm));

    // Status filter
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;

    // Priority filter
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;

    // Category filter
    const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;

    return tabMatch && searchMatch && statusMatch && priorityMatch && categoryMatch;
  });

  renderTasks();
  updateResultsCount();
}

// ================================================
// Update Results Count
// ================================================

function updateResultsCount() {
  const resultsCount = document.getElementById('resultsCount');
  const count = filteredTasks.length;
  const total = allTasks.length;

  if (count === total) {
    resultsCount.innerHTML = `<i class="fas fa-list"></i> מציג ${count} משימות`;
  } else {
    resultsCount.innerHTML = `<i class="fas fa-filter"></i> מציג ${count} מתוך ${total} משימות`;
  }
}

// ================================================
// Render Tasks
// ================================================

function renderTasks() {
  const container = document.getElementById('tasksContainer');

  if (filteredTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>לא נמצאו משימות</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');

  // Add click listeners
  document.querySelectorAll('.task-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      const task = filteredTasks[index];
      // Office manager goes directly to update modal
      if (isOfficeManager()) {
        openUpdateModal(task.id);
      } else {
        // Regular users see task details
        showTaskModal(task);
      }
    });
  });
}

// ================================================
// Create Task Card
// ================================================

function createTaskCard(task) {
  const createdDate = new Date(task.created_at).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const deadline = task.due_date || task.deadline;
  const deadlineText = deadline ? new Date(deadline).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'לא הוגדר';

  return `
    <div class="task-card priority-${task.priority}" data-task-id="${task.id}">
      <div class="task-header">
        <div class="task-id">${task.task_id || task.id.substring(0, 8)}</div>
        <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <span class="badge badge-status status-${task.status}">${task.status}</span>
          <span class="badge badge-priority priority-${task.priority}">${task.priority}</span>
        </div>
      </div>

      <h3 class="task-title">${task.title}</h3>

      ${task.description ? `<p class="task-description">${task.description}</p>` : ''}

      <div class="task-meta">
        <div class="task-meta-item">
          <i class="fas fa-user"></i>
          <span>${task.assigned_to}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-folder"></i>
          <span class="badge badge-category">${task.category}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-calendar"></i>
          <span>${deadlineText}</span>
        </div>
        <div class="task-meta-item">
          <i class="fas fa-clock"></i>
          <span>נוצר ${createdDate}</span>
        </div>
      </div>
    </div>
  `;
}

// ================================================
// Show Task Modal
// ================================================

function showTaskModal(task) {
  const modal = document.getElementById('taskModal');
  const content = document.getElementById('taskModalContent');

  const createdDate = new Date(task.created_at).toLocaleString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const deadline = task.due_date || task.deadline;
  const deadlineText = deadline ? new Date(deadline).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'לא הוגדר';

  content.innerHTML = `
    <div class="task-detail-grid">
      <div class="detail-item">
        <div class="detail-label">מזהה משימה</div>
        <div class="detail-value" style="font-family: 'Courier New', monospace; font-size: var(--font-size-sm);">
          ${task.task_id || task.id}
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">כותרת</div>
        <div class="detail-value large">${task.title}</div>
      </div>

      ${task.description ? `
        <div class="detail-item">
          <div class="detail-label">תיאור</div>
          <div class="detail-value">${task.description}</div>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
        <div class="detail-item">
          <div class="detail-label">סטטוס</div>
          <div class="detail-value">
            <span class="badge badge-status status-${task.status}">${task.status}</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-label">עדיפות</div>
          <div class="detail-value">
            <span class="badge badge-priority priority-${task.priority}">${task.priority}</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-label">קטגוריה</div>
          <div class="detail-value">
            <span class="badge badge-category">${task.category}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
        <div class="detail-item">
          <div class="detail-label"><i class="fas fa-user"></i> מוטל על</div>
          <div class="detail-value">${task.assigned_to}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label"><i class="fas fa-envelope"></i> אימייל</div>
          <div class="detail-value">${task.assigned_to_email || task.assigned_email}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
        <div class="detail-item">
          <div class="detail-label"><i class="fas fa-user-plus"></i> נוצר על ידי</div>
          <div class="detail-value">${task.created_by}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label"><i class="fas fa-calendar"></i> תאריך יעד</div>
          <div class="detail-value">${deadlineText}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label"><i class="fas fa-clock"></i> תאריך יצירה</div>
          <div class="detail-value">${createdDate}</div>
        </div>
      </div>
    </div>
  `;

  // Update footer with action button based on user role
  const modalFooter = modal.querySelector('.modal-footer');
  if (task.status === 'הוחזר להשלמה') {
    // User sees respond button for returned tasks
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" id="closeTaskModalBtn">סגור</button>
      <button class="btn btn-primary-clean" onclick="openRespondModal('${task.id}'); document.getElementById('taskModal').classList.remove('active');" style="background: #f59e0b; border-color: #f59e0b;">
        <i class="fas fa-reply"></i>
        הוסף פרטים נוספים
      </button>
    `;
  } else {
    // Regular user, just close button
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" id="closeTaskModalBtn">סגור</button>
    `;
  }

  modal.classList.add('active');
}

// ================================================
// Notification - Using Utils.showToast
// ================================================

// Removed Utils.showToast() - now using Utils.showToast() throughout the file

// ================================================
// Update Task Modal (Secretary Only)
// ================================================

let currentTaskBeingUpdated = null;

function openUpdateModal(taskId, event) {
  // Prevent card click event from firing
  if (event) {
    event.stopPropagation();
  }

  // Find the task
  const task = allTasks.find(t => t.id === taskId);
  if (!task) {
    Utils.showToast('משימה לא נמצאה', 'error');
    return;
  }

  currentTaskBeingUpdated = task;

  // Populate form
  document.getElementById('updateTaskId').value = taskId;
  document.getElementById('updateStatus').value = mapStatusToOldFormat(task.status);
  document.getElementById('updatePriority').value = task.priority || '';
  document.getElementById('updateNotes').value = task.secretary_notes || '';
  document.getElementById('updateCompletionDetails').value = task.completion_details || '';

  // Set current date and time for completion fields
  const now = new Date();
  document.getElementById('updateCompletionDate').value = now.toISOString().split('T')[0];
  document.getElementById('updateCompletionTime').value = now.toTimeString().slice(0, 5);

  // Show/hide completion fields based on status
  setupStatusChangeListener();

  // Show modal
  document.getElementById('updateTaskModal').classList.add('active');
}

function mapStatusToOldFormat(newStatus) {
  const statusMap = {
    'חדשה': 'ממתינה',
    'בטיפול': 'בביצוע',
    'הושלמה': 'בוצע',
    'בוטלה': 'בוטל'
  };
  return statusMap[newStatus] || newStatus;
}

function setupStatusChangeListener() {
  const statusSelect = document.getElementById('updateStatus');
  const completionDetailsGroup = document.getElementById('completionDetailsGroup');
  const completionDateTimeGroup = document.getElementById('completionDateTimeGroup');

  // Initial state
  toggleCompletionFields(statusSelect.value);

  // Listen for changes
  statusSelect.addEventListener('change', (e) => {
    toggleCompletionFields(e.target.value);
  });
}

function toggleCompletionFields(status) {
  const completionDetailsGroup = document.getElementById('completionDetailsGroup');
  const completionDateTimeGroup = document.getElementById('completionDateTimeGroup');

  if (status === 'בוצע') {
    completionDetailsGroup.style.display = 'block';
    completionDateTimeGroup.style.display = 'grid';
  } else {
    completionDetailsGroup.style.display = 'none';
    completionDateTimeGroup.style.display = 'none';
  }
}

// Close update modal
document.addEventListener('DOMContentLoaded', () => {
  const closeUpdateModal = () => {
    document.getElementById('updateTaskModal').classList.remove('active');
    currentTaskBeingUpdated = null;
  };

  document.getElementById('closeUpdateModal')?.addEventListener('click', closeUpdateModal);
  document.getElementById('cancelUpdateBtn')?.addEventListener('click', closeUpdateModal);

  // Close on overlay click
  document.getElementById('updateTaskModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'updateTaskModal') {
      closeUpdateModal();
    }
  });

  // Save update button
  document.getElementById('saveUpdateBtn')?.addEventListener('click', saveTaskUpdate);
});

async function saveTaskUpdate() {
  const taskId = document.getElementById('updateTaskId').value;
  const status = document.getElementById('updateStatus').value;
  const priority = document.getElementById('updatePriority').value;
  const notes = document.getElementById('updateNotes').value;
  const completionDetails = document.getElementById('updateCompletionDetails').value;
  const completionDate = document.getElementById('updateCompletionDate').value;
  const completionTime = document.getElementById('updateCompletionTime').value;

  if (!status) {
    Utils.showToast('יש לבחור סטטוס', 'error');
    return;
  }

  // Show loading state
  const saveBtn = document.getElementById('saveUpdateBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שומר...';
  saveBtn.disabled = true;

  try {
    // Prepare update data - only fields that were changed
    const updateData = {
      id: taskId,
      'סטטוס': status
    };

    // Add priority if changed
    if (priority) {
      updateData['דחיפות'] = priority;
    }

    // Add notes if provided
    if (notes.trim()) {
      updateData['הערות מזכירה'] = notes.trim();
    }

    // Add completion details if status is בוצע
    if (status === 'בוצע') {
      if (completionDetails.trim()) {
        updateData['פרטי ביצוע'] = completionDetails.trim();
      }
      if (completionDate) {
        updateData['תאריך השלמה'] = completionDate;
      }
      if (completionTime) {
        updateData['שעת השלמה'] = completionTime;
      }
    }

    console.log('📤 שולח עדכון למשימה:', updateData);

    // Send to API using API Service
    const result = await window.api.updateTask(taskId, updateData);
    console.log('✅ משימה עודכנה בהצלחה:', result);

    // Close modal
    document.getElementById('updateTaskModal').classList.remove('active');
    currentTaskBeingUpdated = null;

    // Show success message
    Utils.showToast('המשימה עודכנה בהצלחה', 'success');

    // Reload tasks to show updated data
    setTimeout(() => {
      loadTasks(true);
    }, 500);

  } catch (error) {
    console.error('❌ שגיאה בעדכון המשימה:', error);
    Utils.showToast(`שגיאה בעדכון המשימה: ${error.message}`, 'error');
  } finally {
    // Restore button state
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

// Make openUpdateModal available globally
window.openUpdateModal = openUpdateModal;

// ================================================
// Respond to Returned Task
// ================================================

function openRespondModal(taskId, event) {
  // Prevent card click event from firing
  if (event) {
    event.stopPropagation();
  }

  // Find the task
  const task = allTasks.find(t => t.id === taskId);
  if (!task) {
    Utils.showToast('משימה לא נמצאה', 'error');
    return;
  }

  // Set task ID
  document.getElementById('respondTaskId').value = taskId;
  document.getElementById('respondDetails').value = '';

  // Show modal
  document.getElementById('respondTaskModal').classList.add('active');
}

// Close respond modal
document.addEventListener('DOMContentLoaded', () => {
  const closeRespondModal = () => {
    document.getElementById('respondTaskModal').classList.remove('active');
  };

  document.getElementById('closeRespondModal')?.addEventListener('click', closeRespondModal);
  document.getElementById('cancelRespondBtn')?.addEventListener('click', closeRespondModal);

  // Close on overlay click
  document.getElementById('respondTaskModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'respondTaskModal') {
      closeRespondModal();
    }
  });

  // Save respond button
  document.getElementById('saveRespondBtn')?.addEventListener('click', saveTaskResponse);
});

async function saveTaskResponse() {
  const taskId = document.getElementById('respondTaskId').value;
  const details = document.getElementById('respondDetails').value;

  if (!details.trim()) {
    Utils.showToast('יש להזין פרטים נוספים', 'error');
    return;
  }

  // Show loading state
  const saveBtn = document.getElementById('saveRespondBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שולח...';
  saveBtn.disabled = true;

  try {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"email":"guest@ghlawoffice.co.il"}');

    // Get the current task to append to description
    const task = allTasks.find(t => t.id === taskId);
    const timestamp = new Date().toLocaleString('he-IL');

    // Update with new details and change status back to "חדשה" (waiting for office manager)
    const updateData = {
      id: taskId,
      'סטטוס': 'ממתינה',  // Return to waiting status
      'תיאור': task.description + `\n\n--- תגובה מ-${currentUser.name || currentUser.email} (${timestamp}) ---\n${details.trim()}`
    };

    console.log('📤 שולח תגובה למשימה:', updateData);

    // Send to API
    // Send to API using API Service
    const result = await window.api.updateTask(taskId, updateData);
    console.log('✅ תגובה נשלחה בהצלחה:', result);

    // Close modal
    document.getElementById('respondTaskModal').classList.remove('active');

    // Show success message
    Utils.showToast('התגובה נשלחה בהצלחה והמשימה הוחזרה למנהלת המשרד', 'success');

    // Reload tasks to show updated data
    setTimeout(() => {
      loadTasks(true);
    }, 500);

  } catch (error) {
    console.error('❌ שגיאה בשליחת התגובה:', error);
    Utils.showToast(`שגיאה בשליחת התגובה: ${error.message}`, 'error');
  } finally {
    // Restore button state
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

// Make openRespondModal available globally
window.openRespondModal = openRespondModal;

// ================================================
// Create New Task
// ================================================

function openCreateTaskModal() {
  const modal = document.getElementById('createTaskModal');
  const form = document.getElementById('createTaskForm');

  // Reset form
  form.reset();

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('createTaskDueDate').setAttribute('min', today);

  // Open modal
  modal.classList.add('active');

  // Close user menu dropdown if open
  const userMenuDropdown = document.getElementById('userMenuDropdown');
  if (userMenuDropdown) {
    userMenuDropdown.classList.remove('active');
  }
}

async function saveNewTask() {
  const saveBtn = document.getElementById('saveCreateBtn');
  const originalText = saveBtn.innerHTML;

  // Disable button and show loading
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> שולח...';

  try {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"אורח","email":"guest@ghlawoffice.co.il"}');

    // Get form values
    const description = document.getElementById('createTaskDescription').value.trim();
    const category = document.getElementById('createTaskCategory').value;
    const dueDate = document.getElementById('createTaskDueDate').value;
    const priority = document.querySelector('input[name="createPriority"]:checked')?.value || 'רגילה';

    // Validate required fields
    if (!description) {
      Utils.showToast('נא למלא את תיאור המשימה', 'error');
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      return;
    }

    if (!category) {
      Utils.showToast('נא לבחור סיווג משימה', 'error');
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      return;
    }

    if (!dueDate) {
      Utils.showToast('נא לבחור תאריך יעד', 'error');
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      return;
    }

    // Prepare task data
    const taskData = {
      'תיאור': description,
      'קטגוריה': category,
      'תאריך יעד': dueDate,
      'דחיפות': priority,
      'שם מבקש': currentUser.name,
      'אימייל מבקש': currentUser.email,
      'סטטוס': 'חדשה',
      'מבצע': 'שני'
    };

    console.log('📤 יוצר משימה חדשה:', taskData);

    // Send to API using API Service
    const result = await window.api.createTask(taskData);
    console.log('✅ משימה נוצרה בהצלחה:', result);

    // Close modal
    document.getElementById('createTaskModal').classList.remove('active');

    // Show success message
    Utils.showToast('המשימה נשלחה בהצלחה', 'success');

    // Reload tasks to show new task
    setTimeout(() => {
      loadTasks(true);
    }, 500);

  } catch (error) {
    console.error('❌ שגיאה ביצירת המשימה:', error);
    Utils.showToast(`שגיאה ביצירת המשימה: ${error.message}`, 'error');
  } finally {
    // Restore button state
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

// ================================================
// Console Info
// ================================================

console.log('%c📊 Dashboard Loaded', 'color: #2979ff; font-size: 16px; font-weight: bold;');
console.log('%cMade with ❤️ by Claude Code', 'color: #00d2ca; font-size: 12px;');
