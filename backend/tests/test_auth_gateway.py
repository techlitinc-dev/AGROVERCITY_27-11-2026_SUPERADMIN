AUTH = {"Authorization": "Bearer at-1"}


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


def test_change_mpin_happy_path(client):
    r = client.post("/api/auth/change-mpin", json={"oldMpin": "1234", "newMpin": "5678"}, headers=AUTH)
    assert r.status_code == 200
    paths = [(m, p) for m, p, _, _ in client.calls]
    assert paths == [("POST", "/v1/admin/verify-mpin"), ("POST", "/v1/auth/mpin/set")]
    set_body = client.calls[-1][3]
    assert set_body == {"mpin": "5678"}


def test_change_mpin_wrong_old_blocked(client):
    """Old MPIN verification failure must stop the flow — set must never be called."""
    r = client.post("/api/auth/change-mpin", json={"oldMpin": "9999", "newMpin": "5678"}, headers=AUTH)
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "INVALID_MPIN"
    paths = [(m, p) for m, p, _, _ in client.calls]
    assert ("POST", "/v1/auth/mpin/set") not in paths


def test_change_mpin_unauthorized(client):
    r = client.post("/api/auth/change-mpin", json={"oldMpin": "1234", "newMpin": "5678"})
    assert r.status_code == 401


def test_change_mpin_rejects_short_mpin(client):
    r = client.post("/api/auth/change-mpin", json={"oldMpin": "12", "newMpin": "5678"}, headers=AUTH)
    assert r.status_code == 422
    assert ("POST", "/v1/admin/verify-mpin") not in [(m, p) for m, p, _, _ in client.calls]
