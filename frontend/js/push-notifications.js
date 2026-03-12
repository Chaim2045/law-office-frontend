// ================================================
// Push Notifications - Web Push subscription management
// ================================================

(function() {
  'use strict';

  // VAPID public key (generated for this project)
  var VAPID_PUBLIC_KEY = 'BBoLNcHskrwAvwufPJFuOWojwqxSVtOQjQi72Y1y3slVNm75HFhFc4ZKRWL-qbW16QV1CZU6bRlTu0sGCZO6NC0';

  // Convert base64 URL to Uint8Array (needed for subscribe)
  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if push is supported
  function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get current subscription
  function getExistingSubscription() {
    return navigator.serviceWorker.ready.then(function(registration) {
      return registration.pushManager.getSubscription();
    });
  }

  // Subscribe to push notifications
  function subscribeToPush() {
    return navigator.serviceWorker.ready.then(function(registration) {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    });
  }

  // Send subscription to server (Google Apps Script)
  function saveSubscriptionToServer(subscription) {
    var user = window.auth ? window.auth.getCurrentUser() : null;
    if (!user || !user.email) return Promise.resolve();

    var sub = subscription.toJSON();
    var params = new URLSearchParams();
    params.append('action', 'savePushSubscription');
    params.append('email', user.email);
    params.append('name', user.name || '');
    params.append('endpoint', sub.endpoint);
    params.append('p256dh', sub.keys.p256dh);
    params.append('auth', sub.keys.auth);

    return fetch(window.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      if (data.status === 'success') {
        console.log('Push subscription saved to server');
        localStorage.setItem('push_subscribed', 'true');
      }
    });
  }

  // Show custom in-app prompt for notifications
  function showNotificationPrompt() {
    // Don't show if already dismissed recently
    var dismissed = localStorage.getItem('push_prompt_dismissed');
    if (dismissed) {
      var dismissedDate = new Date(parseInt(dismissed));
      var daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // Don't re-prompt for 7 days
    }

    var prompt = document.createElement('div');
    prompt.id = 'pushPrompt';
    prompt.innerHTML =
      '<div class="push-prompt-overlay">' +
        '<div class="push-prompt-card">' +
          '<div class="push-prompt-icon"><i class="fas fa-bell"></i></div>' +
          '<div class="push-prompt-title">הפעלת התראות</div>' +
          '<div class="push-prompt-text">קבל התראות כשמשימה מושלמת, מוחזרת להשלמה, או באיחור</div>' +
          '<div class="push-prompt-buttons">' +
            '<button class="push-prompt-btn push-prompt-enable" id="pushPromptEnable">הפעל התראות</button>' +
            '<button class="push-prompt-btn push-prompt-later" id="pushPromptLater">לא עכשיו</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(prompt);

    document.getElementById('pushPromptEnable').addEventListener('click', function() {
      prompt.remove();
      requestAndSubscribe();
    });

    document.getElementById('pushPromptLater').addEventListener('click', function() {
      prompt.remove();
      localStorage.setItem('push_prompt_dismissed', Date.now().toString());
    });
  }

  // Request permission and subscribe
  function requestAndSubscribe() {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        subscribeToPush().then(function(subscription) {
          return saveSubscriptionToServer(subscription);
        }).catch(function(error) {
          console.error('Push subscription failed:', error);
        });
      }
    });
  }

  // Main initialization
  function initPushNotifications() {
    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return;
    }

    // Must be authenticated
    if (!window.auth || !window.auth.isAuthenticated()) return;

    // Check current permission state
    if (Notification.permission === 'granted') {
      // Already granted - make sure we have a subscription
      getExistingSubscription().then(function(subscription) {
        if (subscription) {
          // Already subscribed - update server if needed
          if (!localStorage.getItem('push_subscribed')) {
            saveSubscriptionToServer(subscription);
          }
        } else {
          // Permission granted but not subscribed - subscribe now
          subscribeToPush().then(function(newSub) {
            return saveSubscriptionToServer(newSub);
          }).catch(function(error) {
            console.error('Push re-subscription failed:', error);
          });
        }
      });
    } else if (Notification.permission === 'default') {
      // Not yet asked - show our custom prompt after a short delay
      setTimeout(showNotificationPrompt, 2000);
    }
    // If 'denied', do nothing - user explicitly blocked notifications
  }

  // Expose for manual triggering
  window.pushNotifications = {
    init: initPushNotifications,
    promptIfNeeded: function() {
      if (!isPushSupported()) return;
      if (Notification.permission === 'default') {
        showNotificationPrompt();
      } else if (Notification.permission === 'granted') {
        getExistingSubscription().then(function(subscription) {
          if (!subscription) {
            requestAndSubscribe();
          }
        });
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initPushNotifications, 1000);
    });
  } else {
    setTimeout(initPushNotifications, 1000);
  }

})();
