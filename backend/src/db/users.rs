use crate::models::{CreateUserRequest, User};
use anyhow::Result;
use bcrypt::{hash, verify, DEFAULT_COST};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_user(pool: &PgPool, req: &CreateUserRequest) -> Result<User> {
    let password_hash = hash(&req.password, DEFAULT_COST)?;
    let role = req.role.clone().unwrap_or_else(|| "user".to_string());

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (email, name, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
    )
    .bind(&req.email)
    .bind(&req.name)
    .bind(password_hash)
    .bind(role)
    .fetch_one(pool)
    .await?;

    Ok(user)
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(pool)
        .await?;

    Ok(user)
}

pub async fn get_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(user)
}

pub async fn verify_password(user: &User, password: &str) -> Result<bool> {
    Ok(verify(password, &user.password_hash)?)
}

pub async fn update_last_login(pool: &PgPool, user_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await?;

    Ok(())
}
