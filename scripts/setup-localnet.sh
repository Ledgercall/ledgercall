#!/usr/bin/env bash
# Bring up a cn-quickstart LocalNet (3 participants + PQS) without Nix and without
# the quickstart's sample app; this project deploys its own DAR and drives it with dpm.
#
# LocalNet provides three distinct Canton participant nodes (sv / app-provider /
# app-user), each with its own Ledger API and its own PQS Postgres database. The nodes
# are co-located in containers but isolated at the protocol level.
#
# Requires: docker (>=27) + docker compose (>=2.27), ~8GB free for Docker.
set -euo pipefail

QS_REPO="https://github.com/digital-asset/cn-quickstart"
QS_REF="33eddeb992d4a16de18685585617a4c54e91ceac"   # pinned; LocalNet Splice 0.6.11
QS_ROOT="${QS_ROOT:-/tmp/cn-quickstart}"
QS="$QS_ROOT/quickstart"

if [ ! -d "$QS_ROOT/.git" ]; then
  echo ">> cloning cn-quickstart @ ${QS_REF:0:12}"
  git clone "$QS_REPO" "$QS_ROOT"
  git -C "$QS_ROOT" checkout -q "$QS_REF"
fi

# Nix-free config: shared-secret auth, both app-provider and app-user PQS on.
cat > "$QS/.env.local" <<'EOF'
AUTH_MODE=shared-secret
PARTY_HINT=ledgercall-localparty-1
OBSERVABILITY_ENABLED=false
RESOURCE_CONSTRAINTS_ENABLED=false
TEST_MODE=off
PQS_APP_USER_PROFILE=on
EOF

cd "$QS"
export IMAGE_TAG=0.6.11 AUTH_MODE=shared-secret PQS_APP_USER_PROFILE=on
export OBSERVABILITY_ENABLED=false RESOURCE_CONSTRAINTS_ENABLED=false
export MODULES_DIR="$QS/docker/modules"
export LOCALNET_DIR="$MODULES_DIR/localnet"
export LOCALNET_ENV_DIR="$LOCALNET_DIR/env"

DC=(docker compose
  -f docker/modules/localnet/compose.yaml
  -f docker/modules/splice-onboarding/compose.yaml
  -f docker/modules/pqs/compose.yaml
  --env-file .env --env-file .env.local
  --env-file docker/modules/localnet/compose.env
  --env-file docker/modules/localnet/env/common.env
  --env-file docker/modules/pqs/compose.env
  --profile app-provider --profile app-user --profile sv
  --profile pqs-app-provider --profile pqs-app-user)

# Only the infra services; no nginx, web UIs, or sample app.
SERVICES=(postgres canton splice splice-onboarding pqs-app-provider pqs-app-user)

echo ">> building the splice-onboarding helper image"
"${DC[@]}" build splice-onboarding

echo ">> starting LocalNet infra: ${SERVICES[*]}"
"${DC[@]}" up -d "${SERVICES[@]}"

echo ">> waiting for canton + splice + onboarding to become healthy (can take a few minutes)"
for svc in canton splice splice-onboarding; do
  printf "   %s " "$svc"
  for _ in $(seq 1 120); do
    st=$(docker inspect -f '{{.State.Health.Status}}' "$svc" 2>/dev/null || echo missing)
    if [ "$st" = healthy ]; then echo "OK"; break; fi
    printf "."; sleep 5
  done
done

echo ">> LocalNet status:"
"${DC[@]}" ps
echo ">> Ledger APIs:  sv=4901  app-provider=3901  app-user=2901   (JSON: 4975/3975/2975)"
echo ">> Postgres:     localhost:5432  (user cnadmin / pass supersafe); PQS DBs: pqs-app-provider, pqs-app-user"
