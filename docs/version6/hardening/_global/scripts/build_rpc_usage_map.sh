#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
WORKSHEET_PATH="${1:-$ROOT_DIR/docs/version5/hardening/_global/evidence/2026-01-14/55_RPC_SCOPING_WORKSHEET.md}"
OUT_USAGE="$ROOT_DIR/docs/version5/hardening/_global/RPC-USAGE-MAP.md"
OUT_SAFE="$ROOT_DIR/docs/version5/hardening/_global/RPC-SAFE-REVOKE-SET.md"

ROOT_DIR="$ROOT_DIR" WORKSHEET_PATH="$WORKSHEET_PATH" OUT_USAGE="$OUT_USAGE" OUT_SAFE="$OUT_SAFE" python3 - <<'PY'
import os
import re
from collections import defaultdict

root = os.environ.get("ROOT_DIR", os.getcwd())
worksheet_path = os.environ.get("WORKSHEET_PATH")
out_usage = os.environ.get("OUT_USAGE")
out_safe = os.environ.get("OUT_SAFE")

if not worksheet_path or not os.path.exists(worksheet_path):
    raise SystemExit(f"Worksheet not found: {worksheet_path}")

code_roots = ["src", "app", "lib", "utils"]
code_extensions = {".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"}

rpc_patterns = [
    ("supabase.rpc", re.compile(r"\brpc\(\s*['\"]([A-Za-z0-9_]+)['\"]")),
    ("rest/v1/rpc", re.compile(r"/rest/v1/rpc/([A-Za-z0-9_]+)")),
]


def parse_md_table(path):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip().startswith("|"):
                continue
            parts = [p.strip() for p in line.strip().strip("|").split("|")]
            if not parts or parts[0] in ("bucket", "---"):
                continue
            if all(p.strip("-") == "" for p in parts):
                continue
            if len(parts) < 9:
                continue
            rows.append({
                "bucket": parts[0],
                "schema_name": parts[1],
                "function_name": parts[2],
                "identity_args": parts[3],
                "gate_public_execute": parts[4].lower() == "true",
                "gate_anon_execute": parts[5].lower() == "true",
                "referenced_in_policies": parts[6].lower() == "true",
                "referenced_in_views": parts[7].lower() == "true",
                "referenced_in_triggers": parts[8].lower() == "true",
            })
    return rows


def iter_code_files():
    for rel_root in code_roots:
        abs_root = os.path.join(root, rel_root)
        if not os.path.isdir(abs_root):
            continue
        for dirpath, dirnames, filenames in os.walk(abs_root):
            dirnames[:] = [d for d in dirnames if d not in ("node_modules", "dist", "build", ".git")]
            for filename in filenames:
                _, ext = os.path.splitext(filename)
                if ext not in code_extensions:
                    continue
                yield os.path.join(dirpath, filename)


usage = defaultdict(lambda: {"count": 0, "callsites": set(), "patterns": set()})
for file_path in iter_code_files():
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f, 1):
                for label, pattern in rpc_patterns:
                    for match in pattern.finditer(line):
                        fn = match.group(1)
                        rel_path = os.path.relpath(file_path, root)
                        usage[fn]["count"] += 1
                        usage[fn]["callsites"].add(f"{rel_path}:{idx}")
                        usage[fn]["patterns"].add(label)
    except UnicodeDecodeError:
        continue


def format_callsites(callsites, limit=5):
    callsites = sorted(callsites)
    if len(callsites) <= limit:
        return ", ".join(callsites)
    return ", ".join(callsites[:limit]) + f" (+{len(callsites) - limit} more)"


worksheet_rows = parse_md_table(worksheet_path)
worksheet_functions = sorted({r["function_name"] for r in worksheet_rows})

usage_rows = []
for fn in sorted(usage.keys()):
    entry = usage[fn]
    usage_rows.append({
        "function_name": fn,
        "call_count": entry["count"],
        "callsites": format_callsites(entry["callsites"]),
        "patterns": ", ".join(sorted(entry["patterns"])),
    })

not_found = [fn for fn in worksheet_functions if fn not in usage]

rerun_cmd = "bash docs/version5/hardening/_global/scripts/build_rpc_usage_map.sh"

