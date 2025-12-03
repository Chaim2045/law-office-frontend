// Netlify Function for Task Management API
// Handles CRUD operations for tasks

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Main handler
exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const supabase = getSupabaseClient();
    const path = event.path.replace('/.netlify/functions/tasks', '');

    // GET /api/tasks - List all tasks
    if (event.httpMethod === 'GET' && path === '') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // POST /api/tasks - Create new task
    if (event.httpMethod === 'POST' && path === '') {
      const taskData = JSON.parse(event.body);

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assigned_to,
          assigned_email: taskData.assigned_email,
          priority: taskData.priority,
          category: taskData.category,
          status: taskData.status || 'חדשה',
          deadline: taskData.deadline,
          created_by: taskData.created_by
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data)
      };
    }

    // GET /api/tasks/:id - Get single task
    if (event.httpMethod === 'GET' && path.startsWith('/')) {
      const id = path.substring(1);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // PUT /api/tasks/:id - Update task
    if (event.httpMethod === 'PUT' && path.startsWith('/')) {
      const id = path.substring(1);
      const updates = JSON.parse(event.body);

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // DELETE /api/tasks/:id - Delete task
    if (event.httpMethod === 'DELETE' && path.startsWith('/')) {
      const id = path.substring(1);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        statusCode: 204,
        headers,
        body: ''
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
