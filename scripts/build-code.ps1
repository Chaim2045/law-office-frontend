# ================================================
# 🚀 Build Code - Law Office System
# ================================================
# יוצר את כל קבצי הקוד ל-Shuttle Project
#
# @version 1.0.0
# ================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 יוצר קבצי קוד - Law Office System" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# נתיב הפרויקט
$projectPath = $env:LAW_OFFICE_PROJECT_PATH
if (-not $projectPath) {
    $projectPath = "c:\Users\haim\law-office-system\shuttle-law-office"
}

Write-Host "📁 נתיב פרויקט: $projectPath" -ForegroundColor Gray
Write-Host ""

# מעבר לתיקייה
Set-Location $projectPath

# ================================================
# 1. Database Migration
# ================================================
Write-Host "🗄️  יוצר Database Migration..." -ForegroundColor Cyan

$migration = @"
-- ================================================
-- Law Office Task Management System
-- Initial Database Schema
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(50) UNIQUE NOT NULL,

    -- Task Details
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,

    -- Assignment
    assigned_to VARCHAR(100) NOT NULL,
    assigned_to_email VARCHAR(255) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_by_email VARCHAR(255) NOT NULL,

    -- Dates
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Priority & Status
    priority VARCHAR(50) DEFAULT 'רגילה',
    status VARCHAR(50) DEFAULT 'חדשה',

    -- Files
    attachments_folder_url TEXT,
    attachments_count INTEGER DEFAULT 0,

    -- Additional Info
    notes TEXT,

    -- Indexes
    CONSTRAINT chk_status CHECK (status IN ('חדשה', 'בטיפול', 'הושלמה', 'בוטלה')),
    CONSTRAINT chk_priority CHECK (priority IN ('נמוכה', 'רגילה', 'גבוהה', 'דחופה'))
);

-- Indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_task_id ON tasks(task_id);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX idx_attachments_task_id ON attachments(task_id);

-- Updated trigger for tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS ${'$'}${'$'}
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
${'$'}${'$'} LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE tasks IS 'משימות משרד עורכי דין';
COMMENT ON TABLE attachments IS 'קבצים מצורפים למשימות';
"@

Set-Content -Path "migrations\001_initial_schema.sql" -Value $migration
Write-Host "   ✅ Migration נוצר!" -ForegroundColor Green

# ================================================
# 2. Main.rs - Entry Point
# ================================================
Write-Host ""
Write-Host "📝 יוצר main.rs..." -ForegroundColor Cyan

$mainRs = @"
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use shuttle_axum::ShuttleAxum;
use shuttle_runtime::SecretStore;
use sqlx::PgPool;
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use std::sync::Arc;

mod models;
mod routes;
mod services;
mod handlers;
mod db;
mod utils;

use routes::tasks;
use routes::stats;
use services::email::EmailService;

// Application State
pub struct AppState {
    pub db: PgPool,
    pub email_service: EmailService,
}

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres] db: PgPool,
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> ShuttleAxum {
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .expect("Failed to run migrations");

    tracing::info!("✅ Database migrations completed");

    // Initialize email service
    let email_service = EmailService::new(
        secrets.get("SMTP_HOST").expect("SMTP_HOST not set"),
        secrets.get("SMTP_PORT").expect("SMTP_PORT not set").parse().unwrap(),
        secrets.get("SMTP_USERNAME").expect("SMTP_USERNAME not set"),
        secrets.get("SMTP_PASSWORD").expect("SMTP_PASSWORD not set"),
        secrets.get("SMTP_FROM").expect("SMTP_FROM not set"),
        secrets.get("ADMIN_EMAIL").unwrap_or_default(),
        secrets.get("SECRETARY_EMAIL").unwrap_or_default(),
    );

    tracing::info!("✅ Email service initialized");

    // Create shared state
    let state = Arc::new(AppState {
        db,
        email_service,
    });

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let router = Router::new()
        // Health check
        .route("/health", get(health_check))

        // Task routes
        .route("/api/tasks", post(tasks::create_task))
        .route("/api/tasks", get(tasks::get_tasks))
        .route("/api/tasks/:id", get(tasks::get_task))
        .route("/api/tasks/:id", put(tasks::update_task))
        .route("/api/tasks/:id", delete(tasks::delete_task))

        // Stats routes
        .route("/api/stats", get(stats::get_stats))
        .route("/api/stats/user/:name", get(stats::get_user_stats))

        // Middleware
        .layer(cors)
        .layer(TraceLayer::new_for_http())

        // State
        .with_state(state);

    tracing::info!("🚀 Server ready!");

    Ok(router.into())
}

