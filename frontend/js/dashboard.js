// ================================================
// 📊 Dashboard Handler
// ================================================

let allTasks = [];
let filteredTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupEventListeners();

    // Auto-refresh every 30 seconds
    setInterval(loadDashboard, 30000);
});

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTasks(e.target.value);
        });
    }

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterByStatus(e.target.value);
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboard);
    }
}

async function loadDashboard() {
    try {
        showLoading(true);

        // Load tasks and stats in parallel
        const [tasksResponse, statsResponse] = await Promise.all([
            fetch(`${window.API_URL}/api/tasks`),
            fetch(`${window.API_URL}/api/stats`)
        ]);

        if (!tasksResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to load dashboard data');
        }

        allTasks = await tasksResponse.json();
        const stats = await statsResponse.json();

        filteredTasks = [...allTasks];

        displayStats(stats);
        displayTasks(filteredTasks);

        showLoading(false);
        showStatus('✅ Dashboard updated', 'success');

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showLoading(false);
        showStatus('❌ שגיאה בטעינת הנתונים', 'error');
    }
}

function displayStats(stats) {
    // Update stat cards
    updateStatCard('total-tasks', stats.total || 0);
    updateStatCard('new-tasks', stats.new || 0);
    updateStatCard('in-progress-tasks', stats.in_progress || 0);
    updateStatCard('completed-tasks', stats.completed || 0);
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;

        // Animate the number
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

function displayTasks(tasks) {
    const tbody = document.getElementById('tasks-tbody');
    if (!tbody) return;

    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    📭 אין משימות להצגה
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = tasks.map(task => `
        <tr data-task-id="${task.id}">
            <td>
                <span class="task-id">${task.task_id}</span>
            </td>
            <td>
                <strong>${escapeHtml(task.title)}</strong>
                ${task.description ? `<br><small>${escapeHtml(task.description.substring(0, 50))}${task.description.length > 50 ? '...' : ''}</small>` : ''}
            </td>
            <td>
                <span class="badge badge-category">${escapeHtml(task.category)}</span>
            </td>
            <td>${escapeHtml(task.assigned_to)}</td>
            <td>
                <span class="badge badge-priority priority-${getPriorityClass(task.priority)}">
                    ${escapeHtml(task.priority)}
                </span>
            </td>
            <td>
                <span class="badge badge-status status-${getStatusClass(task.status)}">
                    ${escapeHtml(task.status)}
                </span>
            </td>
            <td>
                <div class="task-actions">
                    <button onclick="viewTask('${task.id}')" class="btn-small btn-view" title="צפה">👁️</button>
                    <button onclick="editTask('${task.id}')" class="btn-small btn-edit" title="ערוך">✏️</button>
                    <button onclick="deleteTask('${task.id}')" class="btn-small btn-delete" title="מחק">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterTasks(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
        filteredTasks = [...allTasks];
    } else {
        filteredTasks = allTasks.filter(task =>
            task.title.toLowerCase().includes(term) ||
            task.task_id.toLowerCase().includes(term) ||
            task.category.toLowerCase().includes(term) ||
            task.assigned_to.toLowerCase().includes(term) ||
            (task.description && task.description.toLowerCase().includes(term))
        );
    }

    displayTasks(filteredTasks);
    updateResultCount();
}

function filterByStatus(status) {
    if (!status || status === 'all') {
        filteredTasks = [...allTasks];
    } else {
        filteredTasks = allTasks.filter(task => task.status === status);
    }

    displayTasks(filteredTasks);
    updateResultCount();
}

function updateResultCount() {
    const countElement = document.getElementById('result-count');
    if (countElement) {
        countElement.textContent = `מציג ${filteredTasks.length} מתוך ${allTasks.length} משימות`;
    }
}

async function viewTask(taskId) {
    try {
        const response = await fetch(`${window.API_URL}/api/tasks/${taskId}`);
        if (!response.ok) throw new Error('Task not found');

        const task = await response.json();

        // Show modal with task details
        showTaskModal(task);

    } catch (error) {
        console.error('Error viewing task:', error);
        alert('שגיאה בטעינת המשימה');
    }
}

async function editTask(taskId) {
    // For now, just show an alert
    // TODO: Implement edit modal
    alert(`עריכת משימה: ${taskId}\n(בקרוב...)`);
}

async function deleteTask(taskId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
        return;
    }

    try {
        const response = await fetch(`${window.API_URL}/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        showStatus('✅ המשימה נמחקה בהצלחה', 'success');
        loadDashboard(); // Reload data

    } catch (error) {
        console.error('Error deleting task:', error);
        showStatus('❌ שגיאה במחיקת המשימה', 'error');
    }
}

function showTaskModal(task) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📋 פרטי משימה</h2>
                <button onclick="this.closest('.modal').remove()" class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-row">
                    <strong>מזהה:</strong>
                    <span>${escapeHtml(task.task_id)}</span>
                </div>
                <div class="detail-row">
                    <strong>כותרת:</strong>
                    <span>${escapeHtml(task.title)}</span>
                </div>
                <div class="detail-row">
                    <strong>תיאור:</strong>
                    <span>${task.description ? escapeHtml(task.description) : 'אין תיאור'}</span>
                </div>
                <div class="detail-row">
                    <strong>קטגוריה:</strong>
                    <span class="badge badge-category">${escapeHtml(task.category)}</span>
                </div>
                <div class="detail-row">
                    <strong>מוקצה ל:</strong>
                    <span>${escapeHtml(task.assigned_to)} (${escapeHtml(task.assigned_to_email)})</span>
                </div>
                <div class="detail-row">
                    <strong>נוצר על ידי:</strong>
                    <span>${escapeHtml(task.created_by)} (${escapeHtml(task.created_by_email)})</span>
                </div>
                <div class="detail-row">
                    <strong>עדיפות:</strong>
                    <span class="badge badge-priority priority-${getPriorityClass(task.priority)}">${escapeHtml(task.priority)}</span>
                </div>
                <div class="detail-row">
                    <strong>סטטוס:</strong>
                    <span class="badge badge-status status-${getStatusClass(task.status)}">${escapeHtml(task.status)}</span>
                </div>
                <div class="detail-row">
                    <strong>תאריך יעד:</strong>
                    <span>${task.due_date || 'לא צוין'}</span>
                </div>
                <div class="detail-row">
                    <strong>נוצר בתאריך:</strong>
                    <span>${new Date(task.created_at).toLocaleString('he-IL')}</span>
                </div>
                ${task.notes ? `
                <div class="detail-row">
                    <strong>הערות:</strong>
                    <span>${escapeHtml(task.notes)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Helper functions
function getPriorityClass(priority) {
    const map = {
        'דחופה': 'urgent',
        'גבוהה': 'high',
        'רגילה': 'normal',
        'נמוכה': 'low'
    };
    return map[priority] || 'normal';
}

function getStatusClass(status) {
    const map = {
        'חדשה': 'new',
        'בטיפול': 'in-progress',
        'הושלמה': 'completed',
        'בוטלה': 'cancelled'
    };
    return map[status] || 'new';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = isLoading ? 'flex' : 'none';
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}
