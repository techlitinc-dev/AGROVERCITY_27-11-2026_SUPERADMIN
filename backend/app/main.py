from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import SPA_DIST, UPSTREAM_BASE_URL, UPSTREAM_TIMEOUT_SECONDS
from app.routers import auth as auth_router
from app.routers import dashboard as dashboard_router
from app.routers import market as market_router
from app.routers import users as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        base_url=UPSTREAM_BASE_URL,
        timeout=UPSTREAM_TIMEOUT_SECONDS,
    )
    yield
    await app.state.http.aclose()


def create_app() -> FastAPI:
    app = FastAPI(title="Agrovercity Superadmin Gateway", version="0.1.0", lifespan=lifespan)
    app.include_router(auth_router.router)
    app.include_router(dashboard_router.router)
    app.include_router(users_router.router)
    app.include_router(market_router.router)

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "upstream": UPSTREAM_BASE_URL}

    if SPA_DIST.exists():
        app.mount("/assets", StaticFiles(directory=SPA_DIST / "assets"), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa(full_path: str):
            candidate = (SPA_DIST / full_path).resolve()
            if full_path and candidate.is_file() and SPA_DIST.resolve() in candidate.parents:
                return FileResponse(candidate)
            # A path that looks like a file (hashed bundles, images, ...) but
            # doesn't exist must 404 — falling back to index.html here makes
            # stale caches render a blank page (HTML served as JS/CSS).
            if full_path and "." in full_path.rsplit("/", 1)[-1]:
                return JSONResponse({"error": {"code": "NOT_FOUND", "message": f"{full_path} not found", "fieldErrors": {}}}, status_code=404)
            # Client-side route → never cache the shell, so a stale copy can
            # never reference hashed bundles that no longer exist after a rebuild.
            response = FileResponse(SPA_DIST / "index.html")
            response.headers["Cache-Control"] = "no-store, must-revalidate"
            return response

    return app


app = create_app()
