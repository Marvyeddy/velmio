from typing import Any, Callable
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


class VelmioException(Exception):
    """The root error exception class"""


class UserAlreadyExists(VelmioException):
    """User already exists"""


class InvalidUserCredential(VelmioException):
    """User credential is invalid"""


class TokenException(VelmioException):
    """Token is missing"""


class RefreshTokenException(VelmioException):
    """Provide the right refresh token"""


def create_exception_handler(
    status_code: int, detail: Any
) -> Callable[[Request, Exception], JSONResponse]:
    def exception_handler(request: Request, exc: VelmioException):
        return JSONResponse(status_code=status_code, content=detail)

    return exception_handler


def require_error(app: FastAPI):
    @app.exception_handler(500)
    async def server_exception(request, exc):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "message": "Oops! something went wrong",
                "error_code": "server_error",
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception(request, exc):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "message": "Oops! something went wrong",
                "error_code": "database_error",
            },
        )

    app.add_exception_handler(
        UserAlreadyExists,
        create_exception_handler(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "A user with credential already exists.",
                "error-code": "user_already_exists",
            },
        ),
    )

    app.add_exception_handler(
        InvalidUserCredential,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Incorrect email, username or password.",
                "error-code": "invalid_credentials",
            },
        ),
    )

    app.add_exception_handler(
        TokenException,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Token is Missing", "error_code": "missing_token"},
        ),
    )

    app.add_exception_handler(
        RefreshTokenException,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Refresh token is requried",
                "error_code": "refresh_token_required",
            },
        ),
    )
