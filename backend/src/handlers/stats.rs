use axum::{extract::{Path, State}, Json};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::{utils::AppError, AppState};

#[derive(Debug, Serialize, FromRow)]
pub struct TaskStats {
    pub total: i64,
    pub new: i64,
    pub in_progress: i64,
    pub completed: i64,
    pub cancelled: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct UserStats {
    pub assignee: String,
    pub total_tasks: i64,
    pub completed_tasks: i64,
    pub pending_tasks: i64,
}

pub async fn get_stats(State(state): State<AppState>) -> Result<Json<TaskStats>, AppError> {
    let stats = sqlx::query_as::<_, TaskStats>(
        r#"
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'חדשה' THEN 1 ELSE 0 END) as new,
            SUM(CASE WHEN status = 'בטיפול' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'הושלמה' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'בוטלה' THEN 1 ELSE 0 END) as cancelled
        FROM tasks
        "#,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(stats))
}

pub async fn get_user_stats(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<UserStats>, AppError> {
    let stats = sqlx::query_as::<_, UserStats>(
        r#"
        SELECT
            assigned_to as assignee,
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 'הושלמה' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN status IN ('חדשה', 'בטיפול') THEN 1 ELSE 0 END) as pending_tasks
        FROM tasks
        WHERE assigned_to = $1
        GROUP BY assigned_to
        "#,
    )
    .bind(&name)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(stats))
}
