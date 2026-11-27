from fastapi import APIRouter, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.upstream import forward, get_http, pass_through_headers

router = APIRouter(prefix="/api", tags=["auth"])


class ChangeMpinIn(BaseModel):
    oldMpin: str = Field(min_length=4, max_length=6)
    newMpin: str = Field(min_length=4, max_length=6)


@router.post("/auth/login")
async def login(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/login", json_body=body)


@router.get("/auth/me")
async def me(request: Request):
    return await forward(request, "GET", "/v1/users/me")


@router.post("/auth/refresh")
async def refresh(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/refresh", json_body=body)


@router.post("/auth/logout")
async def logout(request: Request):
    body = await request.json()
    return await forward(request, "POST", "/v1/auth/logout", json_body=body)


@router.get("/auth/sessions")
async def sessions(request: Request):
    return await forward(request, "GET", "/v1/auth/sessions")


@router.delete("/auth/sessions/{jti}")
async def revoke_session(request: Request, jti: str):
    return await forward(request, "DELETE", f"/v1/auth/sessions/{jti}")


@router.post("/auth/change-mpin")
async def change_mpin(request: Request, payload: ChangeMpinIn):
    """Change the logged-in admin's MPIN: verify the old one, then set the new one.

    Mirrors doc/01-admin-auth-and-profile.md — old MPIN is required to succeed.
    """
    client = get_http(request)
    headers = pass_through_headers(request)

    verify = await client.post("/v1/admin/verify-mpin", json={"mpin": payload.oldMpin}, headers=headers)
    if verify.status_code != 200:
        return Response(
            content=verify.content,
            status_code=verify.status_code,
            media_type=verify.headers.get("content-type", "application/json"),
        )

    set_new = await client.post("/v1/auth/mpin/set", json={"mpin": payload.newMpin}, headers=headers)
    return Response(
        content=set_new.content,
        status_code=set_new.status_code,
        media_type=set_new.headers.get("content-type", "application/json"),
    )
