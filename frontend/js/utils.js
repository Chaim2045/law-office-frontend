// ================================================
// 🛠️ Utility Functions - Shared across the app
// ================================================

const Utils = {
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showToast(message, type = 'success', duration = 3000) {
        // Remove existing toast if any
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = `toast toast-${type}`;

        // Toast styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 400px;
            font-size: 14px;
        `;

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.style.color = '#ffffff';

        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ',
            warning: '⚠'
        };
        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px; font-weight: bold;">${icon}</span>
                <span>${message}</span>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        if (!document.getElementById('toast-animations')) {
            style.id = 'toast-animations';
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    },

    /**
     * Show a modal by ID
     * @param {string} modalId - The ID of the modal element
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            console.warn(`Modal with ID "${modalId}" not found`);
        }
    },

    /**
     * Hide a modal by ID
     * @param {string} modalId - The ID of the modal element
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scrolling
        } else {
            console.warn(`Modal with ID "${modalId}" not found`);
        }
    },

    /**
     * Format a date object to Hebrew format
     * @param {Date|string} date - Date to format
     * @param {string} format - Format style: 'short', 'long', 'iso'
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'short') {
        if (!date) return '';

        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date:', date);
            return '';
        }

        switch (format) {
            case 'short':
                // DD/MM/YYYY
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}/${month}/${year}`;

            case 'long':
                // Hebrew long format
                return dateObj.toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

            case 'iso':
                // YYYY-MM-DD (for input[type="date"])
                return dateObj.toISOString().split('T')[0];

            default:
                return dateObj.toLocaleDateString('he-IL');
        }
    },

    /**
     * Format a date to relative time (e.g., "לפני 5 דקות")
     * @param {Date|string} date - Date to format
     * @returns {string} Relative time string
     */
    formatRelativeTime(date) {
        if (!date) return '';

        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'עכשיו';
        if (diffMin < 60) return `לפני ${diffMin} דקות`;
        if (diffHour < 24) return `לפני ${diffHour} שעות`;
        if (diffDay < 7) return `לפני ${diffDay} ימים`;

        return this.formatDate(dateObj, 'short');
    },

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        if (!email) return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.trim());
    },

    /**
     * Validate required field
     * @param {string} value - Value to validate
     * @param {string} fieldName - Name of the field for error message
     * @returns {Object} { valid: boolean, message: string }
     */
    validateRequired(value, fieldName) {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        if (!trimmedValue || trimmedValue === '') {
            return {
                valid: false,
                message: `${fieldName} הוא שדה חובה`
            };
        }

        return { valid: true, message: '' };
    },

    /**
     * Show loading state on a button
     * @param {HTMLElement} buttonElement - The button element
     * @param {string} loadingText - Text to show while loading
     * @returns {string} Original button text (for later restoration)
     */
    showLoading(buttonElement, loadingText = 'טוען...') {
        if (!buttonElement) {
            console.warn('Button element not provided to showLoading');
            return '';
        }

        const originalText = buttonElement.textContent;
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.6';
        buttonElement.style.cursor = 'not-allowed';
        buttonElement.textContent = loadingText;

        // Add spinner if not exists
        if (!buttonElement.querySelector('.spinner')) {
            const spinner = document.createElement('span');
            spinner.className = 'spinner';
            spinner.style.cssText = `
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-left: 8px;
                vertical-align: middle;
            `;
            buttonElement.appendChild(spinner);

            // Add spin animation if not exists
            if (!document.getElementById('spinner-animation')) {
                const style = document.createElement('style');
                style.id = 'spinner-animation';
                style.textContent = `
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        return originalText;
    },

    /**
     * Hide loading state on a button
     * @param {HTMLElement} buttonElement - The button element
     * @param {string} originalText - Original button text to restore
     */
    hideLoading(buttonElement, originalText) {
        if (!buttonElement) {
            console.warn('Button element not provided to hideLoading');
            return;
        }

        buttonElement.disabled = false;
        buttonElement.style.opacity = '1';
        buttonElement.style.cursor = 'pointer';
        buttonElement.textContent = originalText;

        // Remove spinner
        const spinner = buttonElement.querySelector('.spinner');
        if (spinner) {
            spinner.remove();
        }
    },

    /**
     * Debounce function - delays execution until after wait time
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function - limits execution to once per wait time
     * @param {Function} func - Function to throttle
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, wait = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, wait);
            }
        };
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<void>}
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('הועתק ללוח', 'success', 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showToast('שגיאה בהעתקה', 'error');
        }
    },

    /**
     * Scroll to element smoothly
     * @param {string|HTMLElement} element - Element or selector
     * @param {Object} options - Scroll options
     */
    scrollTo(element, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                ...options
            });
        }
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    isInViewport(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// Export for use in other files
window.Utils = Utils;

console.log('🛠️ Utils.js loaded successfully');
