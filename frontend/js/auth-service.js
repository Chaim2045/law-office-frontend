// ================================================
// 🔐 Authentication Service - JWT Token Management
// ================================================

/**
 * AuthService - Handles user authentication and JWT token management
 *
 * Features:
 * - Login/Logout
 * - Token storage (secure)
 * - Token validation
 * - Auto-refresh (optional)
 * - User session management
 * - Role-based access control
 *
 * Usage:
 * ```javascript
 * // Login
 * const user = await auth.login(email, password);
 *
 * // Check if authenticated
 * if (auth.isAuthenticated()) {
 *   // User is logged in
 * }
 *
 * // Get current user
 * const user = auth.getCurrentUser();
 *
 * // Logout
 * auth.logout();
 * ```
 */
class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.tokenKey = 'jwt_token';
    this.userKey = 'current_user';
    this.refreshTimer = null;

    // Load from storage on init
    this.loadFromStorage();
  }

  /**
   * Load token and user from localStorage
   */
  loadFromStorage() {
    try {
      this.token = localStorage.getItem(this.tokenKey);
      const userJson = localStorage.getItem(this.userKey);

      if (userJson) {
        this.user = JSON.parse(userJson);
      }

      // Validate token if exists
      if (this.token && !this.isTokenValid()) {
        console.log('🔐 Token expired, clearing auth');
        this.clearAuth();
      } else if (this.token) {
        console.log('🔐 Auth loaded from storage:', this.user?.name);
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object
   */
  async login(email, password) {
    try {
      console.log('🔐 Attempting login:', email);

      // Call login API
      const response = await fetch(`${window.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      // Expected response: { token, user: { name, email, role, ... } }
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user
      this.setToken(data.token);
      this.setUser(data.user);

      // Update global state
      if (window.appState) {
        window.appState.set('currentUser', data.user);
        window.appState.set('isAuthenticated', true);
      }

      console.log('✅ Login successful:', data.user.name);

      // Start auto-refresh if token has expiry
      this.startTokenRefresh();

      return data.user;

    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Login with simple name/email (temporary - for backward compatibility)
   * This simulates authentication without actual password
   * @param {string} name - User name
   * @param {string} email - User email
   */
  loginSimple(name, email) {
    const user = {
      name,
      email,
      role: this.determineRole(email)
    };

    // Create a fake token (for now)
    const fakeToken = btoa(JSON.stringify({ email, timestamp: Date.now() }));

    this.setToken(fakeToken);
    this.setUser(user);

    // Update global state
    if (window.appState) {
      window.appState.set('currentUser', user);
      window.appState.set('isAuthenticated', true);
    }

    console.log('✅ Simple login:', name);

    return user;
  }

  /**
   * Determine user role based on email
   * @param {string} email - User email
   * @returns {string} Role
   */
  determineRole(email) {
    const officeManagerEmails = [
      'office@ghlawoffice.co.il',
      'miri@ghlawoffice.co.il'
    ];

    return officeManagerEmails.includes(email.toLowerCase())
      ? 'office_manager'
      : 'lawyer';
  }

  /**
   * Logout user
   */
  logout() {
    console.log('🔐 Logging out');

    // Clear token and user
    this.clearAuth();

    // Update global state
    if (window.appState) {
      window.appState.set('currentUser', null);
      window.appState.set('isAuthenticated', false);
    }

    // Stop token refresh
    this.stopTokenRefresh();

    // Redirect to login page
    if (window.location.pathname !== '/login.html' &&
        window.location.pathname !== '/frontend/login.html') {
      window.location.href = 'login.html';
    }
  }

  /**
   * Set JWT token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem(this.tokenKey, token);

    // Update API service headers
    if (window.api) {
      window.api.setAuthToken(token);
    }
  }

  /**
   * Get JWT token
   * @returns {string|null} Token
   */
  getToken() {
    return this.token;
  }

  /**
   * Set current user
   * @param {Object} user - User object
   */
  setUser(user) {
    this.user = user;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Get current user
   * @returns {Object|null} User object
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  /**
   * Check if token is valid (not expired)
   * @returns {boolean}
   */
  isTokenValid() {
    if (!this.token) return false;

    try {
      // Decode JWT token (simple base64 decode)
      const parts = this.token.split('.');
      if (parts.length !== 3) {
        // Not a valid JWT format
        return true; // Assume valid for simple tokens
      }

      const payload = JSON.parse(atob(parts[1]));

      // Check expiry
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        return now < payload.exp;
      }

      // No expiry = assume valid
      return true;

    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    // Clear from API service
    if (window.api) {
      window.api.clearAuthToken();
    }
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  hasRole(role) {
    return this.user?.role === role;
  }

  /**
   * Check if user is office manager
   * @returns {boolean}
   */
  isOfficeManager() {
    return this.hasRole('office_manager');
  }

  /**
   * Start token auto-refresh
   */
  startTokenRefresh() {
    // Stop existing timer
    this.stopTokenRefresh();

    // Refresh token 5 minutes before expiry
    if (this.token) {
      try {
        const parts = this.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = payload.exp - now;
            const refreshIn = Math.max((expiresIn - 300) * 1000, 60000); // At least 1 minute

            console.log(`🔐 Token refresh scheduled in ${Math.round(refreshIn / 60000)} minutes`);

            this.refreshTimer = setTimeout(() => {
              this.refreshToken();
            }, refreshIn);
          }
        }
      } catch (error) {
        console.error('Error scheduling token refresh:', error);
      }
    }
  }

  /**
   * Stop token auto-refresh
   */
  stopTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken() {
    try {
      console.log('🔐 Refreshing token...');

      const response = await fetch(`${window.API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.token) {
        this.setToken(data.token);
        console.log('✅ Token refreshed');

        // Schedule next refresh
        this.startTokenRefresh();
      }

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // On refresh failure, logout user
      this.logout();
    }
  }

  /**
   * Get token payload (decoded)
   * @returns {Object|null}
   */
  getTokenPayload() {
    if (!this.token) return null;

    try {
      const parts = this.token.split('.');
      if (parts.length === 3) {
        return JSON.parse(atob(parts[1]));
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    return null;
  }

  /**
   * Get token expiry time
   * @returns {Date|null}
   */
  getTokenExpiry() {
    const payload = this.getTokenPayload();
    if (payload?.exp) {
      return new Date(payload.exp * 1000);
    }
    return null;
  }

  /**
   * Check if user can access a resource
   * @param {string} resource - Resource name
   * @param {string} action - Action (read, write, delete)
   * @returns {boolean}
   */
  canAccess(resource, action) {
    if (!this.isAuthenticated()) return false;

    // Office managers can do everything
    if (this.isOfficeManager()) return true;

    // Define permissions
    const permissions = {
      lawyer: {
        tasks: ['read', 'create'],
        own_tasks: ['read', 'update']
      }
    };

    const userPermissions = permissions[this.user?.role];
    if (!userPermissions) return false;

    return userPermissions[resource]?.includes(action) || false;
  }
}

// ================================================
// 🌍 Global Auth Instance
// ================================================

/**
 * Global authentication service
 */
window.auth = new AuthService();
window.authService = window.auth; // Alias for compatibility

// ================================================
// 🛡️ Route Protection
// ================================================

/**
 * Protect current route - redirect to login if not authenticated
 * @param {boolean} requireAuth - Require authentication (default: true)
 */
window.protectRoute = function(requireAuth = true) {
  if (requireAuth && !window.auth.isAuthenticated()) {
    console.log('🔒 Route protected, redirecting to login');

    // Save current page to return after login
    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);

    // Redirect to login
    window.location.href = 'login.html';
    return false;
  }

  return true;
};

/**
 * Initialize user from legacy localStorage
 * This provides backward compatibility with the old user system
 */
function initLegacyAuth() {
  // If already authenticated with new system, skip
  if (window.auth.isAuthenticated()) {
    return;
  }

  // Try to load from old system
  const oldUser = localStorage.getItem('currentUser');
  if (oldUser) {
    try {
      const user = JSON.parse(oldUser);
      if (user.name && user.email) {
        console.log('🔄 Migrating from legacy auth system');
        window.auth.loginSimple(user.name, user.email);
      }
    } catch (error) {
      console.error('Error migrating legacy auth:', error);
    }
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLegacyAuth);
} else {
  initLegacyAuth();
}

console.log('🔐 Auth Service loaded successfully');
console.log('💡 Access auth via: window.auth');
console.log('💡 Protect routes: protectRoute()');
