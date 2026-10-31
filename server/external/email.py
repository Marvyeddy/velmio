from copy import copy
from datetime import datetime, timezone
from typing import Any
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from server.core.config import config as cfg
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ENV_TEMPLATE = Path(__file__).resolve().parents[1] / "templates"

mail = ConnectionConfig(
    MAIL_USERNAME=cfg.MAIL_USERNAME,
    MAIL_PASSWORD=cfg.MAIL_PASSWORD,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    MAIL_FROM=cfg.MAIL_FROM,
    MAIL_FROM_NAME="Velmio",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

template_env = Environment(
    loader=FileSystemLoader(ENV_TEMPLATE),
    autoescape=select_autoescape("py", "html", "xml"),
)


def render_email_template(
    template_name: str,
    template_context: dict[str, Any] | None = None,
) -> str:

    template = template_env.get_template(template_name)

    context = copy(template_context or {})
    context.setdefault("current_year", datetime.now(timezone.utc).year)

    return template.render(**context)


async def send_email(
    subject: str,
    recipients: list[str],
    template_name: str,
    template_context: dict[str, Any] | None = None,
):

    body = render_email_template(template_name, template_context or {})

    message = MessageSchema(
        subject=subject, recipients=recipients, body=body, subtype=MessageType.html
    )

    fm = FastMail(mail)
    await fm.send_message(message)
