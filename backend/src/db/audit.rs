use crate::models::{AuditLog, CreateAuditLogRequest};
use anyhow::Result;
use sqlx::PgPool;

pub async fn create_audit_log(pool: &PgPool, req: &CreateAuditLogRequest) -> Result<AuditLog> {
    let log = sqlx::query_as::<_, AuditLog>(
        r#"
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(req.user_id)
    .bind(&req.action)
    .bind(&req.entity_type)
    .bind(req.entity_id)
    .bind(&req.changes)
    .bind(&req.ip_address)
    .bind(&req.user_agent)
    .fetch_one(pool)
    .await?;

    Ok(log)
}
