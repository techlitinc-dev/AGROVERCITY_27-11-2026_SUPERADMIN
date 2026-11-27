import json
from datetime import date, timedelta

import pytest

from app.config import ADMIN_AUDIT_FILE

AUTH = {"Authorization": "Bearer at-1"}


def test_dashboard_kpis_aggregates_all_widgets(client):
    r = client.get("/api/dashboard/kpis", headers=AUTH)
    assert r.status_code == 200
    body = r.json()

    # users widget: 2 mocked users, one new today, one new yesterday
    assert body["users"]["total"] == 2
    assert body["users"]["newToday"] == 1
    assert body["users"]["newYesterday"] == 1
    assert body["users"]["delta"] == 0
    assert body["users"]["error"] is None

    # personas widget: exactly the 9 in-scope personas, alphabetical
    items = body["personas"]["items"]
    assert len(items) == 9
    labels = [i["label"] for i in items]
    assert labels == sorted(labels, key=str.casefold)
    assert [i["label"] for i in items] == [
        "Agri Market Seller", "Agri Vyapari", "Equipment Owner",
        "Farm Landlord", "Farmer", "Gurukul Instructor",
        "Milk Vendor", "Transporter", "Women Hub",
    ]
    farmer = next(i for i in items if i["key"] == "farmer")
    assert farmer["count"] == 1

    # trend widget: 30-day window with both registrations bucketed
    days = body["trend"]["days"]
    assert len(days) == 30
    assert sum(d["count"] for d in days) == 2

    # kyc / approvals / activity / coins
    assert body["kyc"]["pending"] == 0
    assert body["kyc"]["oldestWaiting"] is None
    assert body["approvals"]["total"] == 0
    assert len(body["approvals"]["items"]) == 5  # courses, shops, equipment, listings, ads
    assert body["activity"] == {"orders": 0, "bookings": 0, "trips": 0, "personaFiltered": False, "error": None}
    assert body["coins"]["inCirculation"] == 1290
    assert all(
        body[w]["error"] is None
        for w in ("users", "personas", "trend", "kyc", "approvals", "activity", "coins")
    )

    # upstream fan-out
    paths = [(m, p) for m, p, _, _ in client.calls]
    assert ("GET", "/v1/admin/users") in paths
    assert ("GET", "/v1/admin/kyc/pending") in paths
    assert ("GET", "/v1/admin/approvals") in paths
    assert ("GET", "/v1/admin/orders") in paths
    assert ("GET", "/v1/admin/equipment/bookings") in paths
    assert ("GET", "/v1/admin/transport/bookings") in paths


def test_dashboard_persona_focus_filters_trend_and_personas(client):
    r = client.get("/api/dashboard/kpis?personas=farmer", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert [i["key"] for i in body["personas"]["items"]] == ["farmer"]
    assert sum(d["count"] for d in body["trend"]["days"]) == 1


def test_dashboard_custom_date_window(client):
    today = date.today().isoformat()
    start = (date.today() - timedelta(days=2)).isoformat()
    r = client.get(f"/api/dashboard/kpis?from={start}&to={today}", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["trendWindow"]["range"] == "custom"
    assert len(body["trend"]["days"]) == 3


def test_dashboard_partial_failure_degrades_widget_only(client, monkeypatch):
    import httpx

    import tests.conftest as conftest

    original = conftest.mock_handler

    def flaky(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/v1/admin/orders":
            return httpx.Response(500, json={"error": {"code": "BOOM", "message": "x", "fieldErrors": {}}})
        return original(request)

    monkeypatch.setattr(conftest, "mock_handler", flaky)
    # rebuild the transport so the app-level client picks up the patched handler
    from app.main import create_app

    app = create_app()
    mock = httpx.AsyncClient(transport=httpx.MockTransport(flaky), base_url="http://upstream")
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        c.calls = conftest.CALLS
        app.state.http = mock
        r = c.get("/api/dashboard/kpis", headers=AUTH)
    assert r.status_code == 200
    body = r.json()
    assert body["activity"]["error"] is not None
    assert body["users"]["error"] is None
    assert body["coins"]["inCirculation"] == 1290


def test_dashboard_unauthorized_session_passes_401(client):
    r = client.get("/api/dashboard/kpis")  # no Bearer token
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "UNAUTHORIZED"


def test_dashboard_export_writes_audit_entry(client, tmp_path, monkeypatch):
    import app.audit as audit_module

    audit_file = tmp_path / "admin_audit.jsonl"
    monkeypatch.setattr(audit_module, "ADMIN_AUDIT_FILE", audit_file)

    r = client.post(
        "/api/dashboard/export",
        json={"widget": "trend", "format": "csv", "reason": "morning standup report"},
        headers=AUTH,
    )
    assert r.status_code == 200
    lines = audit_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["module"] == "dashboard"
    assert entry["target"] == "trend"
    assert entry["action"] == "export_csv"
    assert entry["reason"] == "morning standup report"


def test_dashboard_export_requires_reason(client):
    r = client.post("/api/dashboard/export", json={"widget": "trend", "format": "csv", "reason": "no"}, headers=AUTH)
    assert r.status_code == 422
