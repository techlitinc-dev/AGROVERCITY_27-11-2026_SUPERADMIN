# Module 01 — Admin Auth & Profile

> Source: `superadmin_modules.md` §4.1 · Module 1 of 7 · Pages: 2
> Shared anatomy & theme: [README](README.md) §3–4 · Design rules: [README](README.md) §2

## Purpose

Gatekeeper module. Authenticates the superadmin operator and manages their own account. Every other module sits behind its session. Auth is the **only** module where the actor is the admin themselves, not user data — so no KPI/table anatomy here; screens are form-based but keep the app theme.

## Routes

| Route | Page |
|---|---|
| `/login` | Admin Login |
| `/profile` | Admin Profile |

## Page 1 — Admin Login

**Route**: `/login` (public; redirects to `/` when already authenticated)

**Layout**: centered card on `bg-agri-950` → `agri-800` gradient, logo top, `slide-up` entrance.

**Fields & behaviour**
- Mobile number (10-digit, validated) + MPIN (4-digit PIN) or password toggle — accept either per operator setting.
- Show/hide toggle for MPIN; numeric keypad friendly.
- Submit → `POST /auth/admin/login` → JWT session via `AuthContext`; failed attempts tracked.
- Security: rate-limit 5 attempts / 5 min per mobile; lockout 15 min after 5 failures; error message stays generic ("Invalid credentials").
- Failed logins and lockouts are written to the Audit Log (module 07) automatically — reason string: `login_failed` / `account_locked`.

## Acceptance criteria

**Login**
- [ ] Valid credentials land on Dashboard within 2 clicks total (login → dashboard).
- [ ] 5 wrong MPINs lock the account for 15 min with a clear countdown message.
- [ ] Session survives refresh (token in httpOnly cookie or secure storage); `/login` redirects to `/` when active.
- [ ] Every login success/failure appears in the Audit Log with operator mobile + IP.

## Page 2 — Admin Profile

**Route**: `/profile`

**Sections**
1. **Profile card** — name, mobile, role (`Superadmin`), avatar initial, created date. Read-only except display name.
2. **Change MPIN** — old MPIN → new MPIN (×2). Rules: 4 digits, not sequential/repeated; requires old MPIN to succeed. Audited with reason `mpin_changed`.
3. **Active sessions list** — table: device/browser, IP, last active, created; action **Revoke** (per-row, `AuditModal` reason required; current session cannot revoke itself).
4. **Logout** — clears session, returns to `/login`. Audited with reason `logout`.

**Profile**
- [ ] MPIN change rejects mismatched/weak PINs with inline errors and never reveals the old MPIN.
- [ ] Revoked sessions are invalidated server-side and disappear from the list immediately.
- [ ] All four events (login, logout, MPIN change, session revoke) are visible in the Audit Log.

## Operator notes

Operators log in with the mobile + MPIN issued by platform ops (seeded via `backend/app/data/superadmin_seed.py` in the source repo). There is no self-signup.

## Traceability

Pages (2): Admin Login, Admin Profile — matches `superadmin_modules.md` §4.1 and §5 (Auth & Profile = 2).
