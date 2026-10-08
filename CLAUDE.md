# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LEDGERCALL: a Daml/Canton app for private-fund capital calls. LPs lock cash in their own CIP-0056 token registries (no wires), the GP settles every leg atomically or nothing moves, and on an LP default the admin computes a dilution recut that the **GP must approve or decline** (the remedy is deliberately not automated). Every LP sees only its own numbers. README.md, WHY-CANTON.md, HONEST-GAPS.md and JOURNAL.md hold the product rationale and the disclosed limitations. Keep claims in docs consistent with HONEST-GAPS.md.

## Commands

The toolchain is `dpm` (Daml SDK manager). Put `$HOME/.dpm/bin` on PATH. The SDK is pinned to `3.5.12` in `daml.yaml`.

```bash
dpm build                 # -> .daml/dist/ledgercall-1.0.0.dar
dpm test                  # runs all Daml Script tests (8) on an in-memory ledger
dpm test --help           # check for a test-name filter before running a single test
```

The tests are the top-level `test*` Scripts in `daml/LedgerCall/Test.daml` (pro-rata, cascade, privacy, GP approve/decline) and `daml/LedgerCall/TestSettlement.daml` (happy path, one-LP-short-nothing-moves). The README lists the expected per-test transaction and contract counts, so a change in those counts means behaviour changed.

Live LocalNet demo (needs Docker and about 8GB; uses cn-quickstart pinned to Splice 0.6.11):
```bash
scripts/setup-localnet.sh      # one-time: clone cn-quickstart to /tmp/cn-quickstart, start the infra containers
scripts/localnet-up.sh         # idempotent: restart containers, mint JWTs, build, vet DAR, seed, write frontend config
scripts/privacy-proof.sh       # same SQL against two PQS DBs (GP sees all obligations, isolated LP sees 1)
python3 scripts/demo-settlement.py   # atomic settle + deadline-release flows
scripts/scan-proxy.sh && python3 scripts/demo-canton-coin.py   # settle real Canton Coin
cd frontend && npm install && npm run dev   # landing http://localhost:5173 · live demo /demo
```

Ports: Ledger gRPC is sv=4901, app-provider=3901, app-user=2901. JSON API is 4975/3975/2975. Postgres is at localhost:5432 with user `cnadmin` and password `supersafe`. The PQS DBs are `pqs-app-provider` and `pqs-app-user`. Scripts exchange state through `/tmp`: `ap.jwt`/`au.jwt` (unsafe HS256 tokens from `mint-localnet-token.py`), `seed-input.json` (party IDs) and `participants*.json`. `frontend/public/demo-config.json` is generated and gitignored. Run `scripts/gen-frontend-config.sh` again after each re-seed.

## Architecture

Daml modules live in `daml/LedgerCall/`. They form a pipeline:

- **Util**: exact pro-rata split in integer cents using largest remainder. All money arithmetic goes through `centsOf`/`dollarsOf` so totals sum exactly.
- **Fund**: `Fund` and `Commitment`. A `Commitment` is per LP and is the unit of privacy.
- **Call**: `CapitalCall` (the GP-private aggregate) fans out into one `CallObligation` per LP.
- **Allocation**: `CallAllocationRequest` implements the CIP-0056 `AllocationRequest` with **one request per LP, one leg each**. Senders are observers of a request, so a multi-leg request would leak every LP's amount to every other LP. Do not merge them.
- **Settlement**: `CallSettlement` is co-signed by the GP and all allocating LPs, so the GP holds the authority to `Allocation_ExecuteTransfer` every leg in one transaction. Atomicity comes from Canton's confirmation protocol, not from application code.
- **Cascade**: `computeRecut` is a pure waterfall: pro-rata, capped by uncalled capital, iterating with a fuel guard, and returning an exact `unfunded` residual (invariant: `shortfall == sum extras + unfunded`). `ShortfallProposal` carries `ApproveRecut`/`DeclineRecut`. It is visible only to the GP and admin because it names the defaulter. `RecutObligation` is per LP.
- **TestRegistry**: a minimal but real `Holding`/`Allocation` implementation (`LedgerCallCash`), used for tests and the multi-LP LocalNet demo.
- **LocalNetSeed**: Daml Script entry points that the scripts call (`noop` for DAR upload, `seedFromInput`, `cleanup`, `allocateAll`, `settleAll`, `releaseAll`).

**Key invariant:** venue code (`Allocation`, `Settlement`) imports only the `Splice.Api.Token.*` interfaces and has zero registry-specific imports. That is what lets it settle assets it never issued, such as Canton Coin. Never import `TestRegistry` or any concrete registry into venue modules.

The token-standard interface DARs in `.lib/` are committed on purpose so the project builds offline. To regenerate them, run `scripts/build-token-standard.sh`, which pins splice `9c7ffd2`.

The frontend (`frontend/`, React and Vite) has two lazily loaded pages, chosen by path in `src/main.jsx`: the landing page (`Landing.jsx` + `landing.css`) at `/`, and the live demo (`App.jsx`) at `/demo`. The demo is a two-pane viewer over the JSON Ledger API v2 (`src/ledger.js`). Each pane queries the active contracts filtered to one party. Vite proxies `/ap` to 3975 (app-provider) and `/au` to 2975 (app-user, which hosts the isolated LP). Buttons submit real Daml choices. Every displayed status (Locked / Paid / Released, the shared transaction stamp, the re-split decision) is derived in `src/derive.js` from **that pane's party's own data only**: its active contracts plus its own `/v2/updates` history (`historyFor`, ledger-effects shape, starting at the current call's creation offset). Never feed one party's data into another party's pane, because that would fake the privacy boundary the demo exists to show. Styling: every value lives in `src/tokens.css` (no raw colours elsewhere), and primitives live in `src/ui.jsx`.

## Gotchas

- Since Canton 3.5.1, **Ledger API queries must use the package-name form** `#ledgercall:LedgerCall.Call:CallObligation`. A hex package ID fails validation. PQS SQL `active('...')` uses the same form **without** the leading `#`.
- Canton refuses to vet a rebuilt `ledgercall 1.0.0` that has a different hash from the one already vetted. `localnet-up.sh` tolerates this and keeps running against the old package. To deploy changed Daml, either bump `version` in `daml.yaml` or wipe the LocalNet volumes (`docker compose ... down -v` in the quickstart) and rerun `setup-localnet.sh`.
- `splice-onboarding` never reports healthy on a recovered volume. `localnet-up.sh` deliberately skips it and starts the PQS containers directly.
- On a **fresh** `setup-localnet.sh`, the same bug stops onboarding before it creates the `*-pqs-user` users, and `seed-localnet.sh` needs those users. Its health check runs `find /canton/dars` under `set -e`, and that directory only exists when the sample app is mounted. Fix: `docker exec splice-onboarding sh -c 'mkdir -p /canton/dars; rm -f /tmp/error'`. It becomes healthy within seconds.
- The LocalNet containers log through Docker's `json-file` driver **with no size cap**, into `/var/lib/docker` on the root partition. A few hours of running filled this machine's disk (`docker system df` doesn't show logs). Stop LocalNet when you aren't using it, and check `df -h /`.
- Deadlines don't fire by themselves. After `allocateBefore`, a release is an explicit transaction (`Allocation_Withdraw`). Don't write code or docs that claim auto-unlock.
