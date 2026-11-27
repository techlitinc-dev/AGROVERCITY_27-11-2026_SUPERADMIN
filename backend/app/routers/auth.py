import hmac
import time

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from app.config import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    LOGIN_LOCKOUT_SECONDS,
    LOGIN_MAX_ATTEMPTS,
    UPSTREAM_SERVICE_MPIN,
    UPSTREAM_SERVICE_PHONE,
)
from app.upstream import forward, get_http, pass_through_headers

router = APIRouter(prefix="/api", tags=["auth"])


class ChangeMpinIn(BaseModel):
    oldMpin: str = Field(min_length=4, max_length=6)
    newMpin: str = Field(min_length=4, max_length=6)


@router.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/login", json_body=body)


@router.get("/auth/me")
async def me(request: Request):
    return await forward(request, "GET", "/v1/users/me")


@router.post("/auth/refresh")
async def refresh(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/refresh", json_body=body)


@router.post("/auth/logout")
async def logout(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/logout", json_body=body)


@router.get("/auth/sessions")
async def sessions(request: Request):
    return await forward(request, "GET", "/v1/auth/sessions")


@router.delete("/auth/sessions/{jti}")
async def revoke_session(request: Request, jti: str):
    return await forward(request, "DELETE", f"/v1/auth/sessions/{jti}")


@router.post("/auth/change-mpin")
async def change_mpin(request: Request, payload: ChangeMpinIn):
    """Change the logged-in admin's MPIN: verify the old one, then set the new one.

    Mirrors doc/01-admin-auth-and-profile.md — old MPIN is required to succeed.
    """
    client = get_http(request)
    headers = pass_through_headers(request)

    verify = await client.post("/v1/admin/verify-mpin", json={"mpin": payload.oldMpin}, headers=headers)
    if verify.status_code != 200:
        return Response(
            content=verify.content,
            status_code=verify.status_code,
            media_type=verify.headers.get("content-type", "application/json"),
        )

    set_new = await client.post("/v1/auth/mpin/set", json={"mpin": payload.newMpin}, headers=headers)
    return Response(
        content=set_new.content,
        status_code=set_new.status_code,
        media_type=set_new.headers.get("content-type", "application/json"),
    )


# --- Email + password login (superadmin web app) ---


class _Throttle:
    """In-memory failed-login throttle per email: N failures -> lockout window."""

    def __init__(self, max_attempts: int, lockout_seconds: int):
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_seconds
        self._failures: dict[str, int] = {}
        self._locked_until: dict[str, float] = {}

    def locked_remaining(self, email: str) -> int:
        until = self._locked_until.get(email)
        if not until:
            return 0
        remaining = int(until - time.time())
        if remaining <= 0:
            self._locked_until.pop(email, None)
            self._failures.pop(email, None)
            return 0
        return remaining

    def record_failure(self, email: str) -> None:
        fails = self._failures.get(email, 0) + 1
        self._failures[email] = fails
        if fails >= self.max_attempts:
            self._locked_until[email] = time.time() + self.lockout_seconds
            self._failures[email] = 0

    def reset(self, email: str) -> None:
        self._failures.pop(email, None)
        self._locked_until.pop(email, None)


throttle = _Throttle(LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS)


class EmailLoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


def _locked_response(remaining: int) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "ACCOUNT_LOCKED",
                "message": f"Too many failed attempts. Try again in {max(1, remaining // 60)} minutes.",
                "retryAfterSeconds": remaining,
                "fieldErrors": {},
            }
        },
    )


@router.post("/auth/login-email")
async def login_email(request: Request, payload: EmailLoginIn):
    """Superadmin web-app login: verify email/password locally, then exchange the
    seeded service account for an upstream session (phone+MPIN is upstream-only)."""
    email = payload.email.strip().lower()

    remaining = throttle.locked_remaining(email)
    if remaining:
        return _locked_response(remaining)

    credentials_ok = hmac.compare_digest(email, ADMIN_EMAIL) and hmac.compare_digest(
        payload.password, ADMIN_PASSWORD
    )
    if not credentials_ok:
        throttle.record_failure(email)
        remaining = throttle.locked_remaining(email)
        if remaining:
            return _locked_response(remaining)
        return JSONResponse(
            status_code=401,
            content={"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password.", "fieldErrors": {}}},
        )

    throttle.reset(email)
    client = get_http(request)
    try:
        upstream = await client.post(
            "/v1/auth/login",
            json={"phone": UPSTREAM_SERVICE_PHONE, "mpin": UPSTREAM_SERVICE_MPIN},
        )
    except httpx.TransportError:
        return JSONResponse(
            status_code=502,
            content={"error": {"code": "UPSTREAM_UNAVAILABLE", "message": "Cannot reach the upstream API", "fieldErrors": {}}},
        )
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type", "application/json"),
    )
