import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_reset_code(to_email: str, code: str) -> bool:
        settings = get_settings()

        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning(
                f"SMTP not configured. Reset code for {to_email}: {code}"
            )
            return True

        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = "DoYouTry - Password Reset Code"

        body = f"""
        Your password reset code is:

        {code}

        This code expires in 15 minutes.

        If you did not request this, please ignore this email.
        """
        msg.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"Reset code sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
