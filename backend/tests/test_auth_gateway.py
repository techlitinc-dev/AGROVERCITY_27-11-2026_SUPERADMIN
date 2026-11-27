import pytest

from app import credentials

AUTH = {"Authorization": "Bearer at-1"}


@pytest.fixture()
def creds_file(tmp_path, monkeypatch):
    """Point the credential store at a temp file so tests never touch real state."""
    path = tmp_path / "admin_credentials.json"
    monkeypatch.setattr(credentials, "ADMIN_CREDENTIALS_FILE", path)
    return path


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_success_passthrough(client):
    r = client.post("/api/auth/login", json={"phone": "+919000000001", "mpin": "1234"})
    assert r.status_code == 200
    data = r.json()
    assert data["accessToken"] == "at-1"
    assert data["user"]["isAdmin"] is True
    assert data["user"]["adminRole"] == "superadmin"


def test_login_unknown_phone_passthrough(client):
    r = client.post("/api/auth/login", json={"phone": "+911111111111", "mpin": "1234"})
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "USER_NOT_FOUND"


def test_login_lockout_429_passthrough_with_countdown(client):
    """The 429 + retryAfterSeconds payload must reach the SPA so it can show the countdown."""
    r = client.post("/api/auth/login", json={"phone": "+919999000005", "mpin": "0000"})
    assert r.status_code == 429
    body = r.json()
    assert body["error"]["code"] == "ACCOUNT_LOCKED"
    assert body["error"]["retryAfterSeconds"] == 900


def test_me_requires_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_token(client):
    r = client.get("/api/auth/me", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["phone"] == "+919000000001"


def test_refresh_forwards_body(client):
    r = client.post("/api/auth/refresh", json={"refreshToken": "rt-1"})
    assert r.status_code == 200
    assert r.json()["accessToken"] == "at-2"


def test_logout(client):
    r = client.post("/api/auth/logout", json={"refreshToken": "rt-1"}, headers=AUTH)
    assert r.status_code == 200


def test_sessions_list(client):
    r = client.get("/api/auth/sessions", headers=AUTH)
    assert r.status_code == 200
    sessions = r.json()["sessions"]
    assert len(sessions) == 2
    assert sessions[0]["current"] is True


def test_revoke_session_forwards_audit_reason(client):
    r = client.delete("/api/auth/sessions/s-2", headers={**AUTH, "X-Audit-Reason": "lost device"})
    assert r.status_code == 200
    method, path, headers, _ = client.calls[-1]
    assert method == "DELETE"
    assert path == "/v1/auth/sessions/s-2"
    assert headers.get("x-audit-reason") == "lost device"


# --- Change password ---


def test_change_password_success(client, creds_file):
    r = client.post(
        "/api/auth/change-password",
        json={"currentPassword": "admin", "newPassword": "Str0ng!Pass"},
        headers=AUTH,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}
    assert creds_file.exists()

    # login now accepts the new password and rejects the old one
    assert client.post(
        "/api/auth/login-email", json={"email": "admin@gmail.com", "password": "Str0ng!Pass"}
    ).status_code == 200
    r = client.post("/api/auth/login-email", json={"email": "admin@gmail.com", "password": "admin"})
    assert r.status_code == 401


def test_change_password_wrong_current_rejected(client, creds_file):
    r = client.post(
        "/api/auth/change-password",
        json={"currentPassword": "nope", "newPassword": "Str0ng!Pass"},
        headers=AUTH,
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert not creds_file.exists()


def test_change_password_short_new_rejected(client, creds_file):
    r = client.post(
        "/api/auth/change-password",
        json={"currentPassword": "admin", "newPassword": "short"},
        headers=AUTH,
    )
    assert r.status_code == 422
    assert not creds_file.exists()


def test_change_password_locks_after_max_failures(client, creds_file, monkeypatch):
    import app.routers.auth as auth_router

    monkeypatch.setattr(auth_router, "throttle", auth_router._Throttle(2, 900))
    bad = {"currentPassword": "nope", "newPassword": "Str0ng!Pass"}

    assert client.post("/api/auth/change-password", json=bad, headers=AUTH).status_code == 401
    r = client.post("/api/auth/change-password", json=bad, headers=AUTH)
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "ACCOUNT_LOCKED"

    good = {"currentPassword": "admin", "newPassword": "Str0ng!Pass"}
    assert client.post("/api/auth/change-password", json=good, headers=AUTH).status_code == 429
    assert not creds_file.exists()


# --- Recovery email ---


def test_recovery_email_requires_upstream_session(client, creds_file):
    r = client.get("/api/auth/recovery-email")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


def test_recovery_email_roundtrip(client, creds_file):
    r = client.get("/api/auth/recovery-email", headers=AUTH)
    assert r.status_code == 200
    assert r.json() == {"email": None}

    r = client.put(
        "/api/auth/recovery-email",
        json={"email": "  Ops@Example.COM ", "currentPassword": "admin"},
        headers=AUTH,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True, "email": "ops@example.com"}

    r = client.get("/api/auth/recovery-email", headers=AUTH)
    assert r.json() == {"email": "ops@example.com"}


def test_recovery_email_invalid_format(client, creds_file):
    r = client.put(
        "/api/auth/recovery-email",
        json={"email": "not-an-email", "currentPassword": "admin"},
        headers=AUTH,
    )
    assert r.status_code == 422
    assert not creds_file.exists()


def test_recovery_email_wrong_password_rejected(client, creds_file):
    r = client.put(
        "/api/auth/recovery-email",
        json={"email": "ops@example.com", "currentPassword": "nope"},
        headers=AUTH,
    )
    assert r.status_code == 401
    assert not creds_file.exists()


# --- Email + password login ---


def test_email_login_success_exchanges_service_account(client):
    r = client.post("/api/auth/login-email", json={"email": "admin@gmail.com", "password": "admin"})
    assert r.status_code == 200
    data = r.json()
    assert data["accessToken"] == "at-1"
    assert data["user"]["isAdmin"] is True
    # the gateway exchanged the seeded service account upstream
    method, path, _, body = client.calls[0]
    assert (method, path) == ("POST", "/v1/auth/login")
    assert body == {"phone": "+919000000001", "mpin": "1234"}


def test_email_login_is_case_insensitive_and_trims(client):
    r = client.post("/api/auth/login-email", json={"email": "  Admin@Gmail.COM ", "password": "admin"})
    assert r.status_code == 200


def test_email_login_wrong_password_generic_401(client):
    r = client.post("/api/auth/login-email", json={"email": "admin@gmail.com", "password": "nope"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"
    # generic message: never reveals which part was wrong
    assert r.json()["error"]["message"] == "Invalid email or password."
    # upstream must not be called with bad credentials
    assert ("POST", "/v1/auth/login") not in [(m, p) for m, p, _, _ in client.calls]


def test_email_login_lockout_after_max_attempts(client, monkeypatch):
    import app.routers.auth as auth_router

    monkeypatch.setattr(auth_router, "throttle", auth_router._Throttle(2, 900))
    bad = {"email": "admin@gmail.com", "password": "wrong"}

    assert client.post("/api/auth/login-email", json=bad).status_code == 401  # fail 1
    r = client.post("/api/auth/login-email", json=bad)  # fail 2 -> locks immediately
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "ACCOUNT_LOCKED"
    assert 0 < r.json()["error"]["retryAfterSeconds"] <= 900

    r = client.post("/api/auth/login-email", json=bad)
    assert r.status_code == 429

    # locked even with the correct password
    good = {"email": "admin@gmail.com", "password": "admin"}
    assert client.post("/api/auth/login-email", json=good).status_code == 429
