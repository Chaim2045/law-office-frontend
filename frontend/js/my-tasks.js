// ================================================
// My Tasks - Task list view for logged-in users
// ================================================

(function() {
  'use strict';

  let myAllTasks = [];
  let tasksLoaded = false;

  // ================================================
  // Helper Functions
  // ================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return dateStr; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    if (String(timeStr).includes('1899') || String(timeStr).includes('1900')) {
      try {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {}
    }
    if (/^\d{1,2}:\d{2}/.test(String(timeStr))) return timeStr;
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return '';
  }

  function getStatusBadge(status) {
    const map = { 'ממתינה': 'pending', 'בביצוע': 'in-progress', 'בוצע': 'completed', 'הוחזר להשלמה': 'returned', 'בוטל': 'cancelled' };
    const cls = map[status] || 'pending';
    return '<span class="status-badge ' + cls + '">' + (status || 'ממתינה') + '</span>';
  }

  function getPriorityBadge(priority) {
    const map = { 'רגילה': 'normal', 'דחופה': 'urgent', 'דחופה מאוד': 'urgent' };
    const cls = map[priority] || 'normal';
    return '<span class="priority-badge ' + cls + '">' + (priority || 'רגילה') + '</span>';
  }

  function isTaskOverdue(task) {
    if (!task.dueDate || task.status === 'בוצע' || task.status === 'בוטל') return false;
    return new Date(task.dueDate) < new Date();
  }

  function getDelayDays(task) {
    if (!isTaskOverdue(task)) return 0;
    return Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
  }

  function getCardStatusClass(task, overdue) {
    if (overdue) return 'task-card-overdue';
    const map = { 'ממתינה': 'status-pending', 'בביצוע': 'status-in-progress', 'בוצע': 'status-completed', 'הוחזר להשלמה': 'status-returned', 'בוטל': 'status-cancelled' };
    return map[task.status] || 'status-pending';
  }

  function renderConversation(secretaryNotes) {
    if (!secretaryNotes) return '';
    const lines = secretaryNotes.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length === 0) return '';

    var bubbles = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var returnMatch = line.match(/^\[הוחזר\s+([^\]]+)\]\s*(.*)/);
      var responseMatch = line.match(/^\[תשובת מבקש\s+([^\]]+)\]\s*(.*)/);

      if (returnMatch) {
        bubbles += '<div class="tv-msg secretary"><div class="tv-msg-time">' + escapeHtml(returnMatch[1]) + '</div>' + escapeHtml(returnMatch[2]) + '</div>';
      } else if (responseMatch) {
        bubbles += '<div class="tv-msg requester"><div class="tv-msg-time">' + escapeHtml(responseMatch[1]) + '</div>' + escapeHtml(responseMatch[2]) + '</div>';
      } else {
        bubbles += '<div class="tv-msg generic">' + escapeHtml(line) + '</div>';
      }
    }

    return '<div class="tv-conversation"><div class="tv-conversation-title"><i class="fas fa-comments" style="margin-left:6px;color:#9ca3af;"></i> היסטוריית שיחה:</div>' + bubbles + '</div>';
  }

  // ================================================
  // Tab Switching
  // ================================================

  document.addEventListener('DOMContentLoaded', function() {
    var navItems = document.querySelectorAll('.bottom-nav-item');
    var formCard = document.getElementById('newTaskCard');
    var myTasksSection = document.getElementById('myTasksSection');

    if (!navItems.length || !formCard || !myTasksSection) return;

    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        navItems.forEach(function(n) { n.classList.remove('active'); });
        this.classList.add('active');

        if (this.dataset.tab === 'newTask') {
          formCard.style.display = '';
          myTasksSection.style.display = 'none';
        } else {
          formCard.style.display = 'none';
          myTasksSection.style.display = '';
          if (!tasksLoaded) {
            loadMyTasks();
          }
        }
      });
    });

    // Close modal on overlay click
    var overlay = document.getElementById('taskViewModal');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    }

    // Close modal on ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('taskViewModal');
        if (modal && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      }
    });
  });

  // ================================================
  // Load Tasks
  // ================================================

  function loadMyTasks() {
    var loading = document.getElementById('myTasksLoading');
    var grid = document.getElementById('myTasksGrid');
    var empty = document.getElementById('myTasksEmpty');

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    if (empty) empty.style.display = 'none';

    fetch(window.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=getAllTasks'
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.status === 'success') {
        myAllTasks = data.tasks || [];
        tasksLoaded = true;
        filterAndRenderMyTasks();
      } else {
        throw new Error(data.message || 'שגיאה בטעינת נתונים');
      }
    })
    .catch(function(error) {
      console.error('Error loading tasks:', error);
      var grid = document.getElementById('myTasksGrid');
      if (grid) {
        grid.innerHTML = '<div class="my-tasks-empty" style="display:block;"><i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i><p>שגיאה בטעינת המשימות</p></div>';
      }
    })
    .finally(function() {
      var loading = document.getElementById('myTasksLoading');
      if (loading) loading.style.display = 'none';
    });
  }

  // ================================================
  // Filter & Render
  // ================================================

  function filterAndRenderMyTasks() {
    var user = window.auth ? window.auth.getCurrentUser() : null;
    if (!user) return;

    var isAdmin = user.role === 'admin';
    var tasks = myAllTasks.slice();

    // Admin filter
    var filterEl = document.getElementById('myTasksFilter');
    if (isAdmin) {
      if (filterEl) filterEl.style.display = '';
      populateUserFilter();
      var selectedUser = document.getElementById('myTasksUserFilter').value;
      if (selectedUser !== 'all') {
        tasks = tasks.filter(function(t) { return t.requester === selectedUser; });
      }
    } else {
      if (filterEl) filterEl.style.display = 'none';
      tasks = tasks.filter(function(t) { return t.requester === user.name; });
    }

    updateMyTasksStats(tasks);
    renderMyTaskCards(tasks);
  }

  // ================================================
  // Stats
  // ================================================

  function updateMyTasksStats(tasks) {
    var total = tasks.length;
    var pending = tasks.filter(function(t) { return t.status === 'ממתינה'; }).length;
    var inProgress = tasks.filter(function(t) { return t.status === 'בביצוע'; }).length;
    var completed = tasks.filter(function(t) { return t.status === 'בוצע'; }).length;
    var returned = tasks.filter(function(t) { return t.status === 'הוחזר להשלמה'; }).length;

    var el = document.getElementById('myTasksStats');
    if (!el) return;

    el.innerHTML =
      '<div class="mt-stat-box"><div class="mt-stat-number">' + total + '</div><div class="mt-stat-label">סה"כ</div></div>' +
      '<div class="mt-stat-box pending"><div class="mt-stat-number">' + pending + '</div><div class="mt-stat-label">ממתינות</div></div>' +
      '<div class="mt-stat-box in-progress"><div class="mt-stat-number">' + inProgress + '</div><div class="mt-stat-label">בביצוע</div></div>' +
      '<div class="mt-stat-box completed"><div class="mt-stat-number">' + completed + '</div><div class="mt-stat-label">הושלמו</div></div>' +
      (returned > 0 ? '<div class="mt-stat-box returned"><div class="mt-stat-number">' + returned + '</div><div class="mt-stat-label">הוחזרו</div></div>' : '');
  }

  // ================================================
  // Render Cards
  // ================================================

  function renderMyTaskCards(tasks) {
    var grid = document.getElementById('myTasksGrid');
    var empty = document.getElementById('myTasksEmpty');

    if (tasks.length === 0) {
      if (grid) grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    // Sort newest first
    tasks.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    grid.innerHTML = tasks.map(function(task) {
      var overdue = isTaskOverdue(task);
      var desc = String(task.description || '').substring(0, 80);
      var statusClass = getCardStatusClass(task, overdue);

      return '<div class="task-card ' + statusClass + '" onclick="window._viewMyTaskDetails(\'' + task.id + '\')">' +
        '<div class="task-card-body">' +
          '<div class="task-card-top">' +
            '<div class="task-card-title-group">' +
              '<div class="task-card-requester">' + (task.requester || '') + '</div>' +
              '<div class="task-card-time">' + formatDate(task.date) + '</div>' +
            '</div>' +
            '<div class="task-card-priority">' + getPriorityBadge(task.priority) + '</div>' +
          '</div>' +
          '<div class="task-card-desc">' + escapeHtml(desc) + '</div>' +
          (task.attachments ? '<div class="task-card-attachment-badge"><i class="fas fa-paperclip"></i> קבצים מצורפים</div>' : '') +
        '</div>' +
        '<div class="task-card-bottom">' +
          '<div class="task-card-meta">' +
            (task.dueDate ? '<span class="task-card-meta-item' + (overdue ? ' overdue-text' : '') + '"><i class="' + (overdue ? 'fas fa-exclamation-circle' : 'far fa-calendar') + '"></i> ' + formatDate(task.dueDate) + (overdue ? ' — באיחור' : '') + '</span>' : '') +
            getStatusBadge(task.status) +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ================================================
  // View Task Details (view-only modal)
  // ================================================

  window._viewMyTaskDetails = function(taskId) {
    var task = myAllTasks.find(function(t) { return t.id === taskId; });
    if (!task) return;

    var body = document.getElementById('taskViewBody');
    if (!body) return;

    var taskEmail = task.requesterEmail || task.email || '';

    var html =
      '<div class="tv-detail-row"><div class="tv-detail-label">מבקש:</div><div class="tv-detail-value">' + escapeHtml(task.requester || '-') + '</div></div>' +
      (taskEmail ? '<div class="tv-detail-row"><div class="tv-detail-label">אימייל:</div><div class="tv-detail-value"><a href="mailto:' + escapeHtml(taskEmail) + '" style="color:#0049db;">' + escapeHtml(taskEmail) + '</a></div></div>' : '') +
      '<div class="tv-detail-row"><div class="tv-detail-label">קטגוריה:</div><div class="tv-detail-value">' + escapeHtml(task.category || '-') + '</div></div>' +
      '<div class="tv-detail-row"><div class="tv-detail-label">דחיפות:</div><div class="tv-detail-value">' + getPriorityBadge(task.priority) + '</div></div>' +
      '<div class="tv-detail-row"><div class="tv-detail-label">תאריך יעד:</div><div class="tv-detail-value">' + formatDate(task.dueDate) + '</div></div>' +
      '<div class="tv-detail-row"><div class="tv-detail-label">סטטוס:</div><div class="tv-detail-value">' + getStatusBadge(task.status) + '</div></div>' +
      '<div class="tv-detail-row"><div class="tv-detail-label">תאריך יצירה:</div><div class="tv-detail-value">' + formatDate(task.date) + ' ' + formatTime(task.time) + '</div></div>' +
      (task.completionDate ? '<div class="tv-detail-row"><div class="tv-detail-label">תאריך השלמה:</div><div class="tv-detail-value">' + formatDate(task.completionDate) + '</div></div>' : '') +
      (task.completionDetails ? '<div class="tv-detail-row"><div class="tv-detail-label">פרטי ביצוע:</div><div class="tv-detail-value">' + escapeHtml(task.completionDetails) + '</div></div>' : '');

    // Attachments
    if (task.attachments) {
      html += '<div class="tv-attachments">' +
        '<div class="tv-attachments-header"><i class="fas fa-paperclip"></i> קבצים מצורפים</div>' +
        '<div class="tv-attachments-actions">' +
          '<a href="' + task.attachments + '" target="_blank" rel="noopener" class="tv-att-btn tv-att-btn-view"><i class="fas fa-external-link-alt"></i> פתח ב-Google Drive</a>' +
          '<a href="' + task.attachments + '" target="_blank" rel="noopener" download class="tv-att-btn tv-att-btn-download"><i class="fas fa-download"></i> הורד למחשב</a>' +
        '</div></div>';
    }

    // Description
    html += '<div class="tv-description">' +
      '<div class="tv-description-label">תיאור המשימה:</div>' +
      '<div class="tv-description-text">' + escapeHtml(String(task.description || '-')) + '</div>' +
    '</div>';

    // Conversation
    if (task.secretaryNotes) {
      html += renderConversation(task.secretaryNotes);
    }

    // Close button
    html += '<button class="tv-close-btn" onclick="document.getElementById(\'taskViewModal\').classList.remove(\'active\')">סגור</button>';

    body.innerHTML = html;
    document.getElementById('taskViewModal').classList.add('active');
  };

  // ================================================
  // Admin User Filter
  // ================================================

  function populateUserFilter() {
    var select = document.getElementById('myTasksUserFilter');
    if (!select) return;

    var users = [];
    var seen = {};
    for (var i = 0; i < myAllTasks.length; i++) {
      var name = myAllTasks[i].requester;
      if (name && !seen[name]) {
        seen[name] = true;
        users.push(name);
      }
    }
    users.sort();

    // Keep current selection if possible
    var currentVal = select.value;
    select.innerHTML = '<option value="all">כל המשימות</option>';
    for (var j = 0; j < users.length; j++) {
      select.innerHTML += '<option value="' + escapeHtml(users[j]) + '">' + escapeHtml(users[j]) + '</option>';
    }
    if (currentVal) select.value = currentVal;

    // Bind change event (remove old to prevent duplicates)
    select.onchange = filterAndRenderMyTasks;
  }

  // Expose refresh function for potential use
  window._refreshMyTasks = function() {
    tasksLoaded = false;
    loadMyTasks();
  };

})();
