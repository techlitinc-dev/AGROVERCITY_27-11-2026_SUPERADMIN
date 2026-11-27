"""Module 02 — Dashboard (Global KPIs): aggregates upstream admin endpoints.

Mirrors doc/02-dashboard-global-kpis.md. One round-trip for the SPA: fans out
to the upstream API in parallel and normalizes to a per-widget envelope. A
single failing upstream call degrades only its own widget (inline `error`),
never the whole wall. Drill-down targets (Users & KYC, Coins, ...) are later
build phases — this page is read-only.
"""

import asyncio
import re
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app import audit
from app.upstream import get_http, pass_through_headers

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# The 9 in-scope personas (doc/superadmin_modules.md §2.2), alphabetical, with
# every known upstream persona-key spelling mapped onto them.
PERSONAS: list[tuple[str, str, tuple[str, ...]]] = [
    ("agriMarketSeller", "Agri Market Seller", ("agrimarketseller",)),
    ("agriVyapari", "Agri Vyapari", ("broker",)),
    ("equipmentOwner", "Equipment Owner", ("equipmentrental",)),
    ("farmLandlord", "Farm Landlord", ("farmlandlord",)),
    ("farmer", "Farmer", ("farmer",)),
    ("gurukulInstructor", "Gurukul Instructor", ("instructor",)),
    ("milkVendor", "Milk Vendor", ("milkseller", "dairymanager")),
    ("transporter", "Transporter", ("transporter",)),
    ("womenHub", "Women Hub", ("womenhub",)),
]

PERSONA_KEYS = {key for key, _, _ in PERSONAS}
_PERSONA_LOOKUP = {
    alias.lower(): key for key, _, aliases in PERSONAS for alias in aliases
}

APPROVAL_BUCKETS = [
    ("courses", "Courses"),
    ("shops", "Shops"),
    ("equipment", "Equipment"),
    ("listings", "Listings"),
    ("ads", "Ads"),
]

_UPSTREAM_TIMEOUT = 12.0
_MAX_USER_PAGES = 10
_USER_PAGE_SIZE = 100


def _parse_dt(value) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _today_utc() -> date:
    return datetime.now(timezone.utc).date()


async def _fetch(client, method: str, path: str, headers: dict, **kwargs):
    """One upstream call with a per-widget timeout; raises on any failure."""
    resp = await asyncio.wait_for(client.request(method, path, headers=headers, **kwargs), timeout=_UPSTREAM_TIMEOUT)
    if resp.status_code >= 400:
        raise RuntimeError(f"upstream {path} returned {resp.status_code}")
    payload = resp.json()
    if isinstance(payload, dict) and isinstance(payload.get("error"), dict):
        raise RuntimeError(f"upstream {path} returned an error: {payload['error'].get('code', 'UNKNOWN')}")
    return payload


async def _collect_users(client, headers: dict) -> list[dict]:
    """All users (seed-scale volumes) for trend bucketing, persona counts and coins."""
    users: list[dict] = []
    for page in range(1, _MAX_USER_PAGES + 1):
        payload = await _fetch(
            client, "GET", "/v1/admin/users", headers,
            params={"page": page, "pageSize": _USER_PAGE_SIZE, "sort_by": "createdAt", "order": "desc"},
        )
        batch = payload.get("data") or payload.get("users") or []
        users.extend(u for u in batch if isinstance(u, dict))
        total_pages = payload.get("totalPages") or 1
        if page >= total_pages or not batch:
            break
    return users


def _persona_key(user: dict) -> str | None:
    raw = user.get("primaryProfile") or user.get("activeProfile")
    if not isinstance(raw, str):
        return None
    return _PERSONA_LOOKUP.get(raw.lower())


def _widget_error(exc: BaseException) -> str:
    return f"Could not load: {exc}" if str(exc) else "Could not load."


