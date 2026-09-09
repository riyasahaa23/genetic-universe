"""Stable public error envelope."""

from __future__ import annotations

from pydantic import Field

from .common import ContractModel


class ErrorBody(ContractModel):
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
    request_id: str = Field(min_length=1)
    details: dict[str, object] = Field(default_factory=dict)
    retryable: bool = False


class ErrorResponse(ContractModel):
    error: ErrorBody