// Health check endpoint
async fn health_check() -> &'static str {
    "✅ Law Office API is healthy!"
}
"@

Set-Content -Path "src\main.rs" -Value $mainRs
Write-Host "   ✅ main.rs נוצר!" -ForegroundColor Green

# ================================================
# 3. Models - Task
# ================================================
Write-Host ""
Write-Host "📦 יוצר models..." -ForegroundColor Cyan

$taskModel = @"
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub task_id: String,
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub assigned_to: String,
    pub assigned_to_email: String,
    pub created_by: String,
    pub created_by_email: String,
    pub due_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub priority: String,
    pub status: String,
    pub attachments_folder_url: Option<String>,
    pub attachments_count: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTaskRequest {
    #[validate(length(min = 1, message = "כותרת חובה"))]
    pub title: String,

    pub description: Option<String>,

    #[validate(length(min = 1, message = "קטגוריה חובה"))]
    pub category: String,

    #[validate(length(min = 1, message = "משתמש חובה"))]
    pub assigned_to: String,

    #[validate(email(message = "אימייל לא תקין"))]
    pub assigned_to_email: String,

    #[validate(length(min = 1, message = "יוצר חובה"))]
    pub created_by: String,

    #[validate(email(message = "אימייל לא תקין"))]
    pub created_by_email: String,

    pub due_date: Option<NaiveDate>,
    pub priority: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub notes: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub status: String,
    pub task_id: String,
    pub message: String,
    pub processing_time: u128,
}

#[derive(Debug, Serialize)]
pub struct TasksListResponse {
    pub tasks: Vec<Task>,
    pub total: usize,
    pub load_time: u128,
}

impl Task {
    pub fn generate_task_id() -> String {
        let now = Utc::now();
        format!("TASK-{}", now.format("%Y%m%d-%H%M%S"))
    }
}
"@

Set-Content -Path "src\models\task.rs" -Value $taskModel

$modelsModRs = @"
pub mod task;
"@

Set-Content -Path "src\models\mod.rs" -Value $modelsModRs
Write-Host "   ✅ models/task.rs נוצר!" -ForegroundColor Green

# ================================================
# 4. Routes - Tasks
# ================================================
Write-Host ""
Write-Host "🛣️  יוצר routes..." -ForegroundColor Cyan

$tasksRoute = @"
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;
use validator::Validate;

use crate::models::task::{CreateTaskRequest, UpdateTaskRequest, Task, TaskResponse, TasksListResponse};
use crate::AppState;

