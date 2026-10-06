# Why LEDGERCALL belongs on Canton

Canton Fit is 20% of the score, and the judges' real question is: *"why does this
belong on Canton specifically, not any chain?"* Three answers, each with evidence.

## 1. Composing with an asset we did not issue — the allocation mechanism

The core Canton Fit sentence:

> **The LPs' cash sits in registries built by teams our app has never integrated with.
> Plain Daml cannot touch it. The allocation mechanism lets us settle a 30-LP call in
> one atomic transaction against assets whose Daml code we have never seen — and if one
> LP under-allocates, the deadline passes and nobody's money moved.**

**Evidence in this repo:** `LedgerCall/Allocation.daml` and `LedgerCall/Settlement.daml`
import **only** `Splice.Api.Token.{MetadataV1, HoldingV1, AllocationV1, AllocationRequestV1}`
— the standard interfaces — and **zero registry-specific packages**. They compile and
settle against our test registry today and against Canton Coin on LocalNet unchanged.
This mirrors the reference `TradingApp.daml`, which settles assets whose Daml it has
never seen for exactly the same reason.

- `AllocationRequest` view carries `settlement : SettlementInfo` and
  `transferLegs : TextMap TransferLeg`; senders are observers, so **any** standards-
  compliant wallet renders the request. **[V]** (read from `AllocationRequestV1.daml`)
- `allocationControllers = [executor, sender, receiver]` — **non-custodial by
  construction.** Nobody ever holds the money. **[V]** (`AllocationV1.daml`)
- `SettlementInfo` carries `allocateBefore` / `settleBefore`, so allocations
  **auto-release** and funds are never trapped. **[V]**
- CIP-0112 mandates an interoperability floor of **25 legs / 50 accounts / 100
  parties**, so a 30-LP call is inside the spec, not a stretch. **[V]**

**Why it scores:** *using* the token standard is table stakes; **composing across
registries you didn't issue** is the structurally impressive thing almost nobody does.
And it is the vendor's own recommended direction — `TransferCommand` was deprecated in
Splice 0.5.16, with Digital Asset staff stating *"the preferred approach is to use the
token standard APIs."* **[V]**

## 2. All-or-nothing is the ledger, not our code

> "How do you guarantee atomicity?" — **"We don't. Canton does."**

Every leg of the settlement executes inside **one Daml transaction** (`SettleAll` in
`Settlement.daml`). Canton requires confirmation from the participant hosting **each
signatory** of every contract in a transaction, so there is **no state in which half
the call committed.** One offline LP participant aborts the whole thing. **[V]** (spec §6.7)

For a capital call this is *better* than independent retryable transfers, because a
**partially funded call is the actual failure mode the market complains about** — the
fund ends up with some of the money and a deal to close, and no way to give it back.
`testOneShortNothingMoves` proves the abort-and-release path: 2 LPs locked, 1 short,
the full settlement aborts, the deadline releases the locks, **not one cent moved.**

## 3. Per-LP privacy is sub-transaction, protocol-enforced

Canton gives **sub-transaction privacy**: a transaction is decomposed into views and a
participant sees only the views for which its parties are informees. **[V]**
(`docs.canton.network/overview/learn/privacy-model`)

LEDGERCALL leans on this directly: the aggregate `CapitalCall` is GP-private; each LP
observes only its own `CallObligation` and `RecutObligation`; the `ShortfallProposal`
that names the defaulter is visible only to GP + admin. `testLpCannotSeeOtherLp` checks
this with the same visibility rules the real ledger enforces, and Phase B shows the
**same SQL against two participants' PQS databases returning different row counts** — a
falsifiable, reproducible privacy proof that needs no one's permission.

**We state the limit honestly (Canton's own "shape-revealing projection"):** LP #4 can
back out roughly how big the shortfall was — it knows the call total and its own recut.
What it cannot learn is **who** failed, or **how many** did. See
[HONEST-GAPS.md](./HONEST-GAPS.md).

## Why now

The Canton Foundation's dev-fund proposal (approved 2026-05-13) states verbatim that
**"No open-source reference implementations"** of the token standard existed as of April
2026, and funds eight production blueprints as a **future** deliverable. **[V]**
LEDGERCALL is built in that gap.
