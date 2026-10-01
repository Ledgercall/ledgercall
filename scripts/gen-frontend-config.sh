#!/usr/bin/env bash
# Writes frontend/public/demo-config.json (party IDs + reader token) from the last
# seed, so the UI's viewports bind to the live parties without hardcoding.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/frontend/public/demo-config.json"
mkdir -p "$ROOT/frontend/public"
TOKEN="$(cat /tmp/ap.jwt)"

jq -n --slurpfile s /tmp/seed-input.json --arg tok "$TOKEN" '
  ($s[0]) as $p | {
    token: $tok,
    gp:    {label: "General Partner", party: $p.gp,    base: "/ap"},
    admin: {label: "Administrator",   party: $p.admin, base: "/ap"},
    lps: [
      {label: "LP #1", party: $p.lps[0], base: "/ap"},
      {label: "LP #2", party: $p.lps[1], base: "/ap"},
      {label: "LP (isolated, app-user)", party: $p.isoLp, base: "/au"}
    ]
  }' > "$OUT"
echo "wrote $OUT"
