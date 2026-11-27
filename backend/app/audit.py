"""Shared local audit trail for gateway-side admin actions.

The upstream /v1/admin/audit endpoint is read-only, so actions the gateway
performs or forwards (exports, suspensions, MPIN resets, KYC decisions, ...)
are recorded here as JSONL for the Audit Log module (07) to surface later.
"""

import json
import threading
from datetime import datetime, timezone

from app.config import ADMIN_AUDIT_FILE

_lock = threading.Lock()


def record(*, module: str, target: str, action: str, reason: str, ip: str | None) -> None:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "operator": "superadmin",
        "module": module,
        "target": target,
        "action": action,
        "reason": reason,
        "ip": ip,
    }
    with _lock:
        ADMIN_AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
        with ADMIN_AUDIT_FILE.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
