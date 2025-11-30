use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::AppState;

pub async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "message": "✅ Law Office API is healthy!",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

pub async fn readiness_check(State(state): State<AppState>) -> Json<Value> {
    // Check database connection
    let db_status = match sqlx::query("SELECT 1").fetch_one(&state.pool).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    Json(json!({
        "status": if db_status == "healthy" { "ready" } else { "not_ready" },
        "database": db_status,
    }))
}
