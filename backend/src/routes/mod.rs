use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::{handlers, AppState};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Health endpoints
        .route("/health", get(handlers::health_check))
        .route("/ready", get(handlers::readiness_check))

        // Task endpoints
        .route("/api/tasks", post(handlers::create_task))
        .route("/api/tasks", get(handlers::get_all_tasks))
        .route("/api/tasks/:id", get(handlers::get_task))
        .route("/api/tasks/:id", put(handlers::update_task))
        .route("/api/tasks/:id", delete(handlers::delete_task))
        .route("/api/tasks/assignee/:assignee", get(handlers::get_tasks_by_assignee))
        .route("/api/tasks/status/:status", get(handlers::get_tasks_by_status))

        // Stats endpoints
        .route("/api/stats", get(handlers::get_stats))
        .route("/api/stats/user/:name", get(handlers::get_user_stats))

        // Auth endpoints
        .route("/api/auth/register", post(handlers::register_user))
        .route("/api/auth/login", post(handlers::login))

        .with_state(state)
}
