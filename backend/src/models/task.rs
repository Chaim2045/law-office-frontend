use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
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
    #[validate(length(min = 1, max = 500))]
    pub title: String,

    pub description: Option<String>,

    #[validate(length(min = 1, max = 100))]
    pub category: String,

    #[validate(length(min = 1, max = 100))]
    pub assigned_to: String,

    #[validate(email)]
    pub assigned_to_email: String,

    #[validate(length(min = 1, max = 100))]
    pub created_by: String,

    #[validate(email)]
    pub created_by_email: String,

    pub due_date: Option<NaiveDate>,

    #[validate(custom = "validate_priority")]
    pub priority: Option<String>,

    pub attachments_folder_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub assigned_to: Option<String>,
    pub assigned_to_email: Option<String>,
    pub due_date: Option<NaiveDate>,

    #[validate(custom = "validate_priority")]
    pub priority: Option<String>,

    #[validate(custom = "validate_status")]
    pub status: Option<String>,

    pub attachments_folder_url: Option<String>,
    pub attachments_count: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
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

impl From<Task> for TaskResponse {
    fn from(task: Task) -> Self {
        Self {
            id: task.id,
            task_id: task.task_id,
            title: task.title,
            description: task.description,
            category: task.category,
            assigned_to: task.assigned_to,
            assigned_to_email: task.assigned_to_email,
            created_by: task.created_by,
            created_by_email: task.created_by_email,
            due_date: task.due_date,
            created_at: task.created_at,
            updated_at: task.updated_at,
            priority: task.priority,
            status: task.status,
            attachments_folder_url: task.attachments_folder_url,
            attachments_count: task.attachments_count,
            notes: task.notes,
        }
    }
}

fn validate_priority(priority: &str) -> Result<(), validator::ValidationError> {
    let valid_priorities = ["נמוכה", "רגילה", "גבוהה", "דחופה"];
    if valid_priorities.contains(&priority) {
        Ok(())
    } else {
        Err(validator::ValidationError::new("invalid_priority"))
    }
}

fn validate_status(status: &str) -> Result<(), validator::ValidationError> {
    let valid_statuses = ["חדשה", "בטיפול", "הושלמה", "בוטלה"];
    if valid_statuses.contains(&status) {
        Ok(())
    } else {
        Err(validator::ValidationError::new("invalid_status"))
    }
}

impl CreateTaskRequest {
    pub fn generate_task_id(&self) -> String {
        let timestamp = chrono::Utc::now().format("%Y%m%d%H%M%S");
        let random: u32 = rand::random();
        format!("TASK-{}-{:04}", timestamp, random % 10000)
    }
}
