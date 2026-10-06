# LEDGERCALL

**What happens when an investor doesn't pay a capital call?** Today: the fund has
some of the money, a deal to close, and no way to unwind it. LEDGERCALL is the first
Canton application to handle the **LP default remedy — the dilution waterfall** — the
one part of the capital-call workflow nobody in the Canton ecosystem has built.

It runs a private-fund capital call where **forty LPs never wire money** — each locks
it in their own token registry — and the whole call **settles atomically or nobody
moves a cent**. When an LP defaults, the administrator computes the re-allocation and
the **GP decides** whether to run it (we automate the arithmetic, not the judgement),
and **each LP sees only its own number** — proven, not asserted.

> Built for HackCanton Season 3, Track 3 (Investment Infrastructure). The call is the
> setup; **the default is the story.**

---

## Why this belongs on Canton (not "any chain")

The LPs' cash sits in registries built by teams this app has never integrated with.
Plain smart-contract code can't touch it. The **Canton Network Token Standard
(CIP-0056) allocation mechanism** lets the fund settle a 30-LP call in **one atomic
transaction against assets whose Daml code it has never seen** — and if one LP
under-allocates, the deadline passes and nobody's money moved.

Our venue code (`LedgerCall.Allocation`, `LedgerCall.Settlement`) imports **only the
standard interfaces — zero registry-specific code.** That is the property that makes
the claim true. See [WHY-CANTON.md](./WHY-CANTON.md).

And the privacy isn't a feature we built — it's the ledger model. LP #4 cannot see
LP #17's commitment, obligation, or the fact that #17 defaulted. We prove it two ways:
a machine-checked test, and (Phase B) the **same SQL run against two participants' PQS
databases returning different row counts.**

---

## Status — what's real today

| Capability | State | Evidence |
| --- | --- | --- |
| Per-LP private commitments & obligations | ✅ real | `testLpCannotSeeOtherLp` |
| Capital call → per-LP obligation fan-out | ✅ real | `LedgerCall.Call` |
| CIP-0056 `AllocationRequest` (one leg per LP) | ✅ real | `LedgerCall.Allocation`, built against splice DARs |
| LP allocates → atomic multi-leg settlement | ✅ real | `testHappyPath` (14 txns) |
| Deadline release, one LP short → nothing moves | ✅ real | `testOneShortNothingMoves` (15 txns) |
| Dilution waterfall (capped, iterating, honest residual) | ✅ real | `testRecutIsCapped`, `testRecutCanUnderfund` |
| GP discretion (approve / decline recut) | ✅ real | `testGpCanDecline`, `testApproveRecutIsPrivate` |
| PQS blindness proof across 2 participants | ✅ real | [docs/evidence/privacy-proof.md](./docs/evidence/privacy-proof.md) — GP's DB sees all, LP's DB sees 1 |
| Guided 2-pane UI, live, fully interactive | ✅ real | [frontend/](./frontend) · [screenshot](./docs/evidence/demo-start.png) · real buttons: Allocate · Settle (atomic) · Release · Approve/Decline |
| LP "no wires" allocation, live on LocalNet | ✅ real | the **Allocate** button locks the LP's own holding into a real token-standard `Allocation` ([locked state](./docs/evidence/allocate-locked.png)) |
| GP Approve/Decline recut, live on LocalNet | ✅ real | real `ApproveRecut`/`DeclineRecut`; each LP's recut appears, visible only to it |

