// Netlify Function for Task Management API
// Using Supabase REST API directly with fetch
// Implements Adapter Pattern for Frontend-Backend field mapping

const fetch = require('node-fetch');

// ============================================================
// CONFIGURATION
// ============================================================

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// ============================================================
// DATA TRANSFORMATION LAYER (ADAPTER PATTERN)
// ============================================================

/**
 * Maps frontend task data structure to Supabase schema
 * IMPORTANT: Only maps fields that exist in Supabase table!
 * Current Supabase schema fields:
 * - id, title, description, assigned_to, assigned_email
 * - priority, category, status, deadline, created_by
 * - created_at, updated_at
 *
 * @param {Object} frontendTask - Task data from frontend
 * @returns {Object} Supabase-compatible task object
 */
function mapFrontendToSupabase(frontendTask) {
  return {
    // Core fields
    title: frontendTask.title,
    description: frontendTask.description || null,
    category: frontendTask.category,

    // Assignment fields - MAP: assigned_to_email -> assigned_email
    assigned_to: frontendTask.assigned_to,
    assigned_email: frontendTask.assigned_to_email || frontendTask.assigned_email,

    // Creator field (no email field in DB!)
    created_by: frontendTask.created_by,
    // NOTE: created_by_email is not stored in Supabase (field doesn't exist)

    // Date fields - MAP: due_date -> deadline
    deadline: frontendTask.due_date || frontendTask.deadline || null,

    // Status and priority
    priority: frontendTask.priority || 'רגילה',
    status: frontendTask.status || 'חדשה'

    // NOTE: 'notes' field doesn't exist in current Supabase schema
  };
}

/**
 * Maps Supabase response to frontend-expected structure
 * @param {Object} supabaseTask - Task data from Supabase
 * @returns {Object} Frontend-compatible task object
 */
function mapSupabaseToFrontend(supabaseTask) {
  return {
    // Keep original fields
    ...supabaseTask,

    // Add task_id for frontend compatibility (uses 'id' from Supabase)
    task_id: supabaseTask.id,

    // Map back to frontend naming if needed
    assigned_to_email: supabaseTask.assigned_email,
    due_date: supabaseTask.deadline
  };
}

/**
 * Validates required fields for task creation
 * @param {Object} taskData - Task data to validate
 * @throws {Error} If validation fails
 */
function validateTaskData(taskData) {
  const requiredFields = [
    'title',
    'category',
    'assigned_to',
    'assigned_to_email',
    'created_by',
    'priority'
  ];

  const missingFields = requiredFields.filter(field => !taskData[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (taskData.assigned_to_email && !emailRegex.test(taskData.assigned_to_email)) {
    throw new Error('Invalid assigned_to_email format');
  }
  if (taskData.created_by_email && !emailRegex.test(taskData.created_by_email)) {
    throw new Error('Invalid created_by_email format');
  }

  // Validate priority
  const validPriorities = ['נמוכה', 'רגילה', 'גבוהה', 'דחופה'];
  if (taskData.priority && !validPriorities.includes(taskData.priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

exports.handler = async (event) => {
  const startTime = Date.now();

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

  // Environment validation
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server configuration error',
        message: 'Missing required environment variables'
      })
    };
  }

  try {
    console.log(`📥 [${event.httpMethod}] ${event.path}`);

    // ============================================================
    // GET /api/tasks - List all tasks
    // ============================================================
    if (event.httpMethod === 'GET') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/tasks?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Supabase GET error:', data);
        throw new Error(JSON.stringify(data));
      }

      // Transform all tasks to frontend format
      const transformedTasks = data.map(mapSupabaseToFrontend);

      console.log(`✅ Retrieved ${transformedTasks.length} tasks (${Date.now() - startTime}ms)`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedTasks)
      };
    }

    // ============================================================
    // POST /api/tasks - Create new task
    // ============================================================
    if (event.httpMethod === 'POST') {
      const frontendTaskData = JSON.parse(event.body);

      console.log('📋 Received task data:', {
        title: frontendTaskData.title,
        assigned_to: frontendTaskData.assigned_to,
        has_assigned_to_email: !!frontendTaskData.assigned_to_email,
        has_created_by_email: !!frontendTaskData.created_by_email,
        has_due_date: !!frontendTaskData.due_date,
        priority: frontendTaskData.priority
      });

      // Validate incoming data
      try {
        validateTaskData(frontendTaskData);
      } catch (validationError) {
        console.error('❌ Validation error:', validationError.message);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Validation error',
            message: validationError.message
          })
        };
      }

      // Transform frontend data to Supabase schema
      const supabaseTask = mapFrontendToSupabase(frontendTaskData);

      console.log('🔄 Mapped to Supabase schema:', {
        assigned_email: supabaseTask.assigned_email,
        created_by: supabaseTask.created_by,
        deadline: supabaseTask.deadline,
        status: supabaseTask.status,
        priority: supabaseTask.priority
      });

      // Send to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(supabaseTask)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Supabase POST error:', data);
        throw new Error(JSON.stringify(data));
      }

      // Transform response back to frontend format
      const createdTask = mapSupabaseToFrontend(data[0]);

      console.log(`✅ Task created successfully:`, {
        id: createdTask.id,
        task_id: createdTask.task_id,
        duration: `${Date.now() - startTime}ms`
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(createdTask)
      };
    }

    // ============================================================
    // Method not allowed
    // ============================================================
    console.warn(`⚠️ Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        allowed: ['GET', 'POST', 'OPTIONS']
      })
    };

  } catch (error) {
    console.error('❌ Function error:', {
      message: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`
    });

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
