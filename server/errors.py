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