| Atomic multi-leg settlement, live on LocalNet | ✅ real | GP settles all legs in ONE `submitMulti` tx → fund receives $2.5M ([settlement-proof.md](./docs/evidence/settlement-proof.md)) |
| Deadline-release "nothing moves", live on LocalNet | ✅ real | allocate → release → every LP whole again, fund got $0 (same proof) |
| Settling **real Canton Coin** (an asset we didn't issue) | ✅ real | 100 real CC locked via Canton Coin's own `AllocationFactory`, settled by our venue's `Allocation_ExecuteTransfer` ([canton-coin-proof.md](./docs/evidence/canton-coin-proof.md)) |

**Honest status:** the whole flow is live on LocalNet — call → per-LP obligations →
per-LP blindness (SQL + UI) → each LP locks funds in its own registry (no wires) →
**either** the GP settles every leg atomically (money moves in one transaction) **or** the
deadline releases every lock and nothing moved → the GP's discretionary dilution recut
with per-LP privacy. And the Canton Fit claim is **literal**: we settled **real Canton
Coin** — an asset we never issued — through our venue, using Canton Coin's own registry
(spec RISK #1, resolved). The multi-LP demo funds LPs from our own registry only for
convenience (funding many parties with real CC is fiddly); the settlement mechanism is
identical and proven against the real asset. See [HONEST-GAPS.md](./HONEST-GAPS.md) and
[JOURNAL.md](./JOURNAL.md).

**8/8 Daml Script tests pass** against a real in-memory Canton ledger and the real
token-standard interfaces. This is the demo, as tests.

---

## ⚠️ Canton gotcha pinned here (spec §6.3)

Since **Canton 3.5.1, ledger queries must use the package-NAME form**
`#ledgercall:LedgerCall.Call:CallObligation` — a hex package id **will fail
validation**. Every PQS/ledger query in this repo uses the `#package-name:Module:Template`
form. Don't copy the older hex-id examples from blogs or StackOverflow.

---

## Build & run (a stranger should be able to do this)

### Prerequisites
- **dpm** (the Daml SDK manager) — install once:
  ```bash
  curl https://get.digitalasset.com/install/install.sh | sh
  export PATH="$HOME/.dpm/bin:$PATH"     # add to your shell profile
  ```
- **JDK 17+** and **Node 18+** (already required by the Daml SDK).

### Build and test
```bash
git clone <this repo> && cd ledgercall
dpm build        # compiles daml/ against the token-standard DARs in .lib/
dpm test         # runs all 8 Daml Script tests
```

Expected (abridged):
```
testProRataSumsExactly:      ok
testRecutIsCapped:           ok
testRecutCanUnderfund:       ok
testLpCannotSeeOtherLp:      ok, 8 active contracts, 8 transactions
testApproveRecutIsPrivate:   ok
testGpCanDecline:            ok
testHappyPath:               ok, 12 active contracts, 14 transactions
testOneShortNothingMoves:    ok, 10 active contracts, 15 transactions
```

The four `splice-api-token-*` DARs under `.lib/` are the real CIP-0056 interfaces,
committed so the project builds offline. Regenerate them from source with
`scripts/build-token-standard.sh` (pins splice `9c7ffd2`).

---

## Repository layout

```
daml/LedgerCall/
  Util.daml          exact pro-rata split (integer cents, largest-remainder)
  Fund.daml          Fund, Commitment            (the per-LP privacy atom)
  Call.daml          CapitalCall, CallObligation (GP-private aggregate + per-LP fan-out)
  Allocation.daml    CallAllocationRequest       (implements CIP-0056 AllocationRequest, ONE leg/LP)
  Settlement.daml    CallSettlement              (atomic multi-leg SettleAll)
  Cascade.daml       computeRecut + ShortfallProposal/RecutObligation (GP discretion)
  Test.daml          privacy + cascade tests
  TestRegistry.daml  minimal real Holding/Allocation registry (test only — see HONEST-GAPS)
  TestSettlement.daml happy-path + nothing-moves tests
.lib/                the real token-standard interface DARs
scripts/             build-token-standard.sh, (Phase B: setup-localnet.sh, privacy-proof.sh)
docs/evidence/       (Phase B: SQL transcripts, ledger offsets)
```

## Design decisions that matter
- **One `AllocationRequest` per LP, one leg each.** A single request carrying all N
  legs would make every LP an observer of every other LP's amount — senders are
  observers of the request. That would destroy the product. (spec §8.3)
- **We do NOT automate the default remedy.** Morgan Lewis and Cooley both say GPs must
  retain discretion. The deadline releases allocations automatically; the *cascade* is
  proposed to the GP, who decides. (spec §5.5)
- **Atomicity is inherited, not coded.** Every leg is one Daml transaction; Canton
  requires confirmation from every signatory's participant, so there is no state where
  half of it committed. (spec §6.7)

See [WHY-CANTON.md](./WHY-CANTON.md) · [PRIOR-ART.md](./PRIOR-ART.md) ·
[HONEST-GAPS.md](./HONEST-GAPS.md) · [JOURNAL.md](./JOURNAL.md)
