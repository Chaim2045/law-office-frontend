use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    db,
    models::{CreateTaskRequest, TaskResponse, UpdateTaskRequest},
    services::EmailService,
    utils::AppError,
    AppState,
};

pub async fn create_task(
    State(state): State<AppState>,
    Json(payload): Json<CreateTaskRequest>,
) -> Result<Json<TaskResponse>, AppError> {
    // Validate request
    payload.validate()?;

    // Generate task ID
    let task_id = payload.generate_task_id();

    // Create task in database
    let task = db::create_task(&state.pool, &payload, &task_id).await?;

    // Send email notification (async, non-blocking)
    let email_service = state.email_service.clone();
    let task_clone = task.clone();
    tokio::spawn(async move {
        if let Err(e) = email_service.send_task_notification(&task_clone).await {
            tracing::error!("Failed to send email: {:?}", e);
        }
    });

    Ok(Json(task.into()))
}

pub async fn get_all_tasks(
    State(state): State<AppState>,
) -> Result<Json<Vec<TaskResponse>>, AppError> {
    let tasks = db::get_all_tasks(&state.pool).await?;
    let responses: Vec<TaskResponse> = tasks.into_iter().map(|t| t.into()).collect();

    Ok(Json(responses))
}

pub async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<TaskResponse>, AppError> {
    let task = db::get_task_by_id(&state.pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Task with id {} not found", id)))?;

    Ok(Json(task.into()))
}

pub async fn update_task(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTaskRequest>,
) -> Result<Json<TaskResponse>, AppError> {
    // Validate request
    payload.validate()?;

    // Check if task exists
    db::get_task_by_id(&state.pool, id)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Task with id {} not found", id)))?;

    // Update task
    let task = db::update_task(&state.pool, id, &payload).await?;

    // Send update notification (async, non-blocking)
    let email_service = state.email_service.clone();
    let task_clone = task.clone();
    tokio::spawn(async move {
        if let Err(e) = email_service.send_task_update_notification(&task_clone).await {
            tracing::error!("Failed to send update email: {:?}", e);
        }
    });

    Ok(Json(task.into()))
}

pub async fn delete_task(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let deleted = db::delete_task(&state.pool, id).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("Task with id {} not found", id)));
    }

    Ok(Json(json!({
        "message": "Task deleted successfully",
        "id": id
    })))
}

pub async fn get_tasks_by_assignee(
    State(state): State<AppState>,
    Path(assignee): Path<String>,
) -> Result<Json<Vec<TaskResponse>>, AppError> {
    let tasks = db::get_tasks_by_assignee(&state.pool, &assignee).await?;
    let responses: Vec<TaskResponse> = tasks.into_iter().map(|t| t.into()).collect();

    Ok(Json(responses))
}

pub async fn get_tasks_by_status(
    State(state): State<AppState>,
    Path(status): Path<String>,
) -> Result<Json<Vec<TaskResponse>>, AppError> {
    let tasks = db::get_tasks_by_status(&state.pool, &status).await?;
    let responses: Vec<TaskResponse> = tasks.into_iter().map(|t| t.into()).collect();

    Ok(Json(responses))
}
