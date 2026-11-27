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

The superadmin console authenticates against the deployed API (`POST /v1/auth/login`)
with an **admin-seeded** account (mobile + 4-digit MPIN). There is no self sign-up.

> **Seeding is a prerequisite.** If login returns `USER_NOT_FOUND`, an admin account
> must be seeded on the API server by running
> [`backend/scripts/seed_superadmin_users.py`](https://github.com/techlitinc-dev/AGROVERCITY-05_10_2026/blob/main/backend/scripts/seed_superadmin_users.py)
> from the `AGROVERCITY-05_10_2026` repo there. Known dev seed: `+919000000001` / `1234`
> (`backend/app/data/superadmin_seed.py`).

Lockout policy (5 failed attempts → 15-minute lock) is enforced by the upstream API
(`security-policy`); the login page shows the countdown from the 429 response.

## What talks to what

```
Browser ──/api/*──► gateway (:8010) ──/v1/*──► deployed API (65.20.92.22:8000)
   ^ same origin in prod (SPA served by gateway); in dev, Vite proxies /api
```
