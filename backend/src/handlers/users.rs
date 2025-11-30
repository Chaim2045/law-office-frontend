use axum::{extract::State, Json};
use validator::Validate;

use crate::{
    db,
    models::{CreateUserRequest, LoginRequest, LoginResponse, UserResponse},
    utils::{create_jwt, verify_jwt, AppError, Claims},
    AppState,
};

pub async fn register_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    // Validate request
    payload.validate()?;

    // Check if user already exists
    if let Some(_) = db::get_user_by_email(&state.pool, &payload.email).await? {
        return Err(AppError::BadRequest("User already exists".to_string()));
    }

    // Create user
    let user = db::create_user(&state.pool, &payload).await?;

    Ok(Json(user.into()))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    // Validate request
    payload.validate()?;

    // Get user by email
    let user = db::get_user_by_email(&state.pool, &payload.email)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    if !db::verify_password(&user, &payload.password).await? {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    // Check if user is active
    if !user.is_active {
        return Err(AppError::Forbidden("User account is disabled".to_string()));
    }

    // Update last login
    db::update_last_login(&state.pool, user.id).await?;

    // Create JWT
    let claims = Claims::new(user.id, user.email.clone(), user.role.clone());
    let token = create_jwt(&claims, &state.config.jwt_secret)?;

    Ok(Json(LoginResponse {
        token,
        user: user.into(),
    }))
}

pub async fn verify_token(
    State(state): State<AppState>,
    token: String,
) -> Result<Json<Claims>, AppError> {
    let claims = verify_jwt(&token, &state.config.jwt_secret)?;
    Ok(Json(claims))
}
