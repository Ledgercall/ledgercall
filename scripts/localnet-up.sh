#!/usr/bin/env bash
# One-command bring-up of the seeded LEDGERCALL demo on an already-provisioned
# LocalNet. Idempotent: run it after a reboot, a container restart, or to reset
# the demo to a clean seeded state.
#
# Assumes scripts/setup-localnet.sh has already created the infra containers once
# (it clones cn-quickstart and does the first `docker compose up`). This script
# only brings those containers back and (re)deploys + (re)seeds the app.
#
# Two gotchas this script works around, both learned the hard way:
#   1. splice-onboarding never reports `healthy` on a recovered volume (it loops
#      on a missing /canton/dars dir). Its onboarding work is already done, so we
#      wait on canton/splice/postgres only and start the PQS containers directly,
#      bypassing their depends_on-health gate.
#   2. If the ledger already has a `ledgercall 1.0.0` package with a different
#      hash than the current build, Canton refuses to vet the new one (same
#      name+version). The upload step tolerates that; the seed resolves templates
#      by package-NAME so it runs against whichever package is vetted. To deploy
#      CURRENT source cleanly, start from an empty DB: (cd the quickstart && docker
#      compose ... down -v) then rerun setup-localnet.sh before this.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.dpm/bin:$PATH"
DAR="$ROOT/.daml/dist/ledgercall-1.0.0.dar"

INFRA=(postgres canton splice splice-onboarding pqs-app-provider pqs-app-user)
for c in "${INFRA[@]}"; do
  docker inspect "$c" >/dev/null 2>&1 || { echo "!! container '$c' does not exist — run scripts/setup-localnet.sh first"; exit 1; }
done

echo ">> starting infra containers"
docker start "${INFRA[@]}" >/dev/null

echo ">> waiting for canton + splice + postgres to be healthy (onboarding is skipped on purpose)"
for svc in postgres canton splice; do
  printf "   %s " "$svc"
  for _ in $(seq 1 120); do
    st=$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null || echo missing)
    [ "$st" = healthy ] && { echo OK; break; }
    printf "."; sleep 5
  done
done
echo ">> (re)starting PQS directly, past the onboarding-health gate"
docker start pqs-app-provider pqs-app-user >/dev/null

echo ">> minting ledger-api-user tokens"
python3 "$ROOT/scripts/mint-localnet-token.py" ledger-api-user > /tmp/ap.jwt
cp /tmp/ap.jwt /tmp/au.jwt

echo ">> building the DAR"
( cd "$ROOT" && dpm build >/dev/null )

echo ">> participant configs for Daml Script (gRPC ledger API)"
cat > /tmp/participants.json    <<EOF
{ "default_participant": { "host": "localhost", "port": 3901 },
  "participants": { "app-provider": { "host": "localhost", "port": 3901 } }, "party_participants": {} }
EOF
cat > /tmp/participants-au.json <<EOF
{ "default_participant": { "host": "localhost", "port": 2901 },
  "participants": { "app-user": { "host": "localhost", "port": 2901 } }, "party_participants": {} }
EOF

echo ">> vetting the DAR on both participants (tolerated if an equal-version package is already vetted)"
dpm script --dar "$DAR" --script-name LedgerCall.LocalNetSeed:noop --upload-dar yes \
  --participant-config /tmp/participants.json    --access-token-file /tmp/ap.jwt --user-id ledger-api-user >/dev/null 2>&1 \
  || echo "   app-provider: package already vetted (or version clash) — continuing"
dpm script --dar "$DAR" --script-name LedgerCall.LocalNetSeed:noop --upload-dar yes \
  --participant-config /tmp/participants-au.json --access-token-file /tmp/au.jwt --user-id ledger-api-user >/dev/null 2>&1 \
  || echo "   app-user: package already vetted (or version clash) — continuing"

echo ">> seeding the demo (archives any prior demo contracts, recreates clean)"
bash "$ROOT/scripts/seed-localnet.sh"

echo ">> writing frontend/public/demo-config.json"
bash "$ROOT/scripts/gen-frontend-config.sh"

cat <<'EOF'
>> up. next:
   scripts/privacy-proof.sh         # same SQL, two PQS DBs -> 6 vs 1
   (cd frontend && npx vite)        # UI at http://localhost:5173
EOF
