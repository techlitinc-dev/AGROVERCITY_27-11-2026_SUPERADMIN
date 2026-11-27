"""Module 04.01 — Persona: Agri Market Seller (read + export).

Data sources are the upstream admin marketplace endpoints. Views without an
admin API upstream (enquiries, quotations, offers, stock) are declared here so
the SPA can render an honest unavailable state instead of fabricating rows.
"""

import asyncio

from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.upstream import get_http, pass_through_headers

router = APIRouter(prefix="/api", tags=["marketplace"])

PRODUCT_PARAMS = ("category", "status", "search", "page", "pageSize")
ORDER_PARAMS = ("status", "paymentStatus", "search", "page", "pageSize")
SHOP_OWNER_PROFILES = {"agrimarketseller", "seller"}


async def _get_json(client, path, headers):
    resp = await client.get(path, headers=headers)
    if resp.status_code >= 400:
        raise RuntimeError(f"upstream {path} returned {resp.status_code}")
    return resp.json()


@router.get("/personas/agri-market-seller/overview")
async def ams_overview(request: Request):
    """Persona KPI wall: emarket analytics + product/order totals + recents."""
    client = get_http(request)
    headers = pass_through_headers(request)

    async def safe(coro):
        try:
            return {"data": await coro, "error": None}
        except Exception as exc:
            return {"data": None, "error": str(exc) or "fetch failed"}

    analytics, products, orders = await asyncio.gather(
        safe(_get_json(client, "/v1/admin/analytics/emarket", headers)),
        safe(_get_json(client, "/v1/admin/marketplace/products?page=1&pageSize=5&sort_by=createdAt&order=desc", headers)),
        safe(_get_json(client, "/v1/admin/marketplace/orders?page=1&pageSize=5", headers)),
    )

    em = analytics["data"] or {}
    return {
        "analytics": analytics,
        "products": {"total": (products["data"] or {}).get("total", 0), "recent": (products["data"] or {}).get("data") or [], "error": products["error"]},
        "orders": {"total": (orders["data"] or {}).get("total", 0), "recent": (orders["data"] or {}).get("data") or [], "error": orders["error"]},
        "kpis": {
            "sellers": em.get("totalSellers"),
            "gmv": em.get("gmv"),
            "totalOrders": em.get("totalOrders"),
            "aov": em.get("aov"),
            "returnRate": em.get("returnRate"),
            "monthlyGmv": em.get("monthlyGmv") or [],
            "ordersByStatus": em.get("ordersByStatus") or {},
            "topProducts": em.get("topProducts") or [],
            "topSellers": em.get("topSellers") or [],
        },
    }


@router.get("/marketplace/products")
async def marketplace_products(request: Request):
    params = {k: v for k, v in request.query_params.items() if k in PRODUCT_PARAMS}
    client = get_http(request)
    upstream = await client.get("/v1/admin/marketplace/products", params=params or None, headers=pass_through_headers(request))
    return Response(content=upstream.content, status_code=upstream.status_code, media_type=upstream.headers.get("content-type", "application/json"))


@router.get("/marketplace/orders")
async def marketplace_orders(request: Request):
    params = {k: v for k, v in request.query_params.items() if k in ORDER_PARAMS}
    client = get_http(request)
    upstream = await client.get("/v1/admin/marketplace/orders", params=params or None, headers=pass_through_headers(request))
    return Response(content=upstream.content, status_code=upstream.status_code, media_type=upstream.headers.get("content-type", "application/json"))


@router.get("/personas/agri-market-seller/shops")
async def ams_shops(request: Request):
    """Shop profiles are proxied from seller-persona accounts (no dedicated
    shop entity exists upstream). Read-only until a shop API lands."""
    client = get_http(request)
    headers = pass_through_headers(request)
    params = {"pageSize": 100}
    q = request.query_params.get("search")
    if q:
        params["q"] = q
    upstream = await client.get("/v1/admin/users", params=params, headers=headers)
    if upstream.status_code >= 400:
        return Response(content=upstream.content, status_code=upstream.status_code, media_type=upstream.headers.get("content-type", "application/json"))
    payload = upstream.json()
    sellers = [
        u for u in (payload.get("data") or [])
        if str(u.get("primaryProfile") or "").lower() in SHOP_OWNER_PROFILES
    ]
    return {"data": sellers, "total": len(sellers)}
