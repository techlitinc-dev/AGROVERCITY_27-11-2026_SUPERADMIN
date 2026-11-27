"""Local credential store for the superadmin web-app login.

The gateway verifies the operator's email/password itself (see
routers/auth.py login-email). A password change or recovery email must
survive restarts, so they are persisted to a small JSON file. While a
password record exists in that file it overrides the ADMIN_PASSWORD
env default from app.config.
"""

import hashlib
import hmac
import json
import os
import secrets
import threading

from app.config import ADMIN_CREDENTIALS_FILE, ADMIN_PASSWORD

_LOCK = threading.Lock()
_PBKDF2_ITERATIONS = 100_000


def _load() -> dict:
    try:
        data = json.loads(ADMIN_CREDENTIALS_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _save(data: dict) -> None:
    path = ADMIN_CREDENTIALS_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, path)


def _hash(password: str, salt_hex: str | None = None) -> dict:
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return {"salt": salt.hex(), "hash": digest.hex(), "iterations": _PBKDF2_ITERATIONS}


def verify_password(candidate: str) -> bool:
    """True when the candidate matches the persisted password, else the env default."""
    record = _load().get("password")
    if isinstance(record, dict) and record.get("salt") and record.get("hash"):
        expected = _hash(candidate, record["salt"])["hash"]
        return hmac.compare_digest(expected, record["hash"])
    return hmac.compare_digest(candidate, ADMIN_PASSWORD)


def set_password(new_password: str) -> None:
    with _LOCK:
        data = _load()
        data["password"] = _hash(new_password)
        _save(data)


def get_recovery_email() -> str | None:
    email = _load().get("recoveryEmail")
    return email if isinstance(email, str) and email else None


def set_recovery_email(email: str) -> None:
    with _LOCK:
        data = _load()
        data["recoveryEmail"] = email
        _save(data)
