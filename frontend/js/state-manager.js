// ================================================
// 📊 State Manager - Simple Reactive State Management
// ================================================

/**
 * StateManager - A simple, reactive state management solution
 *
 * Features:
 * - Simple get/set API
 * - Reactive updates with listeners
 * - Multiple listeners per state key
 * - Computed properties
 * - State history (optional)
 * - Debug mode
 *
 * Usage:
 * ```javascript
 * const state = new StateManager({
 *   tasks: [],
 *   currentUser: null
 * });
 *
 * // Subscribe to changes
 * state.subscribe('tasks', (newTasks, oldTasks) => {
 *   console.log('Tasks changed!', newTasks);
 *   renderTasks(newTasks);
 * });
 *
 * // Update state
 * state.set('tasks', newTasksArray); // Triggers all listeners
 * ```
 */
class StateManager {
  constructor(initialState = {}, options = {}) {
    this.state = { ...initialState };
    this.listeners = {}; // { key: [callback1, callback2, ...] }
    this.computedProperties = {}; // { key: computeFn }
    this.history = []; // State history for debugging
    this.options = {
      debug: options.debug || false,
      maxHistory: options.maxHistory || 10,
      enableHistory: options.enableHistory || false
    };

    if (this.options.debug) {
      console.log('🎯 StateManager initialized with state:', this.state);
    }
  }

  /**
   * Get a value from state
   * @param {string} key - State key
   * @returns {any} State value
   */
  get(key) {
    // Check if it's a computed property
    if (this.computedProperties[key]) {
      return this.computedProperties[key](this.state);
    }

    return this.state[key];
  }

  /**
   * Set a value in state and notify listeners
   * @param {string} key - State key
   * @param {any} value - New value
   * @param {boolean} silent - If true, don't trigger listeners
   */
  set(key, value, silent = false) {
    const oldValue = this.state[key];

    // Don't update if value is the same (shallow comparison)
    if (oldValue === value) {
      return;
    }

    // Save to history
    if (this.options.enableHistory) {
      this.history.push({
        timestamp: new Date(),
        key,
        oldValue,
        newValue: value
      });

      // Limit history size
      if (this.history.length > this.options.maxHistory) {
        this.history.shift();
      }
    }

    // Update state
    this.state[key] = value;

    if (this.options.debug) {
      console.log(`📝 State updated: ${key}`, {
        old: oldValue,
        new: value
      });
    }

    // Notify listeners (unless silent)
    if (!silent && this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error(`Error in listener for "${key}":`, error);
        }
      });
    }
  }

  /**
   * Update multiple state values at once
   * @param {Object} updates - Object with key-value pairs
   * @param {boolean} silent - If true, don't trigger listeners
   */
  setMultiple(updates, silent = false) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value, silent);
    });
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }

    this.listeners[key].push(callback);

    if (this.options.debug) {
      console.log(`👂 Listener added for: ${key}`);
    }

    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);

      if (this.options.debug) {
        console.log(`🔇 Listener removed for: ${key}`);
      }
    };
  }

  /**
   * Define a computed property
   * @param {string} key - Property name
   * @param {Function} computeFn - Function that computes the value
   */
  defineComputed(key, computeFn) {
    this.computedProperties[key] = computeFn;

    if (this.options.debug) {
      console.log(`🧮 Computed property defined: ${key}`);
    }
  }

  /**
   * Get all state as a plain object
   * @returns {Object} State object
   */
  getAll() {
    return { ...this.state };
  }

  /**
   * Check if a key exists in state
   * @param {string} key - State key
   * @returns {boolean}
   */
  has(key) {
    return key in this.state;
  }

  /**
   * Delete a key from state
   * @param {string} key - State key
   */
  delete(key) {
    const oldValue = this.state[key];
    delete this.state[key];

    if (this.options.debug) {
      console.log(`🗑️ State deleted: ${key}`);
    }

    // Notify listeners
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        callback(undefined, oldValue);
      });
    }
  }

  /**
   * Reset state to initial values
   * @param {Object} newInitialState - New initial state (optional)
   */
  reset(newInitialState = {}) {
    const oldState = { ...this.state };
    this.state = { ...newInitialState };

    if (this.options.debug) {
      console.log('🔄 State reset:', this.state);
    }

    // Notify all listeners
    Object.keys(oldState).forEach(key => {
      if (this.listeners[key]) {
        const newValue = this.state[key];
        const oldValue = oldState[key];
        this.listeners[key].forEach(callback => {
          callback(newValue, oldValue);
        });
      }
    });
  }

  /**
   * Clear all listeners
   */
  clearListeners() {
    this.listeners = {};

    if (this.options.debug) {
      console.log('🔇 All listeners cleared');
    }
  }

  /**
   * Get state change history
   * @returns {Array} History array
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];

    if (this.options.debug) {
      console.log('🗑️ History cleared');
    }
  }

  /**
   * Watch multiple keys and trigger callback when any changes
   * @param {Array<string>} keys - Array of keys to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  watchMultiple(keys, callback) {
    const unsubscribers = keys.map(key => {
      return this.subscribe(key, (newValue, oldValue) => {
        callback(key, newValue, oldValue);
      });
    });

    // Return function that unsubscribes from all
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Debug: Print current state
   */
  debug() {
    console.group('🎯 StateManager Debug Info');
    console.log('Current State:', this.state);
    console.log('Listeners:', Object.keys(this.listeners).reduce((acc, key) => {
      acc[key] = this.listeners[key].length;
      return acc;
    }, {}));
    console.log('Computed Properties:', Object.keys(this.computedProperties));
    if (this.options.enableHistory) {
      console.log('History:', this.history);
    }
    console.groupEnd();
  }
}

