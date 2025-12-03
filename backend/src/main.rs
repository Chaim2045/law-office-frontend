// Law Office Task Management API - Production Ready
mod db;
mod handlers;
mod models;
mod routes;
mod services;
mod utils;

use axum::http::{
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use services::EmailService;
use shuttle_runtime::SecretStore;
use sqlx::PgPool;
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer},
};
use tracing::Level;
use utils::Config;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub email_service: EmailService,
    pub config: Config,
}

#[shuttle_runtime::main]
async fn main(
    #[shuttle_shared_db::Postgres] pool: PgPool,
    #[shuttle_runtime::Secrets] secrets: SecretStore,
) -> shuttle_axum::ShuttleAxum {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_max_level(Level::INFO)
        .compact()
        .init();

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    tracing::info!("✅ Database migrations completed");

    // Load configuration from secrets
    let config = Config {
        smtp_username: secrets
            .get("SMTP_USERNAME")
            .unwrap_or_else(|| "".to_string()),
        smtp_password: secrets
            .get("SMTP_PASSWORD")
            .unwrap_or_else(|| "".to_string()),
        smtp_host: secrets
            .get("SMTP_HOST")
            .unwrap_or_else(|| "smtp.gmail.com".to_string()),
        smtp_port: secrets
            .get("SMTP_PORT")
            .unwrap_or_else(|| "587".to_string()),
        jwt_secret: secrets
            .get("JWT_SECRET")
            .unwrap_or_else(|| "dev-secret-change-this".to_string()),
        api_base_url: secrets
            .get("API_BASE_URL")
            .unwrap_or_else(|| "http://localhost:8000".to_string()),
        admin_email: secrets
            .get("ADMIN_EMAIL")
            .unwrap_or_else(|| "admin@localhost".to_string()),
        rate_limit_requests_per_minute: secrets
            .get("RATE_LIMIT_REQUESTS_PER_MINUTE")
            .unwrap_or_else(|| "60".to_string()),
    };

    // Initialize email service
    let email_service = EmailService::new(
        config.smtp_username.clone(),
        config.smtp_password.clone(),
        config.smtp_host.clone(),
        config.smtp_port_as_u16(),
    );

    // Create application state
    let state = AppState {
        pool,
        email_service,
        config,
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin("*".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION, ACCEPT])
        .allow_credentials(false);

    // Configure tracing
    let trace_layer = TraceLayer::new_for_http()
        .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
        .on_response(DefaultOnResponse::new().level(Level::INFO));

    // Create router
    let router = routes::create_router(state)
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(trace_layer);

    tracing::info!("🚀 Law Office API is starting...");
    tracing::info!("📧 Email service configured");
    tracing::info!("🗄️  Database connected");
    tracing::info!("✅ Server ready!");

    Ok(router.into())
}
