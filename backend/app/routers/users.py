"""Module 03 — Users & KYC: directory, user 360°, KYC queue + audited actions.

Proxies the upstream admin API and records every state-changing action in the
local audit trail (doc/03-users-and-kyc.md — reason mandatory for all actions).
Upstream mutations are forwarded with the X-Audit-Reason header so the
upstream audit log records the operator's reason as well.
"""

import asyncio

from fastapi import APIRouter, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app import audit
from app.upstream import get_http, pass_through_headers

router = APIRouter(prefix="/api", tags=["users"])

USER_LIST_PARAMS = (
    "q", "role", "status", "kyc_status", "is_blocked", "state", "district",
    "start_date", "end_date", "page", "limit", "pageSize", "sort_by", "order",
)

ACTION_TIMEOUT = 15.0


async def _proxy(request: Request, method: str, upstream_path: str, *, params=None, json_body=None, extra_headers=None):
    """Forward to the upstream API, passing auth + audit headers through."""
    client = get_http(request)
    headers = pass_through_headers(request)
    if extra_headers:
        headers.update(extra_headers)
    upstream = await client.request(method, upstream_path, params=params, json=json_body, headers=headers)
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type", "application/json"),
    )


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.get("/users")
async def list_users(request: Request):
    """Directory listing — query params pass through to /v1/admin/users."""
    params = {k: v for k, v in request.query_params.items() if k in USER_LIST_PARAMS}
    return await _proxy(request, "GET", "/v1/admin/users", params=params or None)


@router.get("/users/stats")
async def users_stats(request: Request):
    """Directory KPIs: upstream stats + a KYC-verified % computed from the list.

    The verified percentage needs per-user kyc_status, so the (seed-scale)
    user list is scanned; fields absent from the stats endpoint otherwise.
    """
    client = get_http(request)
    headers = pass_through_headers(request)

    async def safe(path):
        try:
            resp = await client.get(path, headers=headers)
            if resp.status_code >= 400:
                return None
            return resp.json()
        except Exception:
            return None

    stats, first_page = await asyncio.gather(
        safe("/api/v1/admin/users/stats"),
        safe("/v1/admin/users?page=1&pageSize=100"),
    )

    users = (first_page or {}).get("data") or []
    total_pages = (first_page or {}).get("totalPages") or 1
    if total_pages > 1:  # fetch remaining pages (bounded) for an accurate %
        for page in range(2, min(total_pages, 10) + 1):
            more = await safe(f"/v1/admin/users?page={page}&pageSize=100")
            if not more:
                break
            users.extend(more.get("data") or [])

    with_kyc = [u for u in users if u.get("kycStatus")]
    verified_pct = (
        round(100 * sum(1 for u in with_kyc if u.get("kycStatus") == "verified") / len(with_kyc), 1)
        if with_kyc else None
    )

    out = dict(stats or {})
    out["kycVerifiedPct"] = verified_pct
    return out


@router.get("/users/{user_id}")
async def user_detail(user_id: str, request: Request):
    """User 360° bundle: profile, per-feature activity counts, KYC — each
    section degrades independently (inline `error`)."""
    client = get_http(request)
    headers = pass_through_headers(request)

    async def section(name: str, path: str):
        try:
            resp = await client.get(path, headers=headers)
            if resp.status_code >= 400:
                return name, {"error": f"upstream returned {resp.status_code}"}
            return name, {"data": resp.json(), "error": None}
        except Exception as exc:
            return name, {"error": str(exc) or "fetch failed"}

    sections = await asyncio.gather(
        section("profile", f"/v1/admin/users/{user_id}/summary"),
        section("activity", f"/v1/admin/users/{user_id}/content/summary"),
        section("kyc", f"/v1/admin/users/{user_id}/kyc"),
        section("reviews", f"/v1/admin/users/{user_id}/content/reviews?page=1&pageSize=20"),
    )
    return {"userId": user_id, **dict(sections)}


class StatusActionIn(BaseModel):
    action: str = Field(pattern="^(suspend|reactivate)$")
    reason: str = Field(min_length=3, max_length=500)


@router.post("/users/{user_id}/status")
async def set_user_status(user_id: str, request: Request, payload: StatusActionIn):
    """Suspend or reactivate a user. Reason mandatory — sent in the upstream
    body and recorded in the local audit trail."""
    status = "SUSPENDED" if payload.action == "suspend" else "ACTIVE"
    reason = payload.reason.strip()
    resp = await _proxy(
        request, "POST", f"/v1/admin/users/{user_id}/status",
        json_body={"status": status, "reason": reason},
        extra_headers={"X-Audit-Reason": reason},
    )
    if resp.status_code < 400:
        audit.record(
            module="users",
            target=user_id,
            action=payload.action,
            reason=payload.reason.strip(),
            ip=_client_ip(request),
        )
    return resp


class ReasonIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


@router.post("/users/{user_id}/reset-mpin")
async def reset_mpin(user_id: str, request: Request, payload: ReasonIn):
    """Issue an MPIN reset. Reason mandatory. Any temporary MPIN the upstream
    returns is passed through and shown once by the UI."""
    resp = await _proxy(
        request, "POST", f"/v1/admin/auth/users/{user_id}/reset-mpin",
        json_body={},
        extra_headers={"X-Audit-Reason": payload.reason.strip()},
    )
    if resp.status_code < 400:
        audit.record(
            module="users",
            target=user_id,
            action="mpin_reset",
            reason=payload.reason.strip(),
            ip=_client_ip(request),
        )
    return resp


@router.get("/kyc/queue")
async def kyc_queue(request: Request):
    params = {k: v for k, v in request.query_params.items() if k in ("status", "page", "pageSize")}
    return await _proxy(request, "GET", "/v1/admin/kyc/queue", params=params or None)


class KycVerifyIn(BaseModel):
    comment: str | None = Field(default=None, max_length=500)


@router.post("/kyc/{doc_id}/verify")
async def kyc_verify(doc_id: str, request: Request, payload: KycVerifyIn):
    reason = "kyc_approved" + (f" - {payload.comment.strip()}" if payload.comment and payload.comment.strip() else "")
    resp = await _proxy(
        request, "POST", f"/v1/admin/kyc/{doc_id}/verify",
        json_body={"comment": payload.comment} if payload.comment else {},
        extra_headers={"X-Audit-Reason": reason},
    )
    if resp.status_code < 400:
        audit.record(module="kyc", target=doc_id, action="kyc_approved", reason=reason, ip=_client_ip(request))
    return resp


class KycRejectIn(BaseModel):
    remark: str = Field(min_length=3, max_length=500)


@router.post("/kyc/{doc_id}/reject")
async def kyc_reject(doc_id: str, request: Request, payload: KycRejectIn):
    """Reject a KYC document. Remark is mandatory (doc) — the user sees it."""
    resp = await _proxy(
        request, "POST", f"/v1/admin/kyc/{doc_id}/reject",
        json_body={"remark": payload.remark.strip()},
        extra_headers={"X-Audit-Reason": f"kyc_rejected - {payload.remark.strip()}"},
    )
    if resp.status_code < 400:
        audit.record(
            module="kyc",
            target=doc_id,
            action="kyc_rejected",
            reason=payload.remark.strip(),
            ip=_client_ip(request),
        )
    return resp
