use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::utils::errors::AppError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,  // User ID
    pub email: String,
    pub role: String,
    pub exp: usize,   // Expiration time
    pub iat: usize,   // Issued at
}

impl Claims {
    pub fn new(user_id: Uuid, email: String, role: String) -> Self {
        let now = Utc::now();
        let exp = now + Duration::hours(24);

        Self {
            sub: user_id.to_string(),
            email,
            role,
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
        }
    }
}

pub fn create_jwt(claims: &Claims, secret: &str) -> Result<String, AppError> {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::InternalServerError(format!("Failed to create JWT: {}", e)))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| AppError::Unauthorized(format!("Invalid token: {}", e)))?;

    Ok(token_data.claims)
}

pub fn extract_token_from_header(auth_header: Option<&str>) -> Result<String, AppError> {
    let auth_header = auth_header.ok_or_else(|| {
        AppError::Unauthorized("Missing authorization header".to_string())
    })?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized(
            "Invalid authorization header format".to_string(),
        ));
    }

    Ok(auth_header[7..].to_string())
}