/// Create a new task
pub async fn create_task(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateTaskRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let start = Instant::now();

    // Validate input
    payload.validate()
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Validation error: {}", e)))?;

    // Generate task ID
    let task_id = Task::generate_task_id();

    // Set defaults
    let priority = payload.priority.unwrap_or_else(|| "רגילה".to_string());
    let status = "חדשה".to_string();

    // Insert into database
    let result = sqlx::query!(
        r#"
        INSERT INTO tasks (
            task_id, title, description, category,
            assigned_to, assigned_to_email,
            created_by, created_by_email,
            due_date, priority, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
        "#,
        task_id,
        payload.title,
        payload.description,
        payload.category,
        payload.assigned_to,
        payload.assigned_to_email,
        payload.created_by,
        payload.created_by_email,
        payload.due_date,
        priority,
        status,
        payload.notes
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    // Send email asynchronously (spawn task to not block response)
    let email_service = state.email_service.clone();
    let task_data = (
        task_id.clone(),
        payload.title.clone(),
        payload.assigned_to.clone(),
        payload.assigned_to_email.clone(),
        payload.created_by.clone(),
    );

    tokio::spawn(async move {
        if let Err(e) = email_service.send_new_task_email(
            &task_data.0,
            &task_data.1,
            &task_data.2,
            &task_data.3,
            &task_data.4,
        ).await {
            tracing::error!("Failed to send email: {}", e);
        }
    });

    tracing::info!("✅ Task created: {}", task_id);

    let processing_time = start.elapsed().as_millis();

    Ok(Json(TaskResponse {
        status: "success".to_string(),
        task_id,
        message: "המשימה נוצרה בהצלחה!".to_string(),
        processing_time,
    }))
}

/// Get all tasks
pub async fn get_tasks(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let start = Instant::now();

    let tasks = sqlx::query_as!(
        Task,
        r#"
        SELECT * FROM tasks
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    let total = tasks.len();
    let load_time = start.elapsed().as_millis();

    Ok(Json(TasksListResponse {
        tasks,
        total,
        load_time,
    }))
}

/// Get single task
pub async fn get_task(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let task = sqlx::query_as!(
        Task,
        r#"
        SELECT * FROM tasks
        WHERE task_id = $1 OR id::text = $1
        "#,
        id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Task not found".to_string()))?;

    Ok(Json(task))
}

/// Update task
pub async fn update_task(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTaskRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    // Build dynamic update query
    let mut query = String::from("UPDATE tasks SET updated_at = CURRENT_TIMESTAMP");
    let mut params: Vec<String> = vec![];
    let mut param_count = 1;

    if let Some(status) = &payload.status {
        query.push_str(&format!(", status = ${'$'}{}", param_count));
        params.push(status.clone());
        param_count += 1;
    }

    if let Some(priority) = &payload.priority {
        query.push_str(&format!(", priority = ${'$'}{}", param_count));
        params.push(priority.clone());
        param_count += 1;
    }

    if let Some(notes) = &payload.notes {
        query.push_str(&format!(", notes = ${'$'}{}", param_count));
        params.push(status.clone());
        param_count += 1;
    }

    if let Some(description) = &payload.description {
        query.push_str(&format!(", description = ${'$'}{}", param_count));
        params.push(description.clone());
        param_count += 1;
    }

    query.push_str(&format!(" WHERE task_id = ${'$'}{} OR id::text = ${'$'}{}", param_count, param_count));

    // Execute update
    let result = sqlx::query(&query);

    // This is simplified - in production, use a query builder or macro
    let rows_affected = sqlx::query!(
        r#"
        UPDATE tasks
        SET updated_at = CURRENT_TIMESTAMP,
            status = COALESCE($1, status),
            priority = COALESCE($2, priority),
            notes = COALESCE($3, notes),
            description = COALESCE($4, description)
        WHERE task_id = $5 OR id::text = $5
        "#,
        payload.status,
        payload.priority,
        payload.notes,
        payload.description,
        id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Task not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "המשימה עודכנה בהצלחה"
    })))
}

/// Delete task
pub async fn delete_task(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let rows_affected = sqlx::query!(
        r#"
        DELETE FROM tasks
        WHERE task_id = $1 OR id::text = $1
        "#,
        id
    )
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    .rows_affected();

    if rows_affected == 0 {
        return Err((StatusCode::NOT_FOUND, "Task not found".to_string()));
    }

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "המשימה נמחקה בהצלחה"
    })))
}
"@

Set-Content -Path "src\routes\tasks.rs" -Value $tasksRoute

# Stats route
$statsRoute = @"
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Serialize;
use std::sync::Arc;

use crate::AppState;

#[derive(Debug, Serialize)]
pub struct Stats {
    pub total_tasks: i64,
    pub by_status: Vec<StatusCount>,
    pub by_user: Vec<UserCount>,
}

