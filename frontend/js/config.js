// ================================================
// ⚙️ API Configuration
// ================================================

const API_CONFIG = {
    // Local development
    LOCAL: 'http://localhost:8000',

    // Production - Netlify Functions
    PRODUCTION: 'https://famous-truffle-5a1846.netlify.app',

    // Current environment
    get BASE_URL() {
        // Auto-detect: if running on localhost, use local API
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return this.LOCAL;
        }
        return this.PRODUCTION;
    }
};

// Export for use in other files
window.API_URL = API_CONFIG.BASE_URL;

console.log('🔧 API Configuration loaded');
console.log('📍 API URL:', window.API_URL);
