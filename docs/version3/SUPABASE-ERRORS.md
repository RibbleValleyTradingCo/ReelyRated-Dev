# Supabase Error Sweep (v3)

This doc tracks all _known_ Supabase/runtime errors and how we resolved them.

For each error:

- Capture **exact message + status code**.
- Note **where** it happens (route, user action, RPC).
- Tie it to **RPC / table** using PAGE-RPC-MAP.
- Decide whether it’s a **bug**, a **valid rejection** (e.g. RLS), or a **misconfiguration**.

---

## 1. Open Issues

### 1.1 [Short label, e.g. "get_venue_recent_catches 400 / weight_unit"]

- **Route / Page**: `/venues/:slug`
- **User action**: load venue detail
- **Error**: `POST .../rpc/get_venue_recent_catches 400 (Bad Request)`
- **Supabase json**: `code`, `details`, `hint`, `message`
- **RPC**: `get_venue_recent_catches`
- **Tables/Views**: `catches`, `profiles`, `species`, ...
- **Hypothesis**: e.g. enum mismatch / wrong return type
- **Status**: 🔴 Open / 🟡 In progress / 🟢 Fixed

### 1.2 ...

---

## 2. Resolved Issues

### 2.1 [Label]

- **Root cause**:
- **Fix**:
- **Files touched**:
- **How to re-test**:
