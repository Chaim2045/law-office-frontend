// ================================================
// Tabs Handler - Active vs Completed Tasks
// ================================================

function setupTabs() {
  const activeTab = document.getElementById('activeTab');
  const completedTab = document.getElementById('completedTab');

  if (!activeTab || !completedTab) {
    console.warn('Tabs not found in DOM');
    return;
  }

  activeTab.addEventListener('click', () => {
    currentTab = 'active';
    activeTab.classList.add('active');
    completedTab.classList.remove('active');
    applyFilters();
  });

  completedTab.addEventListener('click', () => {
    currentTab = 'completed';
    completedTab.classList.add('active');
    activeTab.classList.remove('active');
    applyFilters();
  });
}

// Update tab badges with counts
function updateTabBadges() {
  const activeTasks = allTasks.filter(t =>
    t.status !== 'הושלמה' && t.status !== 'בוטלה'
  ).length;

  const completedTasks = allTasks.filter(t =>
    t.status === 'הושלמה' || t.status === 'בוטלה'
  ).length;

  const activeCount = document.getElementById('activeCount');
  const completedCount = document.getElementById('completedCount');

  if (activeCount) activeCount.textContent = activeTasks;
  if (completedCount) completedCount.textContent = completedTasks;
}
