from typing import Any, Callable
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


class VelmioException(Exception):
    """Base exception for all service layer errors."""

    pass


class UserAlreadyExists(VelmioException):
    """User with credential already exists"""

    pass


class InvalidCredentials(VelmioException):
    """Credentials are wrong and do not exist in database"""

    pass


class InvalidVerificationToken(VelmioException):
    """Verification token is invalid or expired"""

    pass


class UserNotFound(VelmioException):
    """User not found"""

    pass


class EmailAlreadyVerified(VelmioException):
    """Email is already verified"""

    pass


class UnauthorizedCookie(VelmioException):
    """Wrong cookie was provided"""

    pass


def create_exception_handler(
    status_code: int, content: Any
) -> Callable[[Request, Exception], JSONResponse]:

    async def exception_handler(req: Request, exc: VelmioException):
        return JSONResponse(status_code=status_code, content=content)

    return exception_handler


def require_error(app: FastAPI):

    @app.exception_handler(500)
    async def server_exception(request, exc):
        return JSONResponse(
            content={
                "message": "Oops! something went wrong",
                "error_code": "server_error",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception(request, exc):
        return JSONResponse(
            content={
                "message": "Oops! Something went wrong",
                "error_code": "server_error",
            },
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    app.add_exception_handler(
        UserAlreadyExists,
        create_exception_handler(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "message": "User credential already exists",
            },
        ),
    )

    app.add_exception_handler(
        InvalidCredentials,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"message": "User credential is invalid"},
        ),
    )

    app.add_exception_handler(
        InvalidVerificationToken,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Invalid or expired verification token"},
        ),
    )

    app.add_exception_handler(
        UserNotFound,
        create_exception_handler(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "User not found"},
        ),
    )

    app.add_exception_handler(
        EmailAlreadyVerified,
        create_exception_handler(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Email is already verified"},
        ),
    )

    app.add_exception_handler(
        UnauthorizedCookie,
        create_exception_handler(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"message": "Wrong cookie was provided"},
        ),
    )
