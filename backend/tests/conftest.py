import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import create_app

ADMIN_USER = {
    "id": "admin-super",
    "name": "Super Admin Root",
    "phone": "+919000000001",
    "isAdmin": True,
    "adminRole": "superadmin",
    "status": "active",
}

CALLS = []  # (method, path, headers, body) — lets tests assert forwarding behaviour


def ok(payload):
    return httpx.Response(200, json=payload)


def mock_handler(request: httpx.Request) -> httpx.Response:
    body = json.loads(request.content.decode() or "{}")
    headers = dict(request.headers)
    CALLS.append((request.method, request.url.path, headers, body))

    auth = request.headers.get("authorization", "")
    path = request.url.path

    if path == "/v1/auth/login":
        phone, mpin = body.get("phone"), body.get("mpin")
        if phone == "+919000000001" and mpin == "1234":
            return ok({"accessToken": "at-1", "refreshToken": "rt-1", "isNewUser": False, "user": ADMIN_USER})
        if phone == "+919999000005":
            return httpx.Response(
                429,
                json={"error": {"code": "ACCOUNT_LOCKED", "message": "locked after 5 failed attempts", "retryAfterSeconds": 900, "fieldErrors": {}}},
            )
        return httpx.Response(404, json={"error": {"code": "USER_NOT_FOUND", "message": "no account found for this phone number", "fieldErrors": {}}})

    if path == "/v1/users/me":
        if auth == "Bearer at-1":
            return ok(ADMIN_USER)
        return httpx.Response(401, json={"error": {"code": "UNAUTHORIZED", "message": "missing or invalid token", "fieldErrors": {}}})

    if path == "/v1/auth/refresh":
        if body.get("refreshToken") == "rt-1":
            return ok({"accessToken": "at-2", "refreshToken": "rt-2", "tokenType": "bearer"})
        return httpx.Response(401, json={"error": {"code": "INVALID_REFRESH", "message": "bad refresh token", "fieldErrors": {}}})

    if path == "/v1/auth/logout":
        return ok({"ok": True})

    if path == "/v1/auth/sessions" and request.method == "GET":
        if auth == "Bearer at-1":
            return ok({"sessions": [
                {"jti": "s-1", "userAgent": "Chrome / Linux", "ip": "127.0.0.1", "createdAt": "2026-11-27T09:00:00", "lastActiveAt": "2026-11-27T10:00:00", "current": True},
                {"jti": "s-2", "userAgent": "Firefox / Windows", "ip": "203.0.113.7", "createdAt": "2026-11-26T08:00:00", "lastActiveAt": "2026-11-26T18:30:00", "current": False},
            ]})
        return httpx.Response(401, json={"error": {"code": "UNAUTHORIZED", "message": "missing or invalid token", "fieldErrors": {}}})

    if path.startswith("/v1/auth/sessions/") and request.method == "DELETE":
        return ok({"ok": True})

    if path == "/v1/admin/verify-mpin":
        if auth != "Bearer at-1":
            return httpx.Response(401, json={"error": {"code": "UNAUTHORIZED", "message": "missing or invalid token", "fieldErrors": {}}})
        if body.get("mpin") == "1234":
            return ok({"ok": True})
        return httpx.Response(403, json={"error": {"code": "INVALID_MPIN", "message": "incorrect mpin", "fieldErrors": {}}})

    if path == "/v1/auth/mpin/set" and request.method == "POST":
        if auth != "Bearer at-1":
            return httpx.Response(401, json={"error": {"code": "UNAUTHORIZED", "message": "missing or invalid token", "fieldErrors": {}}})
        return ok({"ok": True})

    return httpx.Response(404, json={"error": {"code": "MOCK_NOT_FOUND", "message": path, "fieldErrors": {}}})


@pytest.fixture()
def client():
    CALLS.clear()
    app = create_app()
    mock = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler), base_url="http://upstream")
    with TestClient(app) as c:
        app.state.http = mock  # set after lifespan startup, which would overwrite it
        c.calls = CALLS  # same list object the mock handler appends to
        yield c
