// ================================================
// Dashboard Secretary - List + Sidebar Layout
// ================================================

let allTasks = [];
let filteredTasks = [];
let currentFilter = 'all';
let searchQuery = '';

const OFFICE_MANAGER_EMAILS = [
  'office@ghlawoffice.co.il',  // שני
  'miri@ghlawoffice.co.il'     // מירי
];

// ================================================
// Initialization
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard Secretary - Loading...');
  initializeUser();
  setupEventListeners();
  loadTasks();

  // Auto-refresh every 60 seconds
  setInterval(() => loadTasks(true), 60000);
});

// ================================================
// User Management
// ================================================

function initializeUser() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"אורח","email":"guest@ghlawoffice.co.il"}');

  document.getElementById('currentUserName').textContent = currentUser.name;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);

  // Update dashboard title
  document.getElementById('dashboardTitle').textContent = 'דשבורד מנהלת משרד';
  document.getElementById('dashboardSubtitle').textContent = 'ניהול כל המשימות במשרד';

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
    window.location.href = 'login.html';
  });
}

// ================================================
// Event Listeners
// ================================================

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => loadTasks());

  // New task button
  document.getElementById('newTaskBtn').addEventListener('click', openNewTaskModal);
  document.getElementById('newTaskMenuItem')?.addEventListener('click', openNewTaskModal);

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    applyFilters();
  });

  // Filters
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('sortBy').addEventListener('change', applyFilters);

  // Sidebar filters
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Apply filter
      currentFilter = item.dataset.filter;
      updateFilterTitle();
      applyFilters();
    });
  });

  // Modal close buttons
  document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
  document.getElementById('closeTaskModalBtn').addEventListener('click', closeTaskModal);
  document.getElementById('closeUpdateModal').addEventListener('click', closeUpdateModal);
  document.getElementById('cancelUpdateBtn').addEventListener('click', closeUpdateModal);
  document.getElementById('closeCreateModal').addEventListener('click', closeCreateModal);
  document.getElementById('cancelCreateBtn').addEventListener('click', closeCreateModal);

  // Update task form
  document.getElementById('saveUpdateBtn').addEventListener('click', saveTaskUpdate);

  // Create task form
  document.getElementById('saveCreateBtn').addEventListener('click', saveNewTask);

  // Show/hide completion details based on status
  document.getElementById('updateStatus')?.addEventListener('change', (e) => {
    const completionGroup = document.getElementById('completionDetailsGroup');
    if (e.target.value === 'בוצע') {
      completionGroup.style.display = 'block';
    } else {
      completionGroup.style.display = 'none';
    }
  });
}

// ================================================
// Load Tasks
// ================================================

async function loadTasks(silent = false) {
  if (!silent) {
    document.getElementById('listLoading').style.display = 'flex';
    document.getElementById('listEmpty').style.display = 'none';
  }

  try {
    // Check if apiService exists
    if (typeof apiService === 'undefined') {
      throw new Error('apiService is not defined. Make sure api-service.js is loaded before dashboard-secretary.js');
    }

    const response = await apiService.getTasks();

    if (response.success) {
      allTasks = response.data || [];
      console.log(`✅ Loaded ${allTasks.length} tasks`);

      updateStats();
      updateSidebarCounts();
      applyFilters();
    } else {
      throw new Error(response.message || 'Failed to load tasks');
    }
  } catch (error) {
    console.error('❌ Error loading tasks:', error);
    showNotification('שגיאה בטעינת משימות', 'error');
  } finally {
    if (!silent) {
      document.getElementById('listLoading').style.display = 'none';
    }
  }
}

// ================================================
// Update Stats
// ================================================

function updateStats() {
  const total = allTasks.length;
  const newTasks = allTasks.filter(t => t.status === 'חדשה').length;
  const inProgress = allTasks.filter(t => t.status === 'בטיפול' || t.status === 'ממתין').length;
  const completed = allTasks.filter(t => t.status === 'הושלמה').length;

  document.getElementById('totalTasks').textContent = total;
  document.getElementById('newTasks').textContent = newTasks;
  document.getElementById('inProgressTasks').textContent = inProgress;
  document.getElementById('completedTasks').textContent = completed;
}