with open(out_usage, "w", encoding="utf-8") as f:
    f.write("# RPC Usage Map (static repo scan)\n\n")
    f.write(f"How to re-run:\n\n```\n{rerun_cmd}\n```\n\n")
    f.write("## Purpose\n")
    f.write("- Deterministic inventory of RPC callsites found in code (static scan only; no DB introspection).\n")
    f.write("- Used to reconcile DB exposure vs actual app usage.\n\n")
    f.write("## Generation notes\n")
    f.write(f"- Worksheet source: `{os.path.relpath(worksheet_path, root)}`\n")
    f.write(f"- Scanned roots: {', '.join(code_roots)}\n")
    f.write("- Patterns: `supabase.rpc(...)`, `.rpc(...)`, `/rest/v1/rpc/<fn>`\n\n")
    f.write("## RPC callsites found in code\n\n")
    f.write("| function_name | call_count | callsites | patterns_matched | notes |\n")
    f.write("| --- | --- | --- | --- | --- |\n")
    for row in usage_rows:
        callsites = row["callsites"] if row["callsites"] else "-"
        patterns = row["patterns"] if row["patterns"] else "-"
        f.write(f"| {row['function_name']} | {row['call_count']} | {callsites} | {patterns} | |\n")
    f.write("\n## Not found in code (but present in DB worksheet)\n\n")
    if not_found:
        for fn in not_found:
            f.write(f"- {fn}\n")
    else:
        f.write("- None\n")


def is_admin_only(callsites):
    if not callsites:
        return False
    for cs in callsites:
        path = cs.split(":", 1)[0].lower()
        if "admin" not in path:
            return False
    return True


safe_rows = []
for row in worksheet_rows:
    fn = row["function_name"]
    callsites = usage.get(fn, {}).get("callsites", set())
    called_in_code = fn in usage
    admin_only = is_admin_only(callsites)
    bucket = row["bucket"]
    referenced = row["referenced_in_policies"] or row["referenced_in_views"] or row["referenced_in_triggers"]

    recommendation = "HOLD"
    rationale_parts = []

    if bucket in ("admin_", "owner_", "internal"):
        if bucket == "internal":
            recommendation = "SAFE_TO_REVOKE_PUBLIC"
            rationale_parts.append("Internal helper; not intended for direct RPC invocation.")
        else:
            if referenced:
                recommendation = "HOLD"
                rationale_parts.append("Referenced in policies/views/triggers; avoid revoke until validated.")
            elif called_in_code and not admin_only:
                recommendation = "HOLD"
                rationale_parts.append("Called in code outside admin-only paths.")
            else:
                recommendation = "SAFE_TO_REVOKE_PUBLIC"
                rationale_parts.append("Admin/owner RPC; no public/anon use inferred.")
    elif bucket == "public_read":
        recommendation = "HOLD"
        rationale_parts.append("Public-read bucket; do not revoke without explicit decision.")
    elif bucket == "auth_rpc":
        recommendation = "HOLD"
        rationale_parts.append("Auth-only RPC; handle via authenticated allowlist, not public revoke set.")
    else:
        recommendation = "HOLD"
        rationale_parts.append("Insufficient signal; default HOLD.")

    if called_in_code:
        rationale_parts.append("called_in_code=yes")
    else:
        rationale_parts.append("called_in_code=no")

    safe_rows.append({
        "bucket": bucket,
        "function_name": fn,
        "identity_args": row["identity_args"],
        "gate_public_execute": row["gate_public_execute"],
        "gate_anon_execute": row["gate_anon_execute"],
        "referenced_in_policies": row["referenced_in_policies"],
        "referenced_in_views": row["referenced_in_views"],
        "referenced_in_triggers": row["referenced_in_triggers"],
        "called_in_code": "yes" if called_in_code else "no",
        "recommendation": recommendation,
        "rationale": " ".join(rationale_parts),
    })


safe_rows.sort(key=lambda r: (r["bucket"], r["function_name"], r["identity_args"]))

with open(out_safe, "w", encoding="utf-8") as f:
    f.write("# RPC Safe Revoke Set (PUBLIC/anon)\n\n")
    f.write(f"How to re-run:\n\n```\n{rerun_cmd}\n```\n\n")
    f.write("## Principle\n")
    f.write("- We do not guess public allowlists.\n")
    f.write("- Safe revoke set = functions that should never be callable by PUBLIC/anon based on bucket + usage + dependency signals.\n\n")
    f.write("## Safe revoke evaluation\n\n")
    f.write("| bucket | function_name | identity_args | gate_public_execute | gate_anon_execute | referenced_in_policies | referenced_in_views | referenced_in_triggers | called_in_code | recommendation | rationale |\n")
    f.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
    for r in safe_rows:
        f.write(
            f"| {r['bucket']} | {r['function_name']} | {r['identity_args']} | "
            f"{str(r['gate_public_execute']).lower()} | {str(r['gate_anon_execute']).lower()} | "
            f"{str(r['referenced_in_policies']).lower()} | {str(r['referenced_in_views']).lower()} | "
            f"{str(r['referenced_in_triggers']).lower()} | {r['called_in_code']} | "
            f"{r['recommendation']} | {r['rationale']} |\n"
        )
PY
