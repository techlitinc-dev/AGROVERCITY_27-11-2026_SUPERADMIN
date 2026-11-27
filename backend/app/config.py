import os
from pathlib import Path

UPSTREAM_BASE_URL = os.getenv("UPSTREAM_BASE_URL", "http://65.20.92.22:8000").rstrip("/")

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
SPA_DIST = Path(os.getenv("SPA_DIST", REPO_ROOT / "superadmin" / "dist"))

# Headers forwarded from the SPA to the upstream API (lowercase names).
PASS_HEADERS = ("authorization", "x-api-key", "x-audit-reason")

UPSTREAM_TIMEOUT_SECONDS = float(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "30"))
