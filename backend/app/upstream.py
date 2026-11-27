from fastapi import Request
from fastapi.responses import JSONResponse, Response
import httpx

from app.config import PASS_HEADERS, UPSTREAM_BASE_URL, UPSTREAM_TIMEOUT_SECONDS


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def pass_through_headers(request: Request) -> dict:
    headers = {}
    for name in PASS_HEADERS:
        value = request.headers.get(name)
        if value:
            headers[name] = value
    return headers


async def forward(request: Request, method: str, upstream_path: str, json_body=None) -> Response:
    """Proxy a call to the deployed AGROVERCITY API, passing auth headers through."""
    client = get_http(request)
    try:
        upstream = await client.request(
            method,
            upstream_path,
            json=json_body,
            headers=pass_through_headers(request),
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


def upstream_url(path: str) -> str:
    return f"{UPSTREAM_BASE_URL}{path}"
