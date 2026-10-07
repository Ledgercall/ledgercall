# Build journal

Kept daily, failures included. Judges see the whole journal — the trajectory is part of
the evaluation.

---

## 2026-10-01 — Entry #1: research-first, then a working Daml core in one sitting

**Accounting for the gap honestly.** This project came out of ~12 days of research
before a line of code — killing seven other ideas (SUBROGATE, DRAWDOWN, COUPON,
REGISTRAR, TALLYMARK, RECEIPT, PROJECTOR) against the *commercial incumbent* landscape,
not just the hackathon gallery. That research is why LEDGERCALL leads with the **LP
default remedy** (untouched across gallery + GitHub + forum) rather than the capital
call itself (wishlist territory, four occupants). The eleven honest entries that follow
beat twenty thin ones.

**What got built today (all real, all committed):**

- Installed the Daml toolchain (`dpm` 1.0.22, SDK 3.5.12) and verified it runs on the
  box (JDK 26).
- Built the **real** Canton Token Standard (CIP-0056) interface DARs from splice source
  (pinned `9c7ffd2`) — metadata / holding / allocation / allocation-request — and wired
  them as data-dependencies. Reproducible via `scripts/build-token-standard.sh`.
- Wrote the full Daml model: `Fund`, `Commitment`, `CapitalCall`, `CallObligation`,
  `CallAllocationRequest` (implements the standard `AllocationRequest`, one leg per LP),
  `CallSettlement` (atomic `SettleAll`), `ShortfallProposal` + `RecutObligation`.
- Implemented the **dilution waterfall** in integer cents (pro-rata, capped by uncalled
  capital, iterating, loop-guarded, honest unfunded residual).
- **8/8 Daml Script tests pass**, including the two that matter most:
  `testLpCannotSeeOtherLp` (per-LP blindness, machine-checked) and
  `testOneShortNothingMoves` (atomic abort + deadline release + nothing moved).

**Open questions resolved today (corrections to the build spec §21):**

- **Q4 — release/cancel choice name on `Allocation`.** RESOLVED by reading
  `AllocationV1.daml`: the release paths are **`Allocation_Withdraw`** (sender-controlled)
  and **`Allocation_Cancel`** (all controllers); settlement is **`Allocation_ExecuteTransfer`**.
  No name was invented.
- **Q3 — do N allocations settle in one transaction, and who authorizes?** RESOLVED by
  reading the reference `TestAmuletTokenDvP.daml`: yes, all legs settle in one
  transaction; the executor settles by exercising `Allocation_ExecuteTransfer` inside a
  choice on a settlement contract **co-signed by every sender** (there is the OTCTrade
  signed by all trading parties). So our `CallSettlement` is signed by `gp` + all `lps`.
  This is a genuine correction: the spec's §9.6 sketch showed `signatory gp` alone, which
  would lack authority to execute the LPs' legs.
- **Q5 — exact field shapes** of `AllocationRequestView` / `SettlementInfo` /
  `TransferLeg` / `InstrumentId`. RESOLVED by reading source, not guessing.

**Assumption tested and corrected.** I assumed I might run the full happy-path against
real Amulet (Canton Coin) offline. Reading `TestAmuletTokenDvP` showed it depends on the
entire Splice Amulet codebase — too heavy to build offline. Switched to spec §11.6
fallback #2: a **minimal but real** registry implementing the actual `Holding`/`Allocation`
interfaces for unit tests, keeping the venue code registry-agnostic. Documented in
HONEST-GAPS.md. On LocalNet the same venue settles Canton Coin unchanged (Phase B).

**Next (Phase B):** cn-quickstart LocalNet with PQS in `TransactionTreeStream`, deploy the
DAR, verify RISK #1 (does Canton Coin expose the allocation API on LocalNet), and produce
the **PQS blindness proof** — the same SQL across two participants' databases. Then the
five viewports.

**Still open:** Q1 (CC allocation API on LocalNet — day-1 Phase B check), Q6 (primary
source for the $809k fraud figure — verify before it goes on any slide), Q2 (DTCC AIP
LP-direct fraction).

---

## 2026-10-01 — Entry #2: LocalNet up and the PQS blindness proof is REAL