// ================================================
// Update Sidebar Counts
// ================================================

function updateSidebarCounts() {
  const today = new Date().toDateString();

  // Views
  document.getElementById('allCount').textContent = allTasks.length;
  document.getElementById('starredCount').textContent = allTasks.filter(t => t.starred).length;
  document.getElementById('todayCount').textContent = allTasks.filter(t => {
    return t.dueDate && new Date(t.dueDate).toDateString() === today;
  }).length;

  // Status counts
  document.getElementById('statusNewCount').textContent = allTasks.filter(t => t.status === 'חדשה').length;
  document.getElementById('statusProgressCount').textContent = allTasks.filter(t => t.status === 'בטיפול').length;
  document.getElementById('statusWaitingCount').textContent = allTasks.filter(t => t.status === 'ממתין').length;
  document.getElementById('statusCompletedCount').textContent = allTasks.filter(t => t.status === 'הושלמה').length;

  // Priority counts
  document.getElementById('priorityUrgentCount').textContent = allTasks.filter(t => t.priority === 'דחופה').length;
  document.getElementById('priorityHighCount').textContent = allTasks.filter(t => t.priority === 'גבוהה').length;
  document.getElementById('priorityNormalCount').textContent = allTasks.filter(t => t.priority === 'רגילה').length;
}

// ================================================
// Apply Filters
// ================================================

function applyFilters() {
  filteredTasks = allTasks.filter(task => {
    // Apply current filter
    if (currentFilter !== 'all') {
      if (currentFilter === 'starred' && !task.starred) return false;
      if (currentFilter === 'today') {
        const today = new Date().toDateString();
        if (!task.dueDate || new Date(task.dueDate).toDateString() !== today) return false;
      }
      if (currentFilter.startsWith('status:')) {
        const status = currentFilter.split(':')[1];
        if (task.status !== status) return false;
      }
      if (currentFilter.startsWith('priority:')) {
        const priority = currentFilter.split(':')[1];
        if (task.priority !== priority) return false;
      }
    }

    // Apply category filter
    const categoryFilter = document.getElementById('categoryFilter').value;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    // Apply search
    if (searchQuery) {
      const searchText = `${task.title} ${task.description || ''} ${task.assignedTo || ''}`.toLowerCase();
      if (!searchText.includes(searchQuery)) return false;
    }

    return true;
  });

  // Apply sorting
  const sortBy = document.getElementById('sortBy').value;
  filteredTasks.sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'priority') {
      const priorityOrder = { 'דחופה': 0, 'גבוהה': 1, 'רגילה': 2, 'נמוכה': 3 };
      return (priorityOrder[a.priority] || 9) - (priorityOrder[b.priority] || 9);
    }
    if (sortBy === 'assignee') return (a.assignedTo || '').localeCompare(b.assignedTo || '');
    return 0;
  });

  renderTasksList();
}

// ================================================
// Render Tasks List
// ================================================