@router.get("/kpis")
async def dashboard_kpis(
    request: Request,
    personas: str = "",
    date_range: str = "30d",
    range_from: date | None = Query(default=None, alias="from"),
    range_to: date | None = Query(default=None, alias="to"),
):
    """Aggregated KPI wall. `personas` = comma-separated persona keys to focus
    (widgets 2, 3); `date_range` = today|7d|30d, or pass from+to for a custom
    window (trend widget)."""
    client = get_http(request)
    headers = pass_through_headers(request)

    selected = [p for p in (s.strip() for s in personas.split(",")) if p in PERSONA_KEYS]

    if range_from and range_to and range_to >= range_from:
        start, end = range_from, range_to
        days = min((end - start).days + 1, 90)  # cap the window
        range_label = "custom"
    else:
        days = {"today": 1, "7d": 7, "30d": 30}.get(date_range, 30)
        end = _today_utc()
        start = end - timedelta(days=days - 1)
        range_label = date_range if days in (1, 7, 30) else "30d"

    # Users list is fetched once and shared by the four widgets computed from it.
    try:
        users_list = await _collect_users(client, headers)
        users_error = None
    except Exception as exc:
        users_list, users_error = [], _widget_error(exc)

    def users_widget():
        if users_error:
            return {"error": users_error}
        total = len(users_list)
        today, yesterday = _today_utc(), _today_utc() - timedelta(days=1)
        new_today = new_yesterday = 0
        for u in users_list:
            created = _parse_dt(u.get("createdAt"))
            if created is None:
                continue
            day = created.date()
            if day == today:
                new_today += 1
            elif day == yesterday:
                new_yesterday += 1
        return {
            "total": total,
            "newToday": new_today,
            "newYesterday": new_yesterday,
            "delta": new_today - new_yesterday,
            "error": None,
        }

    def personas_widget():
        if users_error:
            return {"error": users_error}
        counts = {key: 0 for key, _, _ in PERSONAS}
        for u in users_list:
            key = _persona_key(u)
            if key:
                counts[key] += 1
        items = [
            {"key": key, "label": label, "count": counts[key]}
            for key, label, _ in PERSONAS
            if not selected or key in selected
        ]
        return {"items": items, "error": None}

    def trend_widget():
        if users_error:
            return {"error": users_error}
        window = {start + timedelta(days=i): 0 for i in range(days)}
        for u in users_list:
            key = _persona_key(u)
            if selected and key not in selected:
                continue
            created = _parse_dt(u.get("createdAt"))
            if created is None:
                continue
            day = created.date()
            if day in window:
                window[day] += 1
        return {
            "days": [{"date": d.isoformat(), "count": c} for d, c in sorted(window.items())],
            "error": None,
        }

    async def kyc_widget():
        payload = await _fetch(client, "GET", "/v1/admin/kyc/pending", headers)
        data = payload.get("data") or []
        oldest = None
        for doc in data:
            submitted = _parse_dt(doc.get("submittedAt") or doc.get("createdAt") or doc.get("updatedAt"))
            if submitted and (oldest is None or submitted < oldest):
                oldest = submitted
        return {
            "pending": payload.get("total", len(data)),
            "oldestWaiting": oldest.isoformat() if oldest else None,
            "error": None,
        }

    async def approvals_widget():
        payload = await _fetch(client, "GET", "/v1/admin/approvals", headers, params={"status": "pending"})
        data = payload.get("data") or []
        counts: dict[str, int] = {key: 0 for key, _ in APPROVAL_BUCKETS}
        other = 0
        for item in data:
            raw = ""
            for field in ("type", "category", "module", "feature", "kind"):
                value = item.get(field)
                if isinstance(value, str) and value:
                    raw = value.lower()
                    break
            for key, _ in APPROVAL_BUCKETS:
                if key in raw or (key == "ads" and ("ad" == raw or "ads" in raw or "promotion" in raw)):
                    counts[key] += 1
                    break
            else:
                if raw:
                    other += 1
        items = [{"key": k, "label": l, "count": counts[k]} for k, l in APPROVAL_BUCKETS]
        if other:
            items.append({"key": "other", "label": "Other", "count": other})
        return {"items": items, "total": len(data), "personaFiltered": False, "error": None}

    async def activity_widget():
        orders, bookings, trips = await asyncio.gather(
            _fetch(client, "GET", "/v1/admin/orders", headers, params={"page": 1, "pageSize": 1}),
            _fetch(client, "GET", "/v1/admin/equipment/bookings", headers, params={"page": 1, "pageSize": 1}),
            _fetch(client, "GET", "/v1/admin/transport/bookings", headers, params={"page": 1, "pageSize": 1}),
        )
        return {
            "orders": orders.get("total", 0),
            "bookings": bookings.get("total", 0),
            "trips": trips.get("total", 0),
            "personaFiltered": False,
            "error": None,
        }

    async def safe(coro):
        try:
            return await coro
        except Exception as exc:  # per-widget degradation, never fail the wall
            return {"error": _widget_error(exc)}

    kyc, approvals, activity = await asyncio.gather(
        safe(kyc_widget()),
        safe(approvals_widget()),
        safe(activity_widget()),
    )

    def coins_widget_sync():
        if users_error:
            return {"error": users_error}
        return {
            "inCirculation": sum(int(u.get("agriCoins") or 0) for u in users_list),
            "error": None,
        }

    users, persona_counts, trend, coins = (
        users_widget(),
        personas_widget(),
        trend_widget(),
        coins_widget_sync(),
    )

    # A broken session should sign the operator out rather than render an error wall.
    if users.get("error") and ("401" in users["error"] or "403" in users["error"]):
        return JSONResponse(status_code=401, content={"error": {"code": "UNAUTHORIZED", "message": "Session expired. Please sign in again.", "fieldErrors": {}}})

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "trendWindow": {"start": start.isoformat(), "end": end.isoformat(), "range": range_label},
        "users": users,
        "personas": persona_counts,
        "trend": trend,
        "kyc": kyc,
        "approvals": approvals,
        "activity": activity,
        "coins": coins,
    }


class ExportAuditIn(BaseModel):
    widget: str = Field(min_length=2, max_length=64)
    format: str = Field(pattern="^(csv|json)$")
    reason: str = Field(min_length=3, max_length=500)


@router.post("/export")
async def log_export(request: Request, payload: ExportAuditIn):
    """Record a widget export (CSV/JSON) in the local audit trail.

    The upstream audit endpoint is read-only, so gateway-side actions are
    appended here as JSONL for the Audit Log module (07) to surface later.
    """
    audit.record(
        module="dashboard",
        target=payload.widget,
        action=f"export_{payload.format}",
        reason=payload.reason.strip(),
        ip=request.client.host if request.client else None,
    )
    return {"ok": True}