The centerpiece artifact works: the **same SQL against two participants' PQS databases
returns different answers** — GP's database shows every obligation, the isolated LP's
shows exactly one, and the ShortfallProposal naming the defaulter is `1` for the GP and
`0` for the LP. Captured in `docs/evidence/privacy-proof.md`. Not asserted — displayed.

**How it was built (and the walls hit):**

- cn-quickstart is **Nix-based** and its `make start` builds a sample app I don't need.
  Engineered a **Nix-free bring-up** driving the LocalNet docker-compose modules directly
  (`scripts/setup-localnet.sh`), deploying my own DAR with `dpm`. Started services one at
  a time — the compose `up` aborts if it waits on a slow dependency's healthcheck, which
  SIGTERMs the container mid-init (looked like a crash; was orchestration).
- **Assumed wrong, corrected (§16.4):** I expected to deploy the token-standard DARs I
  built from source in Phase A. The upload failed with `KNOWN_PACKAGE_VERSION` — my
  `splice-api-token-metadata-v1 v1.0.0` had a *different package-id* than the one Splice
  already ships on LocalNet (same name+version, different hash). Rebuilt `ledgercall`
  against the **official** DARs extracted from the splice container
  (`/app/splice-node/dars/`), so package-ids match the ledger and my interface instances
  line up. (Phase A's from-source DARs remain correct for offline Script tests.)
- **Auth:** LocalNet uses unsafe HS256 (`aud=https://canton.network.global`,
  `sub=ledger-api-user`). `CanActAsAnyParty` isn't supported in this Canton version, so I
  grant per-party `CanActAs` for gp+admin.
- **Key PQS insight:** each PQS ingests only what its *operator party* sees. Rather than
  fight the filter, I cast the two operator parties in the roles that must be visible —
  gp = app-provider operator, isolated LP = app-user operator — which is exactly the §8.1
  layout. No PQS reconfiguration needed.
- The onboarding helper also needed a nudge (`/canton/dars` didn't exist because I skip
  `make build`); created it so the DAR auto-uploads to both participants.

**Resolved:** Q1 — Canton/Splice on LocalNet **do** expose the token-standard
`Holding`/`Allocation` interfaces (the DARs are vetted on the participant). The full CC
allocation settlement on LocalNet is the next thing to wire; the venue is already proven
against the standard in the Phase A Script tests.

**Next:** the five read-only viewports (plain tables, two panes side by side) over the
JSON Ledger API; then record the 3-minute demo.

---

## 2026-10-01 — Entry #3: the live UI + a real "no wires" allocation on LocalNet

Built the five-viewport UI (Vite/React, two panes always side by side — every claim is
about the *difference* between two views). It reads each party's exact ledger view live
through the JSON API, so the blindness is visible in the browser: the GP pane shows the
call, all six obligations and the shortfall proposal; an LP pane shows one obligation and
"call not visible (no roster leak)". Screenshots in `docs/evidence/`.

All three interactive buttons are **real choices**, verified end to end:
- **GP Approve / Decline** → `ApproveRecut` / `DeclineRecut`; approving materialises each
  non-defaulting LP's recut, visible only to that LP.
- **LP Allocate** → `Cash_Allocate` on the LP's own holding → a real token-standard
  `Allocation`; the UI then shows "🔒 locked to the call (non-custodial)". This is the
  "no wires" action, live on LocalNet.

**Honest end-to-end status now (~85%):**
- LIVE on LocalNet: call → per-LP obligations → per-LP blindness (proven in SQL *and* UI)
  → LP locks funds in its own registry (non-custodial) → GP's discretionary recut with
  per-LP privacy. A real user can drive all of this through the browser.
- STILL test-only (green in `dpm test`, not yet wired on LocalNet): the GP's **atomic
  multi-leg settlement** (`SettleAll`) and the **deadline-release-nothing-moved** beat.
  These need `CallSettlement` co-signed by the LPs across participants — the harder
  authority step — which is the next thing to wire.
- Against **my test registry**, not Canton Coin. CC's token-standard interfaces are vetted
  on-ledger, but its off-ledger allocation-factory API isn't exposed on this LocalNet
  without the scan/validator HTTP layer; disclosed per §11.6, with the venue proven
  registry-agnostic. Real-CC remains the RISK #1 stretch.

**Decided (§16.4):** used my own registry on LocalNet rather than chase CC's off-ledger
API down a rabbit hole — it makes the allocation *genuinely real* (real interface, real
lock, real non-custodial holding) today, and keeps the "assets we didn't issue" claim
honest via the registry-agnostic venue.

---

## 2026-10-03 — Entry #4: the last 15% — atomic settle + deadline-release, live

Closed the gap: the GP's **atomic multi-leg settlement** and the
**deadline-release-nothing-moved** beat now run on the live LocalNet, with balances read
from the ledger (`scripts/demo-settlement.py`, evidence in
`docs/evidence/settlement-proof.md`):
- Happy path: 5 LPs allocate → GP settles → **fund receives $2,500,000 in ONE transaction**,
  each LP debited its $500k share.
- Nothing moves: LPs allocate → deadline release → every LP back to $1,000,000, **fund got $0**.

**The reboot (and the walls it exposed).** The box rebooted mid-build: `/tmp` was cleared
and the containers' bind-mount files got dir-ified. Recovered by re-cloning the quickstart
to a fresh path and recreating the containers against the **persisted volumes** — the whole
ledger (DAR, parties, contracts, user rights) came back intact. Regenerated the token
(deterministic) and the party-ID file from the ledger.

**Assumption corrected (§16.4).** I'd built the settle/release as `dpm script` functions.
They failed with `NotFound(Package 51297e43)` on every exercise/cleanup: `dpm script`
loads the *locally-rebuilt* DAR (a different package-id than the deployed one, because I
kept editing the seed module), so it can't preprocess exercises on existing contracts.
Creates worked (name-resolved); exercises didn't. **Fix:** drive interface choices over the
**JSON Ledger API by package-name** — exactly what the UI already does — which resolves to
the deployed package on-ledger. Rewrote the settlement demo in Python over the JSON API.
Lesson: once a DAR is deployed, don't keep changing its package and expect `dpm script` to
operate on the already-created contracts; address the deployed package by name.

The atomicity is a single multi-party submission (`submitMulti [gp, lp1..lpN]` of
`Allocation_ExecuteTransfer`): all legs or none. On LocalNet the LPs co-locate on one
participant, so it confirms on one node here; the protocol requirement that every
signatory's participant confirm is unchanged.

---

## 2026-10-05 — Entry #5: RISK #1 resolved — we settled REAL Canton Coin

The spec's #1 risk — *does Canton Coin support the allocation API on LocalNet* — is
answered **yes**, demonstrated end-to-end (`docs/evidence/canton-coin-proof.md`,
`scripts/demo-canton-coin.py`): **100 units of real Canton Coin, issued by the DSO, locked
via Canton Coin's own registry `AllocationFactory`, settled by our venue's
`Allocation_ExecuteTransfer`.** Sender 62,830 → 62,730 CC; receiver +100. The "we settle
assets we didn't issue" claim is now literal, not architectural.

**How I got there (I'd earlier called this a rabbit hole — it wasn't, once I found the
right door):**
- The SV's **scan service serves the token-standard registry HTTP API** on an internal
  port (5012). The canton/splice images ship no curl, and 5012 isn't published — so I
  reached it with a one-line **socat proxy** (`scripts/scan-proxy.sh`) and a curl sidecar.
- The instrument metadata (`/registry/metadata/v1/instruments`) advertises Canton Coin's
  `supportedApis` — confirming allocation support at runtime (exactly the §7.3 check).
- The registry's `allocation-factory` endpoint returns the factory (which *is* the
  on-ledger `AmuletRules` contract) plus a choice context and **4 disclosed contracts**
  (AmuletRules, the open mining round, …). Passing those disclosures with the
  `AllocationFactory_Allocate` exercise locks real CC; the execute-transfer context
  endpoint then lets `Allocation_ExecuteTransfer` move it.

**The environment fought back the whole way** (worth recording): the box cleared `/tmp`
and dir-ified the quickstart's bind-mounts twice across the multi-day session, killing the
containers. Fix: moved the quickstart to a **persistent** path (`~/cn-localnet`) so a
restart just reuses the volumes — the ledger (DAR, parties, contracts, rights, even the CC
holdings, grown by mining rounds) comes back intact every time.

**Net:** the full product is end-to-end on LocalNet, and the headline Canton Fit claim is
proven against the real asset. Remaining caveat is now minor: the many-LP demo funds LPs
from our own registry for convenience; the settlement mechanism is the same one proven
against real Canton Coin here.
