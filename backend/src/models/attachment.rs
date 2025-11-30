use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Attachment {
    pub id: Uuid,
    pub task_id: Uuid,
    pub file_name: String,
    pub file_url: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub uploaded_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAttachmentRequest {
    pub task_id: Uuid,
    pub file_name: String,
    pub file_url: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
}