function renderTasksList() {
  const tasksList = document.getElementById('tasksList');
  const listEmpty = document.getElementById('listEmpty');
  const listCount = document.getElementById('listCount');

  // Update count
  listCount.textContent = `${filteredTasks.length} משימות`;

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '';
    listEmpty.style.display = 'flex';
    return;
  }

  listEmpty.style.display = 'none';

  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-list-item" onclick="openUpdateTaskModal('${task.id}')">
      <div class="task-checkbox-wrapper">
        <div class="task-checkbox ${task.status === 'הושלמה' ? 'checked' : ''}"
             onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
        </div>
      </div>

      <div class="task-list-id">#${task.id}</div>

      <div class="task-list-content">
        <div class="task-list-title">${escapeHtml(task.title)}</div>
        <div class="task-list-meta">
          <div class="task-list-meta-item">
            <i class="fas fa-user"></i>
            <span>${escapeHtml(task.assignedTo || 'לא שובץ')}</span>
          </div>
          <div class="task-list-meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(task.createdAt)}</span>
          </div>
          ${task.category ? `
          <div class="task-list-meta-item">
            <i class="fas fa-tag"></i>
            <span>${escapeHtml(task.category)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="task-list-assignee">
        <div class="assignee-avatar">${getInitials(task.assignedTo)}</div>
        <span class="assignee-name">${escapeHtml(task.assignedTo || 'לא שובץ')}</span>
      </div>

      <div class="task-list-status status-${task.status}">
        ${task.status || 'לא הוגדר'}
      </div>

      <div class="task-list-priority priority-${task.priority}"></div>
    </div>
  `).join('');
}

// ================================================
// View Task Details (User Modal)
// ================================================

function viewTaskDetails(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  const content = document.getElementById('taskDetailsContent');
  content.innerHTML = renderTaskDetailView(task);

  document.getElementById('taskModalOverlay').classList.add('show');
}

function closeTaskModal() {
  document.getElementById('taskModalOverlay').classList.remove('show');
}

// Render GitHub Issue style task details
function renderTaskDetailView(task) {
  return `
    <div class="task-detail-header">
      <div class="task-status-icon">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="#6b7280">
          <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
          <path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>
        </svg>
      </div>
      <div class="task-detail-header-content">
        <div class="task-detail-title">${escapeHtml(task.title)}</div>
        <div class="task-detail-meta">
          נפתח על ידי <strong>${escapeHtml(task.createdBy || 'לא ידוע')}</strong>
          <span class="task-detail-meta-separator">•</span>
          ${formatDate(task.createdAt)}
        </div>
      </div>
      <div class="task-detail-id">#${task.id}</div>
    </div>

    ${task.description ? `
    <div class="task-detail-description">
      ${escapeHtml(task.description)}
    </div>
    ` : ''}

    <div class="task-detail-labels">
      <span class="badge badge-status status-${task.status}">${task.status}</span>
      <span class="badge badge-priority priority-${task.priority}">${task.priority}</span>
      ${task.category ? `<span class="badge badge-category">${task.category}</span>` : ''}
    </div>

    <div class="task-detail-sidebar">
      <div class="task-sidebar-item">
        <span class="task-sidebar-label">מוטל על</span>
        <span class="task-sidebar-value">
          <span class="task-sidebar-avatar">${getInitials(task.assignedTo)}</span>
          ${escapeHtml(task.assignedTo || 'לא שובץ')}
        </span>
      </div>
      ${task.dueDate ? `
      <div class="task-sidebar-item">
        <span class="task-sidebar-label">תאריך יעד</span>
        <span class="task-sidebar-value">${formatDate(task.dueDate)}</span>
      </div>
      ` : ''}
    </div>
  `;
}

// ================================================
// Update Task Modal
// ================================================

function openUpdateTaskModal(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  // Populate form
  document.getElementById('updateTaskId').value = task.id;
  document.getElementById('updateStatus').value = task.status || '';
  document.getElementById('updatePriority').value = '';
  document.getElementById('updateNotes').value = '';

  // Populate preview
  const preview = document.getElementById('updateTaskPreview');
  preview.innerHTML = renderTaskDetailView(task);

  document.getElementById('updateTaskModalOverlay').classList.add('show');
}

function closeUpdateModal() {
  document.getElementById('updateTaskModalOverlay').classList.remove('show');
}

