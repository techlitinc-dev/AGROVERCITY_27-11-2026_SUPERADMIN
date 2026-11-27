# Agrovercity Superadmin (27-11-2026)

Superadmin operations console for the Agrovercity ecosystem — a read-first, data-analyst web app.
Spec: [`superadmin_modules.md`](superadmin_modules.md) · Build instructions per module: [`doc/`](doc/README.md).

## Status

- **Module 01 — Admin Auth & Profile**: implemented (backend gateway + React SPA).
- Modules 02–07: pending, in the build order of `doc/README.md` §8.

## Repo layout

```
doc/          Module instruction files (the spec for every screen)
backend/      FastAPI gateway — proxies Module 01 auth calls to the deployed AGROVERCITY API
superadmin/   React SPA (Vite + TypeScript + Tailwind, agri/harvest/earth theme)
```

The gateway is intentionally thin: it holds no credentials of its own, forwards
`Authorization` / `X-API-Key` / `X-Audit-Reason` headers, orchestrates the
change-MPIN flow (verify old → set new), and serves the built SPA in production.
Upstream base URL is env-configurable (`UPSTREAM_BASE_URL`, default
`http://65.20.92.22:8000` — see the Swagger at `/docs` on that host).

## Quickstart

```bash
# 1. Backend gateway (port 8010 — 8000 is commonly taken by other local services)
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8010

# 2. Frontend dev server (superadmin app on :5273, proxies /api → http://localhost:8010)
#    (5173 is reserved for the main Agrovercity web app)
cd superadmin
npm install
npm run dev        # http://localhost:5273

# Tests (mocked upstream, no network needed)
cd backend && .venv/bin/python -m pytest tests
```

Production mode: `cd superadmin && npm run build`, then the gateway serves the SPA
from `superadmin/dist` on the same origin (no CORS issues).

## Operator login (dev)

The superadmin web app signs in with **email + password**, verified by the gateway
(`POST /api/auth/login-email`) with a local failed-attempt throttle (5 failures →
15-minute lockout). On success the gateway exchanges the seeded upstream service
account (`UPSTREAM_SERVICE_PHONE` / `UPSTREAM_SERVICE_MPIN`, default
`+919000000001` / `1234`) for an API session — the rest of the app (profile,
sessions, change-MPIN) works on that upstream session.

| Env var | Default |
|---|---|
| `ADMIN_EMAIL` | `admin@gmail.com` |
| `ADMIN_PASSWORD` | `admin` |

> Owner decision: this replaces the mobile + MPIN login specified in `doc/01`.
> Override the defaults via environment variables before exposing this anywhere real.

> **Seeding is a prerequisite.** If login fails with an upstream error, the service
> account must exist: run
> [`backend/scripts/seed_superadmin_users.py`](https://github.com/techlitinc-dev/AGROVERCITY-05_10_2026/blob/main/backend/scripts/seed_superadmin_users.py)
> from the `AGROVERCITY-05_10_2026` repo on the API server
> (`PYTHONPATH=. ./.venv/bin/python scripts/seed_superadmin_users.py`).

## What talks to what

```
Browser ──/api/*──► gateway (:8010) ──/v1/*──► deployed API (65.20.92.22:8000)
   ^ same origin in prod (SPA served by gateway); in dev, Vite proxies /api
```
