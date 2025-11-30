use crate::models::{CreateTaskRequest, Task, UpdateTaskRequest};
use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_task(pool: &PgPool, req: &CreateTaskRequest, task_id: &str) -> Result<Task> {
    let priority = req.priority.clone().unwrap_or_else(|| "רגילה".to_string());

    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (
            task_id, title, description, category,
            assigned_to, assigned_to_email,
            created_by, created_by_email,
            due_date, priority, status,
            attachments_folder_url, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'חדשה', $11, $12)
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.assigned_to)
    .bind(&req.assigned_to_email)
    .bind(&req.created_by)
    .bind(&req.created_by_email)
    .bind(req.due_date)
    .bind(priority)
    .bind(&req.attachments_folder_url)
    .bind(&req.notes)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

pub async fn get_all_tasks(pool: &PgPool) -> Result<Vec<Task>> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}

pub async fn get_task_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Task>> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn get_task_by_task_id(pool: &PgPool, task_id: &str) -> Result<Option<Task>> {
    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE task_id = $1"
    )
    .bind(task_id)
    .fetch_optional(pool)
    .await?;

    Ok(task)
}

pub async fn update_task(pool: &PgPool, id: Uuid, req: &UpdateTaskRequest) -> Result<Task> {
    let mut query = String::from("UPDATE tasks SET ");
    let mut bindings = Vec::new();
    let mut param_count = 1;

    if let Some(title) = &req.title {
        query.push_str(&format!("title = ${}, ", param_count));
        bindings.push(title.as_str());
        param_count += 1;
    }

    if let Some(description) = &req.description {
        query.push_str(&format!("description = ${}, ", param_count));
        bindings.push(description.as_str());
        param_count += 1;
    }

    if let Some(category) = &req.category {
        query.push_str(&format!("category = ${}, ", param_count));
        bindings.push(category.as_str());
        param_count += 1;
    }

    if let Some(assigned_to) = &req.assigned_to {
        query.push_str(&format!("assigned_to = ${}, ", param_count));
        bindings.push(assigned_to.as_str());
        param_count += 1;
    }

    if let Some(assigned_to_email) = &req.assigned_to_email {
        query.push_str(&format!("assigned_to_email = ${}, ", param_count));
        bindings.push(assigned_to_email.as_str());
        param_count += 1;
    }

    if let Some(priority) = &req.priority {
        query.push_str(&format!("priority = ${}, ", param_count));
        bindings.push(priority.as_str());
        param_count += 1;
    }

    if let Some(status) = &req.status {
        query.push_str(&format!("status = ${}, ", param_count));
        bindings.push(status.as_str());
        param_count += 1;
    }

    if let Some(notes) = &req.notes {
        query.push_str(&format!("notes = ${}, ", param_count));
        bindings.push(notes.as_str());
        param_count += 1;
    }

    // Remove trailing comma and space
    query.truncate(query.len() - 2);
    query.push_str(&format!(" WHERE id = ${} RETURNING *", param_count));

    let mut sql_query = sqlx::query_as::<_, Task>(&query);
    for binding in bindings {
        sql_query = sql_query.bind(binding);
    }
    sql_query = sql_query.bind(id);

    let task = sql_query.fetch_one(pool).await?;

    Ok(task)
}

pub async fn delete_task(pool: &PgPool, id: Uuid) -> Result<bool> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_tasks_by_assignee(pool: &PgPool, assignee: &str) -> Result<Vec<Task>> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC"
    )
    .bind(assignee)
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}

pub async fn get_tasks_by_status(pool: &PgPool, status: &str) -> Result<Vec<Task>> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC"
    )
    .bind(status)
    .fetch_all(pool)
    .await?;

    Ok(tasks)
}