async function saveTaskUpdate() {
  const taskId = document.getElementById('updateTaskId').value;
  const status = document.getElementById('updateStatus').value;
  const priority = document.getElementById('updatePriority').value;
  const notes = document.getElementById('updateNotes').value;
  const completionDetails = document.getElementById('updateCompletionDetails').value;
  const completionDate = document.getElementById('updateCompletionDate').value;
  const completionTime = document.getElementById('updateCompletionTime').value;

  if (!status) {
    showNotification('יש לבחור סטטוס', 'error');
    return;
  }

  try {
    const updateData = { status };
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;
    if (completionDetails) updateData.completionDetails = completionDetails;
    if (completionDate) updateData.completionDate = completionDate;
    if (completionTime) updateData.completionTime = completionTime;

    const response = await apiService.updateTask(taskId, updateData);

    if (response.success) {
      showNotification('המשימה עודכנה בהצלחה', 'success');
      closeUpdateModal();
      loadTasks();
    } else {
      throw new Error(response.message || 'Failed to update task');
    }
  } catch (error) {
    console.error('❌ Error updating task:', error);
    showNotification('שגיאה בעדכון המשימה', 'error');
  }
}

// ================================================
// Toggle Task Complete
// ================================================

async function toggleTaskComplete(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  const newStatus = task.status === 'הושלמה' ? 'בטיפול' : 'הושלמה';

  try {
    const response = await apiService.updateTask(taskId, { status: newStatus });
    if (response.success) {
      loadTasks(true);
    }
  } catch (error) {
    console.error('❌ Error toggling task:', error);
  }
}

// ================================================
// Helper Functions
// ================================================

function updateFilterTitle() {
  const titles = {
    'all': 'כל המשימות',
    'starred': 'משימות מסומנות',
    'today': 'משימות להיום',
    'status:חדשה': 'משימות חדשות',
    'status:בטיפול': 'משימות בטיפול',
    'status:ממתין': 'משימות ממתינות',
    'status:הושלמה': 'משימות שהושלמו',
    'priority:דחופה': 'משימות דחופות',
    'priority:גבוהה': 'משימות בעדיפות גבוהה',
    'priority:רגילה': 'משימות בעדיפות רגילה'
  };

  document.getElementById('currentFilterTitle').textContent = titles[currentFilter] || 'משימות';
}

// ================================================
// Create New Task
// ================================================

function openNewTaskModal() {
  // Reset form
  document.getElementById('createTaskForm').reset();
  document.getElementById('createTaskModal').classList.add('show');
}

function closeCreateModal() {
  document.getElementById('createTaskModal').classList.remove('show');
}

async function saveNewTask() {
  const description = document.getElementById('createTaskDescription').value.trim();
  const category = document.getElementById('createTaskCategory').value;
  const dueDate = document.getElementById('createTaskDueDate').value;
  const priority = document.querySelector('input[name="createPriority"]:checked')?.value;
  const assignee = document.getElementById('createTaskAssignee').value;

  // Validation
  if (!description) {
    showNotification('נא למלא תיאור משימה', 'error');
    return;
  }
  if (!category) {
    showNotification('נא לבחור סיווג משימה', 'error');
    return;
  }
  if (!dueDate) {
    showNotification('נא לבחור תאריך יעד', 'error');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"אורח","email":"guest@ghlawoffice.co.il"}');

  const taskData = {
    title: description.substring(0, 100), // Use first 100 chars as title
    description: description,
    category: category,
    dueDate: dueDate,
    priority: priority || 'רגילה',
    assignedTo: assignee || '',
    createdBy: currentUser.name,
    status: 'חדשה',
    createdAt: new Date().toISOString()
  };

  try {
    const response = await apiService.createTask(taskData);

    if (response.success) {
      showNotification('המשימה נוצרה בהצלחה', 'success');
      closeCreateModal();
      loadTasks();
    } else {
      throw new Error(response.message || 'Failed to create task');
    }
  } catch (error) {
    console.error('❌ Error creating task:', error);
    showNotification('שגיאה ביצירת המשימה', 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ================================================
// Global Dashboard Instance
// ================================================

window.dashboardSecretary = {
  loadTasks,
  allTasks,
  filteredTasks,
  currentFilter,
  searchQuery
};

console.log('✅ Dashboard Secretary loaded successfully');