// ================================================
// 🌍 Global State Instances
// ================================================

/**
 * App State - Main application state
 */
window.appState = new StateManager({
  // User state
  currentUser: null,
  isAuthenticated: false,

  // Tasks state
  tasks: [],
  filteredTasks: [],
  currentTab: 'active', // 'active' or 'completed'

  // UI state
  isLoading: false,
  lastRefreshTime: null,

  // Filters
  searchQuery: '',
  categoryFilter: '',
  statusFilter: '',
  priorityFilter: ''
}, {
  debug: false, // Set to true for debugging
  enableHistory: false
});

// ================================================
// 🧮 Computed Properties
// ================================================

// Active tasks count
appState.defineComputed('activeTasksCount', (state) => {
  return state.tasks.filter(t =>
    t.status !== 'הושלמה' && t.status !== 'בוטלה'
  ).length;
});

// Completed tasks count
appState.defineComputed('completedTasksCount', (state) => {
  return state.tasks.filter(t =>
    t.status === 'הושלמה'
  ).length;
});

// New tasks count
appState.defineComputed('newTasksCount', (state) => {
  return state.tasks.filter(t => t.status === 'חדשה').length;
});

// Urgent tasks count
appState.defineComputed('urgentTasksCount', (state) => {
  return state.tasks.filter(t =>
    t.priority === 'דחופה' &&
    t.status !== 'הושלמה' &&
    t.status !== 'בוטלה'
  ).length;
});

// Has search/filters active
appState.defineComputed('hasActiveFilters', (state) => {
  return !!(
    state.searchQuery ||
    state.categoryFilter ||
    state.statusFilter ||
    state.priorityFilter
  );
});

// ================================================
// 🛠️ Helper Functions
// ================================================

/**
 * Initialize user from localStorage
 */
function initUserState() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      appState.set('currentUser', user);
      appState.set('isAuthenticated', true);
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
    }
  }
}

/**
 * Save user to localStorage when it changes
 */
appState.subscribe('currentUser', (user) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    appState.set('isAuthenticated', true, true); // Silent update
  } else {
    localStorage.removeItem('currentUser');
    appState.set('isAuthenticated', false, true);
  }
});

// Initialize user state on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUserState);
} else {
  initUserState();
}

console.log('📊 State Manager loaded successfully');
console.log('💡 Access global state via: window.appState');
console.log('💡 Debug state: appState.debug()');