#[derive(Debug, Serialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct UserCount {
    pub user: String,
    pub count: i64,
}

pub async fn get_stats(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let total_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks")
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    let by_status = sqlx::query_as!(
        StatusCount,
        r#"
        SELECT status, COUNT(*) as "count!"
        FROM tasks
        GROUP BY status
        ORDER BY count DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    let by_user = sqlx::query_as!(
        UserCount,
        r#"
        SELECT assigned_to as "user!", COUNT(*) as "count!"
        FROM tasks
        GROUP BY assigned_to
        ORDER BY count DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    Ok(Json(Stats {
        total_tasks,
        by_status,
        by_user,
    }))
}

pub async fn get_user_stats(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let tasks = sqlx::query_as!(
        StatusCount,
        r#"
        SELECT status, COUNT(*) as "count!"
        FROM tasks
        WHERE assigned_to = $1
        GROUP BY status
        "#,
        name
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    Ok(Json(tasks))
}
"@

Set-Content -Path "src\routes\stats.rs" -Value $statsRoute

$routesModRs = @"
pub mod tasks;
pub mod stats;
"@

Set-Content -Path "src\routes\mod.rs" -Value $routesModRs
Write-Host "   ✅ routes נוצרו!" -ForegroundColor Green

# ================================================
# 5. Email Service
# ================================================
Write-Host ""
Write-Host "📧 יוצר email service..." -ForegroundColor Cyan

$emailService = @"
use lettre::{
    message::{header::ContentType, MessageBuilder},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};
use anyhow::Result;

#[derive(Clone)]
pub struct EmailService {
    smtp_host: String,
    smtp_port: u16,
    smtp_username: String,
    smtp_password: String,
    from_email: String,
    admin_email: String,
    secretary_email: String,
}

impl EmailService {
    pub fn new(
        smtp_host: String,
        smtp_port: u16,
        smtp_username: String,
        smtp_password: String,
        from_email: String,
        admin_email: String,
        secretary_email: String,
    ) -> Self {
        Self {
            smtp_host,
            smtp_port,
            smtp_username,
            smtp_password,
            from_email,
            admin_email,
            secretary_email,
        }
    }

    async fn send_email(&self, to: &str, subject: &str, body: &str) -> Result<()> {
        let email = Message::builder()
            .from(self.from_email.parse()?)
            .to(to.parse()?)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
            .body(body.to_string())?;

        let creds = Credentials::new(
            self.smtp_username.clone(),
            self.smtp_password.clone(),
        );

        let mailer: AsyncSmtpTransport<Tokio1Executor> =
            AsyncSmtpTransport::<Tokio1Executor>::relay(&self.smtp_host)?
                .port(self.smtp_port)
                .credentials(creds)
                .build();

        mailer.send(email).await?;
        Ok(())
    }

    pub async fn send_new_task_email(
        &self,
        task_id: &str,
        title: &str,
        assigned_to: &str,
        assigned_to_email: &str,
        created_by: &str,
    ) -> Result<()> {
        let subject = format!("📋 משימה חדשה: {}", title);

        let body = format!(
            r#"
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        direction: rtl;
                        text-align: right;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: white;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }}
                    .task-details {{
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 15px 0;
                    }}
                    .footer {{
                        margin-top: 30px;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📋 משימה חדשה הוקצתה אליך</h2>
                    </div>

                    <div class="task-details">
                        <p><strong>🔖 מזהה משימה:</strong> {}</p>
                        <p><strong>📝 כותרת:</strong> {}</p>
                        <p><strong>👤 הוקצה ל:</strong> {}</p>
                        <p><strong>👨‍💼 נוצר על ידי:</strong> {}</p>
                    </div>

                    <p>אנא התחבר למערכת לצפייה בפרטים המלאים.</p>

                    <div class="footer">
                        <p>מערכת ניהול משימות - משרד עורכי דין GH</p>
                        <p>נשלח אוטומטית - אל תשיב למייל זה</p>
                    </div>
                </div>
            </body>
            </html>
            "#,
            task_id, title, assigned_to, created_by
        );

        // Send to assigned user
        self.send_email(assigned_to_email, &subject, &body).await?;

        // Send to admin
        if !self.admin_email.is_empty() {
            self.send_email(&self.admin_email, &subject, &body).await?;
        }

        // Send to secretary
        if !self.secretary_email.is_empty() {
            self.send_email(&self.secretary_email, &subject, &body).await?;
        }

        tracing::info!("✅ Email sent for task: {}", task_id);
        Ok(())
    }
}
"@

Set-Content -Path "src\services\email.rs" -Value $emailService

$servicesModRs = @"
pub mod email;
"@

Set-Content -Path "src\services\mod.rs" -Value $servicesModRs
Write-Host "   ✅ email service נוצר!" -ForegroundColor Green

# ================================================
# 6. Handlers (placeholder)
# ================================================
Write-Host ""
Write-Host "🎮 יוצר handlers..." -ForegroundColor Cyan

$handlersModRs = @"
// Handlers will be added here as needed
"@

Set-Content -Path "src\handlers\mod.rs" -Value $handlersModRs
Write-Host "   ✅ handlers נוצרו!" -ForegroundColor Green

# ================================================
# 7. Database utilities
# ================================================
Write-Host ""
Write-Host "🗄️  יוצר db utilities..." -ForegroundColor Cyan

$dbModRs = @"
// Database utilities will be added here as needed
"@

Set-Content -Path "src\db\mod.rs" -Value $dbModRs
Write-Host "   ✅ db utilities נוצרו!" -ForegroundColor Green

# ================================================
# 8. Utils
# ================================================
Write-Host ""
Write-Host "🔧 יוצר utils..." -ForegroundColor Cyan

$utilsModRs = @"
// Utility functions will be added here as needed
"@

Set-Content -Path "src\utils\mod.rs" -Value $utilsModRs
Write-Host "   ✅ utils נוצרו!" -ForegroundColor Green

# ================================================
# סיכום
# ================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ כל קבצי הקוד נוצרו בהצלחה!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 נוצרו:" -ForegroundColor Yellow
Write-Host "   ✅ migrations/001_initial_schema.sql" -ForegroundColor Green
Write-Host "   ✅ src/main.rs" -ForegroundColor Green
Write-Host "   ✅ src/models/task.rs" -ForegroundColor Green
Write-Host "   ✅ src/routes/tasks.rs" -ForegroundColor Green
Write-Host "   ✅ src/routes/stats.rs" -ForegroundColor Green
Write-Host "   ✅ src/services/email.rs" -ForegroundColor Green
Write-Host "   ✅ src/handlers/mod.rs" -ForegroundColor Green
Write-Host "   ✅ src/db/mod.rs" -ForegroundColor Green
Write-Host "   ✅ src/utils/mod.rs" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 השלבים הבאים:" -ForegroundColor Yellow
Write-Host "   1. ערוך את Secrets.dev.toml עם פרטי SMTP אמיתיים" -ForegroundColor White
Write-Host "   2. הרץ: cargo shuttle run (להרצה מקומית)" -ForegroundColor White
Write-Host "   3. בדוק: http://localhost:8000/health" -ForegroundColor White
Write-Host "   4. בדוק: http://localhost:8000/api/tasks (POST/GET)" -ForegroundColor White
Write-Host "   5. Deploy: cargo shuttle deploy" -ForegroundColor White
Write-Host ""

Write-Host "💡 טיפים:" -ForegroundColor Cyan
Write-Host "   • cargo check - בדיקת קוד" -ForegroundColor Gray
Write-Host "   • cargo build - בניית הפרויקט" -ForegroundColor Gray
Write-Host "   • cargo test - הרצת טסטים" -ForegroundColor Gray
Write-Host "   • cargo shuttle logs - צפייה בלוגים" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 המערכת מוכנה לפיתוח!" -ForegroundColor Green
Write-Host ""

Write-Host "לחץ Enter להמשך..."
Read-Host
