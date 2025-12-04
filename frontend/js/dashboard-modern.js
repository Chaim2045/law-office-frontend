// ================================================
// Modern Dashboard Handler
// ================================================

let allTasks = [];
let filteredTasks = [];

// ================================================
// Initialization
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeUser();
  setupEventListeners();
  loadTasks();

  // Auto-refresh every 30 seconds
  setInterval(loadTasks, 30000);
});

// ================================================
// User Management
// ================================================

function initializeUser() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"אורח","email":"guest@ghlawoffice.co.il"}');

  document.getElementById('currentUserName').textContent = currentUser.name;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);

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

      showNotification(`התחבר כ-${name}`, 'success');
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
    showNotification('המשימות רוענו', 'success');
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
}

// ================================================
// Load Tasks
// ================================================

async function loadTasks() {
  const container = document.getElementById('tasksContainer');
  container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>טוען משימות...</p></div>';

  try {
    const response = await fetch(`${window.API_URL}/api/tasks`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allTasks = await response.json();
    filteredTasks = [...allTasks];

    updateStatistics();
    applyFilters();

    console.log(`✅ Loaded ${allTasks.length} tasks`);

  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>שגיאה בטעינת המשימות</p>
        <button class="btn btn-primary" onclick="loadTasks()">נסה שוב</button>
      </div>
    `;
    showNotification('שגיאה בטעינת המשימות', 'error');
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

    return searchMatch && statusMatch && priorityMatch && categoryMatch;
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
      showTaskModal(filteredTasks[index]);
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

  modal.classList.add('active');
}

// ================================================
// Notification
// ================================================

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');

  notification.textContent = message;
  notification.className = `notification ${type} active`;

  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

// ================================================
// Console Info
// ================================================

console.log('%c📊 Dashboard Loaded', 'color: #2979ff; font-size: 16px; font-weight: bold;');
console.log('%cMade with ❤️ by Claude Code', 'color: #00d2ca; font-size: 12px;');
