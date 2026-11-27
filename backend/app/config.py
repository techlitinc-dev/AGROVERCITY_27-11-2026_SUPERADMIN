import os
from pathlib import Path

UPSTREAM_BASE_URL = os.getenv("UPSTREAM_BASE_URL", "http://65.20.92.22:8000").rstrip("/")

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
SPA_DIST = Path(os.getenv("SPA_DIST", REPO_ROOT / "superadmin" / "dist"))

# Headers forwarded from the SPA to the upstream API (lowercase names).
PASS_HEADERS = ("authorization", "x-api-key", "x-audit-reason")

UPSTREAM_TIMEOUT_SECONDS = float(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "30"))

# --- Superadmin web-app login (email + password, verified locally by the gateway) ---
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@gmail.com").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
LOGIN_MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_LOCKOUT_SECONDS = int(os.getenv("LOGIN_LOCKOUT_SECONDS", "900"))

# Local JSON file written when the operator changes their password or recovery
# email. While it exists it overrides ADMIN_PASSWORD for login verification.
ADMIN_CREDENTIALS_FILE = Path(
    os.getenv("ADMIN_CREDENTIALS_FILE", BACKEND_DIR / "app" / "data" / "admin_credentials.json")
)

# Local JSONL audit trail for gateway-side admin actions (e.g. dashboard exports).
# The upstream /v1/admin/audit endpoint is read-only, so actions the gateway
# performs itself are recorded here for the Audit Log module to merge later.
ADMIN_AUDIT_FILE = Path(
    os.getenv("ADMIN_AUDIT_FILE", BACKEND_DIR / "app" / "data" / "admin_audit.jsonl")
)

# Seeded operator account the gateway exchanges for an upstream session after a
# successful email/password login (see backend/scripts/seed_superadmin_users.py).
UPSTREAM_SERVICE_PHONE = os.getenv("UPSTREAM_SERVICE_PHONE", "+919000000001")
UPSTREAM_SERVICE_MPIN = os.getenv("UPSTREAM_SERVICE_MPIN", "1234")
