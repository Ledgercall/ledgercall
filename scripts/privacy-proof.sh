#!/usr/bin/env bash
# PQS visibility check.
#
# Runs the same SQL against two participants' Participant Query Store databases
# and shows the different answers each returns:
#   - the GP/admin participant (app-provider) sees every LP's obligation
#   - the isolated-LP participant (app-user) sees exactly one
#
# The difference is enforced by the Canton protocol, not by the application.
#
# Prereq: LocalNet is up (scripts/localnet-up.sh) and the demo has been seeded with
# the GP + N-1 LPs on app-provider and one LP alone on app-user.
set -uo pipefail

# PQS's active() uses the internal template_fqn form `package-name:Module:Template`
# (no leading '#'; the '#' form is for the Ledger API, not the PQS DB).
PKG="${PKG:-ledgercall}"
OBL="active('${PKG}:LedgerCall.Call:CallObligation')"
PROP="active('${PKG}:LedgerCall.Cascade:ShortfallProposal')"

# psql runs inside the postgres container (no local psql needed). PQS schema is public.
q() { # $1=db  $2=sql
  docker exec -e PGPASSWORD=supersafe postgres \
    psql -qtAX -U cnadmin -d "$1" -c "$2" 2>&1
}

banner() { printf '\n\033[1m%s\033[0m\n' "$1"; }

banner "1) count of visible CallObligation contracts (same query, two databases)"
printf "   GP  (app-provider PQS): %s\n" "$(q pqs-app-provider "SELECT count(*) FROM ${OBL};")"
printf "   LP  (app-user     PQS): %s\n" "$(q pqs-app-user     "SELECT count(*) FROM ${OBL};")"

banner "2) which obligations each database can read (lp, amountDue, divulged_only)"
echo   "   --- app-provider (GP) ---"
q pqs-app-provider "SELECT payload->>'lp' AS lp, payload->>'amountDue' AS due, divulged_only FROM ${OBL} ORDER BY 2;"
echo   "   --- app-user (isolated LP) ---"
q pqs-app-user     "SELECT payload->>'lp' AS lp, payload->>'amountDue' AS due, divulged_only FROM ${OBL} ORDER BY 2;"

banner "3) the ShortfallProposal that names the defaulter (visible only to GP/admin)"
printf "   GP  (app-provider PQS): %s\n" "$(q pqs-app-provider "SELECT count(*) FROM ${PROP};")"
printf "   LP  (app-user     PQS): %s   <- the LP's node cannot see the proposal exists\n" \
       "$(q pqs-app-user "SELECT count(*) FROM ${PROP};")"

banner "Done. The difference is enforced by the Canton protocol, not by the application."
