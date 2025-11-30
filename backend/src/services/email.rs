use crate::models::Task;
use anyhow::Result;
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

#[derive(Clone)]
pub struct EmailService {
    smtp_username: String,
    smtp_password: String,
    smtp_host: String,
    smtp_port: u16,
}

impl EmailService {
    pub fn new(username: String, password: String, host: String, port: u16) -> Self {
        Self {
            smtp_username: username,
            smtp_password: password,
            smtp_host: host,
            smtp_port: port,
        }
    }

    pub async fn send_task_notification(&self, task: &Task) -> Result<()> {
        let subject = format!("משימה חדשה: {}", task.title);
        let body = self.create_task_email_body(task);

        self.send_email(&task.assigned_to_email, &subject, &body)
            .await
    }

    pub async fn send_task_update_notification(&self, task: &Task) -> Result<()> {
        let subject = format!("עדכון במשימה: {}", task.title);
        let body = self.create_task_update_email_body(task);

        self.send_email(&task.assigned_to_email, &subject, &body)
            .await
    }

    async fn send_email(&self, to: &str, subject: &str, body: &str) -> Result<()> {
        let email = Message::builder()
            .from(self.smtp_username.parse()?)
            .to(to.parse()?)
            .subject(subject)
            .header(ContentType::TEXT_HTML)
            .body(body.to_string())?;

        let creds = Credentials::new(
            self.smtp_username.clone(),
            self.smtp_password.clone(),
        );

        let mailer = SmtpTransport::starttls_relay(&self.smtp_host)?
            .port(self.smtp_port)
            .credentials(creds)
            .build();

        // Send email in background (non-blocking)
        let mailer_clone = mailer.clone();
        let email_clone = email.clone();

        tokio::spawn(async move {
            match mailer_clone.send(&email_clone) {
                Ok(_) => tracing::info!("Email sent successfully to {}", to),
                Err(e) => tracing::error!("Failed to send email: {:?}", e),
            }
        });

        Ok(())
    }

    fn create_task_email_body(&self, task: &Task) -> String {
        format!(
            r#"
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
        .container {{ background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        .task-info {{ background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #34495e; }}
        .value {{ color: #2c3e50; margin-bottom: 10px; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔔 משימה חדשה נוצרה</h1>

        <div class="task-info">
            <div class="value"><span class="label">מזהה משימה:</span> {}</div>
            <div class="value"><span class="label">כותרת:</span> {}</div>
            <div class="value"><span class="label">תיאור:</span> {}</div>
            <div class="value"><span class="label">קטגוריה:</span> {}</div>
            <div class="value"><span class="label">עדיפות:</span> {}</div>
            <div class="value"><span class="label">תאריך יעד:</span> {}</div>
            <div class="value"><span class="label">נוצר על ידי:</span> {} ({})</div>
        </div>

        <p style="text-align: center; margin-top: 30px;">
            <a href="#" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                צפה במשימה
            </a>
        </p>

        <div class="footer">
            <p>מערכת ניהול משימות - משרד עורכי דין</p>
            <p>⚖️ GH Law Office</p>
        </div>
    </div>
</body>
</html>
            "#,
            task.task_id,
            task.title,
            task.description.as_deref().unwrap_or("אין תיאור"),
            task.category,
            task.priority,
            task.due_date.map_or("לא צוין".to_string(), |d| d.to_string()),
            task.created_by,
            task.created_by_email
        )
    }

    fn create_task_update_email_body(&self, task: &Task) -> String {
        format!(
            r#"
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
        .container {{ background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #e67e22; padding-bottom: 10px; }}
        .task-info {{ background-color: #fef5e7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .label {{ font-weight: bold; color: #34495e; }}
        .value {{ color: #2c3e50; margin-bottom: 10px; }}
        .status {{ display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; }}
        .status-new {{ background-color: #3498db; }}
        .status-in-progress {{ background-color: #f39c12; }}
        .status-completed {{ background-color: #27ae60; }}
        .status-cancelled {{ background-color: #95a5a6; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 עדכון במשימה</h1>

        <div class="task-info">
            <div class="value"><span class="label">מזהה משימה:</span> {}</div>
            <div class="value"><span class="label">כותרת:</span> {}</div>
            <div class="value"><span class="label">סטטוס:</span> <span class="status">{}</span></div>
            <div class="value"><span class="label">עדיפות:</span> {}</div>
        </div>

        <p style="text-align: center; margin-top: 30px;">
            <a href="#" style="background-color: #e67e22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                צפה במשימה
            </a>
        </p>

        <div class="footer">
            <p>מערכת ניהול משימות - משרד עורכי דין</p>
            <p>⚖️ GH Law Office</p>
        </div>
    </div>
</body>
</html>
            "#,
            task.task_id, task.title, task.status, task.priority
        )
    }
}
