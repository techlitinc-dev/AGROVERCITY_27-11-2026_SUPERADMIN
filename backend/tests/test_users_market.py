import json

import pytest

from app.routers import users as users_router

AUTH = {"Authorization": "Bearer at-1"}


@pytest.fixture()
def audit_file(tmp_path, monkeypatch):
    import app.audit as audit_module

    path = tmp_path / "admin_audit.jsonl"
    monkeypatch.setattr(audit_module, "ADMIN_AUDIT_FILE", path)
    return path


# --- Directory ---


def test_users_directory_proxies_filters(client):
    r = client.get("/api/users?q=ram&page=1&pageSize=25&sort_by=createdAt&order=desc", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 2
    method, path, _, _ = client.calls[-1]
    assert (method, path) == ("GET", "/v1/admin/users")


def test_users_stats_adds_verified_pct(client):
    r = client.get("/api/users/stats", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["total_users"] == 2
    assert body["kycVerifiedPct"] == 50.0  # 1 of 2 mocked users verified


def test_user_detail_bundle_sections(client):
    r = client.get("/api/users/u-1", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["userId"] == "u-1"
    assert body["profile"]["data"]["full_name"] == "Ram Singh"
    assert body["activity"]["data"]["productsCount"] == 3
    assert body["kyc"]["error"] is None
    assert body["reviews"]["error"] is None
    paths = [p for _, p, _, _ in client.calls]
    assert "/v1/admin/users/u-1/summary" in paths
    assert "/v1/admin/users/u-1/content/summary" in paths


# --- Audited actions ---


def test_suspend_forwards_reason_and_audits(client, audit_file):
    r = client.post(
        "/api/users/u-1/status",
        json={"action": "suspend", "reason": "fraud investigation"},
        headers=AUTH,
    )
    assert r.status_code == 200
    method, path, headers, body = client.calls[-1]
    assert (method, path) == ("POST", "/v1/admin/users/u-1/status")
    assert body == {"status": "SUSPENDED", "reason": "fraud investigation"}
    assert headers.get("x-audit-reason") == "fraud investigation"
    entry = json.loads(audit_file.read_text().strip().splitlines()[-1])
    assert entry["module"] == "users"
    assert entry["action"] == "suspend"
    assert entry["reason"] == "fraud investigation"


def test_reactivate_audits(client, audit_file):
    r = client.post("/api/users/u-1/status", json={"action": "reactivate", "reason": "cleared after review"}, headers=AUTH)
    assert r.status_code == 200
    entry = json.loads(audit_file.read_text().strip().splitlines()[-1])
    assert entry["action"] == "reactivate"


def test_suspend_invalid_action_rejected(client, audit_file):
    r = client.post("/api/users/u-1/status", json={"action": "delete", "reason": "nope nope"}, headers=AUTH)
    assert r.status_code == 422
    assert not audit_file.exists()


def test_reset_mpin_passthrough_and_audit(client, audit_file):
    r = client.post("/api/users/u-1/reset-mpin", json={"reason": "operator forgot mpin"}, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["tempMpin"] == "4821"
    entry = json.loads(audit_file.read_text().strip().splitlines()[-1])
    assert entry["action"] == "mpin_reset"


# --- KYC queue ---


def test_kyc_queue_proxy(client):
    r = client.get("/api/kyc/queue", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["data"][0]["docId"] == "doc-1"


def test_kyc_verify_audits_with_autonote(client, audit_file):
    r = client.post("/api/kyc/doc-1/verify", json={"comment": "documents clear"}, headers=AUTH)
    assert r.status_code == 200
    method, path, headers, _ = client.calls[-1]
    assert (method, path) == ("POST", "/v1/admin/kyc/doc-1/verify")
    assert headers.get("x-audit-reason") == "kyc_approved - documents clear"
    entry = json.loads(audit_file.read_text().strip().splitlines()[-1])
    assert entry["action"] == "kyc_approved"


def test_kyc_reject_requires_remark(client, audit_file):
    r = client.post("/api/kyc/doc-1/reject", json={"remark": "no"}, headers=AUTH)
    assert r.status_code == 422
    assert not audit_file.exists()

    r = client.post("/api/kyc/doc-1/reject", json={"remark": "blurry document"}, headers=AUTH)
    assert r.status_code == 200
    _, _, headers, body = client.calls[-1]
    assert body == {"remark": "blurry document"}
    assert "kyc_rejected" in headers.get("x-audit-reason")
    entry = json.loads(audit_file.read_text().strip().splitlines()[-1])
    assert entry["action"] == "kyc_rejected"


# --- Module 04.01 ---


def test_ams_overview_aggregates(client):
    r = client.get("/api/personas/agri-market-seller/overview", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["kpis"]["sellers"] == 5
    assert body["products"]["total"] == 2
    assert body["orders"]["total"] == 0
    assert body["analytics"]["error"] is None


def test_marketplace_products_proxy(client):
    r = client.get("/api/marketplace/products?status=live&search=tomato&page=1&pageSize=10", headers=AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 2


def test_ams_shows_only_seller_profiles(client):
    r = client.get("/api/personas/agri-market-seller/shops", headers=AUTH)
    assert r.status_code == 200
    # mocked user list has farmer + broker only → no shops
    assert r.json()["total"] == 0
