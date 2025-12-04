// Netlify Function for Task Management API
// Using Supabase REST API directly with fetch

const fetch = require('node-fetch');

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Missing Supabase credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      })
    };
  }

  try {
    console.log('Request:', event.httpMethod, event.path);

    // GET /api/tasks - List all tasks
    if (event.httpMethod === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/tasks?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // POST /api/tasks - Create new task
    if (event.httpMethod === 'POST') {
      const taskData = JSON.parse(event.body);

      const newTask = {
        title: taskData.title,
        description: taskData.description,
        assigned_to: taskData.assigned_to,
        assigned_email: taskData.assigned_email,
        priority: taskData.priority,
        category: taskData.category,
        status: taskData.status || 'חדשה',
        deadline: taskData.deadline,
        created_by: taskData.created_by
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newTask)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data[0])
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
