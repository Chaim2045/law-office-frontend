// Netlify Function: Send Web Push Notifications
// Called by Google Apps Script when task status changes

const webpush = require('web-push');

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:haim@ghlawoffice.co.il';
const PUSH_SECRET = process.env.PUSH_SHARED_SECRET;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verify shared secret
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!PUSH_SECRET || token !== PUSH_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Validate VAPID keys
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'VAPID keys not configured' }) };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriptions, title, message, url, icon } = body;

  if (!subscriptions || !subscriptions.length || !title) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: subscriptions, title' }) };
  }

  const payload = JSON.stringify({
    title: title,
    body: message || '',
    icon: icon || '/images/icon-192.png',
    badge: '/images/icon-192.png',
    url: url || '/',
    dir: 'rtl',
    lang: 'he'
  });

  const results = [];
  const expired = [];

  for (const sub of subscriptions) {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      await webpush.sendNotification(subscription, payload);
      results.push({ endpoint: sub.endpoint, status: 'sent' });
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid
        expired.push(sub.endpoint);
        results.push({ endpoint: sub.endpoint, status: 'expired' });
      } else {
        results.push({ endpoint: sub.endpoint, status: 'error', error: error.message });
      }
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'error').length,
      expired: expired,
      results: results
    })
  };
};
