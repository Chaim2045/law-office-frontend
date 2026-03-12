// ================================================
// 🔐 Login Page Logic
// ================================================

function initLoginPage() {
  console.log('🔐 Login page loaded');

  // If already logged in, redirect to dashboard or return URL
  if (window.auth && window.auth.isAuthenticated()) {
    const returnUrl = sessionStorage.getItem('returnUrl') || 'index.html';
    sessionStorage.removeItem('returnUrl');
    console.log('✅ Already authenticated, redirecting to:', returnUrl);
    window.location.href = returnUrl;
    return;
  }

  // Elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const nameChips = document.querySelectorAll('.name-chip');

  // ================================================
  // Quick Login with Name Chips
  // ================================================

  nameChips.forEach(chip => {
    chip.addEventListener('click', async function() {
      const name = this.getAttribute('data-name');
      const email = this.getAttribute('data-email');

      // Visual feedback
      nameChips.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');

      try {
        // Use simple login (no password required for now)
        const user = window.auth.loginSimple(name, email);

        // Show success
        Utils.showToast(`ברוך הבא, ${name}!`, 'success');

        // Redirect after short delay
        setTimeout(() => {
          const returnUrl = sessionStorage.getItem('returnUrl') || 'index.html';
          sessionStorage.removeItem('returnUrl');
          window.location.href = returnUrl;
        }, 500);

      } catch (error) {
        console.error('Login error:', error);
        showError('שגיאה בהתחברות. נסה שוב.');
        this.classList.remove('selected');
      }
    });
  });

  // ================================================
  // Traditional Login Form (for future JWT implementation)
  // ================================================

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation
    if (!email) {
      showError('יש להזין כתובת אימייל');
      emailInput.focus();
      return;
    }

    if (!Utils.validateEmail(email)) {
      showError('כתובת אימייל לא תקינה');
      emailInput.focus();
      return;
    }

    if (!password) {
      showError('יש להזין סיסמה');
      passwordInput.focus();
      return;
    }

    // Show loading
    const originalText = Utils.showLoading(loginBtn, 'מתחבר...');

    try {
      // Try to login with actual credentials
      const user = await window.auth.login(email, password);

      // Success!
      Utils.showToast(`ברוך הבא, ${user.name}!`, 'success');

      // Clear form
      loginForm.reset();

      // Redirect
      setTimeout(() => {
        const returnUrl = sessionStorage.getItem('returnUrl') || 'index.html';
        sessionStorage.removeItem('returnUrl');
        window.location.href = returnUrl;
      }, 500);

    } catch (error) {
      console.error('Login error:', error);

      // Show error message
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        showError('אימייל או סיסמה שגויים');
      } else if (error.message.includes('Failed to fetch')) {
        showError('לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.');
      } else {
        showError(error.message || 'שגיאה בהתחברות');
      }

    } finally {
      // Hide loading
      Utils.hideLoading(loginBtn, originalText);
    }
  });

  // ================================================
  // Helper Functions
  // ================================================

  /**
   * Show error message
   * @param {string} message - Error message
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorMessage.classList.remove('show');
    }, 5000);
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorMessage.classList.remove('show');
  }

  // Clear error on input
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', hideError);
  });

  // ================================================
  // Keyboard shortcuts
  // ================================================

  // Press Enter to submit
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  console.log('✅ Login page ready');
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
