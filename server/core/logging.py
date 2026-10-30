import logging
import sys
import threading
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from typing import ClassVar, Self

DEFAULT_LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
DEFAULT_LOG_FILE = DEFAULT_LOG_DIR / "server.log"
DEFAULT_LOG_LEVEL = logging.INFO
DEFAULT_LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(lineno)d | %(message)s"


class LogManager:
    _instance: ClassVar["LogManager | None"] = None
    _lock: ClassVar[threading.Lock] = threading.Lock()
    _loggers: ClassVar[dict[str, logging.Logger]] = {}

    def __new__(cls, *args, **kwargs) -> Self:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._configure_root_logger()
        return cls._instance

    def _configure_root_logger(self) -> None:
        root_logger = logging.getLogger()
        root_logger.setLevel(DEFAULT_LOG_LEVEL)
        formatter = logging.Formatter(DEFAULT_LOG_FORMAT)

        if not any(
            isinstance(handler, logging.StreamHandler)
            and not isinstance(handler, logging.FileHandler)
            for handler in root_logger.handlers
        ):
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)

        if not any(
            isinstance(handler, TimedRotatingFileHandler)
            for handler in root_logger.handlers
        ):
            DEFAULT_LOG_DIR.mkdir(parents=True, exist_ok=True)
            file_handler = TimedRotatingFileHandler(
                DEFAULT_LOG_FILE,
                when="midnight",
                interval=1,
                backupCount=7,
                encoding="utf-8",
            )
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)

    def get_logger(self, name: str) -> logging.Logger:
        if name not in self._loggers:
            logger = logging.getLogger(name)
            logger.setLevel(DEFAULT_LOG_LEVEL)
            self._loggers[name] = logger
        return self._loggers[name]


log_manager = LogManager()


def get_app_logger(name: str = __name__) -> logging.Logger:
    return log_manager.get_logger(name)
