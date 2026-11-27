from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import SPA_DIST, UPSTREAM_BASE_URL, UPSTREAM_TIMEOUT_SECONDS
from app.routers import auth as auth_router


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
            return FileResponse(SPA_DIST / "index.html")

    return app


app = create_app()
