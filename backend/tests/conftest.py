import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app import credentials as credentials_module

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

    if path == "/v1/admin/users":
        if auth != "Bearer at-1":
            return httpx.Response(401, json={"error": {"code": "UNAUTHORIZED", "message": "missing or invalid token", "fieldErrors": {}}})
        from datetime import datetime, timedelta, timezone
        today = datetime.now(timezone.utc).replace(hour=6, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        return ok({
            "data": [
                {"id": "u-1", "primaryProfile": "farmer", "createdAt": today.isoformat(), "agriCoins": 1250, "kycStatus": "verified"},
                {"id": "u-2", "primaryProfile": "broker", "createdAt": yesterday.isoformat(), "agriCoins": 40, "kycStatus": "pending"},
            ],
            "page": 1, "pageSize": 100, "total": 2, "totalPages": 1,
        })

    if path.startswith("/v1/admin/users/") and path.endswith("/content/summary"):
        uid = path.split("/")[4]
        return ok({"userId": uid, "lotsCount": 1, "ordersCount": 2, "tripsCount": 0, "reviewsCount": 1, "productsCount": 3, "uploadsCount": 2})

    if path.startswith("/v1/admin/users/") and path.endswith("/summary"):
        uid = path.split("/")[4]
        return ok({"id": uid, "full_name": "Ram Singh", "phone": "+919999999999", "status": "ACTIVE", "is_blocked": False, "kyc_status": "PENDING", "personas": [{"role": "FARMER", "is_active": True}]})

    if path.startswith("/v1/admin/users/") and path.endswith("/kyc"):
        return ok({"data": [{"docType": "AADHAAR", "status": "PENDING"}], "total": 1})

    if path.startswith("/v1/admin/users/") and path.endswith("/content/reviews"):
        return ok({"data": [], "total": 0})

    if path.startswith("/v1/admin/users/") and path.endswith("/status") and request.method == "POST":
        return ok({"ok": True, "blocked": body.get("is_blocked")})

    if path.startswith("/v1/admin/auth/users/") and path.endswith("/reset-mpin"):
        return ok({"tempMpin": "4821"})

    if path == "/api/v1/admin/users/stats":
        return ok({"total_users": 2, "kyc_backlog": 1, "blocked_accounts": 0, "new_users_in_range": 2})

    if path == "/v1/admin/kyc/queue":
        return ok({"data": [
            {"docId": "doc-1", "docType": "AADHAAR", "status": "PENDING", "submittedAt": "2026-11-26T08:00:00", "user": {"name": "Tushar", "phone": "+919975721517"}}
        ], "total": 1})

    if path.startswith("/v1/admin/kyc/") and request.method == "POST":
        return ok({"ok": True})

    if path == "/v1/admin/analytics/emarket":
        return ok({"gmv": 0, "totalOrders": 0, "totalSellers": 5, "aov": 0.0, "returnRate": 0.0, "monthlyGmv": [{"month": "2026-11", "amount": 0}], "ordersByStatus": {}, "topProducts": [], "topSellers": []})

    if path == "/v1/admin/marketplace/products":
        return ok({"data": [
            {"id": "p-1", "name": "Tomato", "category": "Vegetables", "price": 40, "stockQty": 10, "status": "live"},
            {"id": "p-2", "name": "Onion", "category": "Vegetables", "price": 30, "stockQty": 0, "status": "live"},
        ], "total": 2, "page": 1, "pageSize": 5})

    if path == "/v1/admin/marketplace/orders":
        return ok({"data": [], "total": 0, "page": 1, "pageSize": 5})

    if path == "/v1/admin/kyc/pending":
        return ok({"data": [], "total": 0})

    if path == "/v1/admin/approvals":
        return ok({"data": []})

    if path in ("/v1/admin/orders", "/v1/admin/equipment/bookings", "/v1/admin/transport/bookings"):
        return ok({"data": [], "total": 0, "page": 1, "pageSize": 1})

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


@pytest.fixture(autouse=True)
def isolate_credentials_store(tmp_path, monkeypatch):
    """Never let tests read runtime state from backend/app/data/."""
    monkeypatch.setattr(credentials_module, "ADMIN_CREDENTIALS_FILE", tmp_path / "admin_credentials.json")


@pytest.fixture()
def client():
    CALLS.clear()
    app = create_app()
    mock = httpx.AsyncClient(transport=httpx.MockTransport(mock_handler), base_url="http://upstream")
    with TestClient(app) as c:
        app.state.http = mock  # set after lifespan startup, which would overwrite it
        c.calls = CALLS  # same list object the mock handler appends to
        yield c
