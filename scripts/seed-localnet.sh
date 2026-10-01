#!/usr/bin/env bash
# Seed the LEDGERCALL demo on a running LocalNet, across two participants, for the
# PQS visibility check.
#
# Each PQS reads as its participant's operator party, so this script casts those
# operator parties in the demo roles that must be PQS-visible:
#   - gp     = the app-provider operator party   (its PQS sees every obligation)
#   - isoLp  = the app-user operator party        (its PQS sees only its own)
# admin and the remaining LPs are freshly allocated on app-provider (observers only;
# the GP is sole signatory of the obligations, so its PQS sees them all regardless).
set -euo pipefail

N_AP="${N_AP:-5}"                                  # extra LPs on app-provider (plus gp, admin, and the isolated LP)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DAR="$ROOT/.daml/dist/ledgercall-1.0.0.dar"
AP="$(cat /tmp/ap.jwt)"; AU="$(cat /tmp/au.jwt)"
export PATH="$HOME/.dpm/bin:$PATH"

jqparty() { python3 -c "import sys,json; d=json.load(sys.stdin); print([r['kind']['CanReadAs']['value']['party'] for r in d['rights'] if 'CanReadAs' in r['kind']][0])"; }

alloc() { # $1=hint $2=jsonport $3=token  -> prints full party id (idempotent)
  local pid
  pid=$(curl -sS -X POST "http://localhost:$2/v2/parties" -H "Authorization: Bearer $3" \
        -H "Content-Type: application/json" --data-raw "{\"partyIdHint\":\"$1\",\"identityProviderId\":\"\"}" \
        | jq -r '.partyDetails.party // empty')
  [ -z "$pid" ] && pid=$(curl -sS "http://localhost:$2/v2/parties" -H "Authorization: Bearer $3" \
        | jq -r --arg h "$1" '.partyDetails[].party | select(startswith($h + "::"))' | head -1)
  echo "$pid"
}

grant_actas() { # $1=partyId  (on app-provider)
  curl -sS -X POST "http://localhost:3975/v2/users/ledger-api-user/rights" -H "Authorization: Bearer $AP" \
    -H "Content-Type: application/json" \
    --data-raw "{\"userId\":\"ledger-api-user\",\"identityProviderId\":\"\",\"rights\":[{\"kind\":{\"CanActAs\":{\"value\":{\"party\":\"$1\"}}}}]}" >/dev/null
}

echo ">> resolving the two operator parties each PQS reads as"
GP=$(curl -sS http://localhost:3975/v2/users/app-provider-pqs-user/rights -H "Authorization: Bearer $AP" | jqparty)
ISO=$(curl -sS http://localhost:2975/v2/users/app-user-pqs-user/rights -H "Authorization: Bearer $AU" | jqparty)
ADMIN=$(alloc admin 3975 "$AP")
REG=$(alloc registry 3975 "$AP")
LPS=(); for i in $(seq 1 "$N_AP"); do LPS+=("$(alloc "lp$i" 3975 "$AP")"); done
echo "   gp       = $GP   (app-provider operator)"
echo "   isoLp    = $ISO   (app-user operator)"
echo "   admin    = $ADMIN"
echo "   registry = $REG"

echo ">> granting CanActAs (gp, admin, registry, and each app-provider LP) to ledger-api-user"
for p in "$GP" "$ADMIN" "$REG" "${LPS[@]}"; do grant_actas "$p"; done

echo ">> building seed input"
LPS_JSON=$(printf '%s\n' "${LPS[@]}" | jq -R . | jq -s .)
jq -n --arg gp "$GP" --arg admin "$ADMIN" --arg reg "$REG" --arg iso "$ISO" --argjson lps "$LPS_JSON" \
  '{gp:$gp, admin:$admin, registry:$reg, lps:$lps, isoLp:$iso}' > /tmp/seed-input.json

echo ">> creating call + obligations + shortfall proposal via Daml Script"
dpm script --dar "$DAR" --script-name LedgerCall.LocalNetSeed:seedFromInput \
  --input-file /tmp/seed-input.json --participant-config /tmp/participants.json \
  --access-token-file /tmp/ap.jwt --user-id ledger-api-user

echo ">> seed complete."
