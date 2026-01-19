// ================================================
// 🌐 API Service - Centralized API calls
// ================================================

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Generic request handler with error handling
     * @param {string} endpoint - API endpoint (e.g., '/api/tasks')
     * @param {Object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);

            // Log response status
            console.log(`📡 Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            console.log(`✅ Success:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error:`, error);

            // Show user-friendly error message
            if (window.Utils) {
                let errorMessage = 'שגיאה בתקשורת עם השרת';

                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'אין חיבור לשרת. אנא בדוק את החיבור לאינטרנט';
                } else if (error.message.includes('404')) {
                    errorMessage = 'הנתונים המבוקשים לא נמצאו';
                } else if (error.message.includes('500')) {
                    errorMessage = 'שגיאת שרת. אנא נסה שוב מאוחר יותר';
                } else {
                    errorMessage = error.message;
                }

                window.Utils.showToast(errorMessage, 'error');
            }

            throw error;
        }
    }

    // ================================================
    // 📋 Tasks API Methods
    // ================================================

    /**
     * Get all tasks
     * @param {Object} filters - Optional filters (status, assignee, etc.)
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasks(filters = {}) {
        let endpoint = '/api/tasks';

        // Add query parameters if filters provided
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });

        const queryString = queryParams.toString();
        if (queryString) {
            endpoint += `?${queryString}`;
        }

        return this.request(endpoint);
    }

    /**
     * Get a single task by ID
     * @param {string} id - Task ID (UUID or task_id)
     * @returns {Promise<Object>} Task object
     */
    async getTaskById(id) {
        return this.request(`/api/tasks/${id}`);
    }

    /**
     * Create a new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} Created task
     */
    async createTask(taskData) {
        return this.request('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    /**
     * Update an existing task
     * @param {string} id - Task ID
     * @param {Object} taskData - Updated task data
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(id, taskData) {
        // For now, backend still uses POST for updates
        // TODO: Change to PUT when backend is updated
        return this.request('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({ id, ...taskData })
        });
    }

    /**
     * Update task using proper REST PUT method
     * This method will be used once backend supports PUT
     * @param {string} id - Task ID
     * @param {Object} taskData - Updated task data
     * @returns {Promise<Object>} Updated task
     */
    async updateTaskPut(id, taskData) {
        return this.request(`/api/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<void>}
     */
    async deleteTask(id) {
        return this.request(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get tasks by assignee
     * @param {string} assignee - Assignee name
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasksByAssignee(assignee) {
        return this.request(`/api/tasks/assignee/${encodeURIComponent(assignee)}`);
    }

    /**
     * Get tasks by status
     * @param {string} status - Task status
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasksByStatus(status) {
        return this.request(`/api/tasks/status/${encodeURIComponent(status)}`);
    }

    // ================================================
    // 👤 Authentication API Methods (placeholder for future)
    // ================================================

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    /**
     * Register new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    // ================================================
    // 📊 Statistics API Methods
    // ================================================

    /**
     * Get general statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        return this.request('/api/stats');
    }

    /**
     * Get user-specific statistics
     * @param {string} userName - User name
     * @returns {Promise<Object>} User statistics
     */
    async getUserStats(userName) {
        return this.request(`/api/stats/user/${encodeURIComponent(userName)}`);
    }

    // ================================================
    // 🏥 Health Check Methods
    // ================================================

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        return this.request('/health');
    }

    /**
     * Check database readiness
     * @returns {Promise<Object>} Ready status
     */
    async readyCheck() {
        return this.request('/ready');
    }

    // ================================================
    // 🔧 Utility Methods
    // ================================================

    /**
     * Set authorization token (for future JWT implementation)
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    /**
     * Clear authorization token
     */
    clearAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }

    /**
     * Get current base URL
     * @returns {string} Base URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * Update base URL
     * @param {string} newBaseUrl - New base URL
     */
    setBaseUrl(newBaseUrl) {
        this.baseUrl = newBaseUrl;
        console.log(`🔧 API Base URL updated to: ${newBaseUrl}`);
    }
}

// ================================================
// 🚀 Initialize API Service
// ================================================

// Wait for config.js to load and define window.API_URL
if (typeof window.API_URL !== 'undefined') {
    window.api = new ApiService(window.API_URL);
    console.log('🌐 API Service initialized with base URL:', window.API_URL);
} else {
    console.warn('⚠️ window.API_URL not found. Make sure config.js is loaded before api-service.js');
    // Fallback to production URL
    window.api = new ApiService('https://famous-truffle-5a1846.netlify.app');
}

console.log('🌐 API Service loaded successfully');
