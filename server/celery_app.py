import ssl

from celery import Celery

from server.core.config import config as cfg


celery_app = Celery(
    "velmio",
    broker=cfg.CELERY_BROKER_URL,
    include=["server.tasks.document"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)

# Enable TLS only when connecting to a TLS Redis broker.
if cfg.CELERY_BROKER_URL.startswith("rediss://"):
    celery_app.conf.broker_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_REQUIRED,
    }
