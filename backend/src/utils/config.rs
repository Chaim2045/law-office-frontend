use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub smtp_username: String,
    pub smtp_password: String,
    pub smtp_host: String,
    pub smtp_port: String,
    pub jwt_secret: String,
    pub api_base_url: String,
    pub admin_email: String,
    pub rate_limit_requests_per_minute: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            smtp_username: std::env::var("SMTP_USERNAME")
                .unwrap_or_else(|_| "".to_string()),
            smtp_password: std::env::var("SMTP_PASSWORD")
                .unwrap_or_else(|_| "".to_string()),
            smtp_host: std::env::var("SMTP_HOST")
                .unwrap_or_else(|_| "smtp.gmail.com".to_string()),
            smtp_port: std::env::var("SMTP_PORT")
                .unwrap_or_else(|_| "587".to_string()),
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "dev-secret".to_string()),
            api_base_url: std::env::var("API_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:8000".to_string()),
            admin_email: std::env::var("ADMIN_EMAIL")
                .unwrap_or_else(|_| "admin@localhost".to_string()),
            rate_limit_requests_per_minute: std::env::var("RATE_LIMIT_REQUESTS_PER_MINUTE")
                .unwrap_or_else(|_| "60".to_string()),
        }
    }

    pub fn smtp_port_as_u16(&self) -> u16 {
        self.smtp_port.parse().unwrap_or(587)
    }

    pub fn rate_limit_as_u32(&self) -> u32 {
        self.rate_limit_requests_per_minute.parse().unwrap_or(60)
    }
}
