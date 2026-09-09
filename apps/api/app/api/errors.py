"""Stable error mapping for HTTP clients."""

from __future__ import annotations

from typing import cast
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.orchestration.run_service import ServiceError


def _request_id(request: Request) -> str:
    existing = getattr(request.state, "request_id", None)
    if existing:
        return cast(str, existing)
    return request.headers.get("x-request-id", f"req_{uuid4().hex[:16]}")


def register_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(ServiceError)
    async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "request_id": _request_id(request),
                    "details": exc.details,
                    "retryable": exc.retryable,
                }
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        fields = [
            {
                "loc": list(error.get("loc", ())),
                "msg": str(error.get("msg", "Invalid value")),
                "type": str(error.get("type", "value_error")),
            }
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "INVALID_REQUEST",
                    "message": "Request validation failed.",
                    "request_id": _request_id(request),
                    "details": {"fields": fields},
                    "retryable": False,
                }
            },
        )

    @application.exception_handler(Exception)
    async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger = request.app.state.logger
        logger.exception("Unhandled API exception", exc_info=exc, extra={"request_id": _request_id(request)})
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "The service could not complete the request.",
                    "request_id": _request_id(request),
                    "details": {},
                    "retryable": False,
                }
            },
        )
