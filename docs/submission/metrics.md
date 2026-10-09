# Metrics

> Honest status: this is a hackathon build. We have **no primary user interviews and no external traction** yet. The validation we do have is (a) the working system, measured on a live network, and (b) secondary market evidence. Those are reported truthfully below; the user-facing sections are marked as not-yet-done rather than filled with invented numbers.

---

## 1. North Star metric

- **Metric:** Value of capital calls **settled atomically with no wires** through LEDGERCALL per period (sum of amounts moved by `Allocation_ExecuteTransfer` in committed settlements), with a hard companion constraint of **zero partially-funded calls**.
- **Why this one:** It only grows if GPs and administrators actually route real calls through the app instead of bank wires, and the zero-partial-funding constraint is the specific failure the market complains about. A number that can only move through real adoption is the right North Star.
- **How we measure it:** Sum settled allocation amounts from the ledger (the settlement transactions are on-ledger and queryable via PQS). Pre-launch, the honest proxy is "can a real user complete the full call to default to settle flow end to end on a live network," which is demonstrated below.

---

## 2. What we needed to validate

| Assumption | Why it matters | Status |
| --- | --- | --- |
| Users have this problem (manual calls, unwindable partial funding, hand-built default recut) | If the pain is not real, nothing else matters | ✅ Confirmed by **secondary** evidence (legal practitioners, incumbents, prior-art sweep). ⏳ Not yet confirmed by primary interviews. |
| The core mechanic works technically (no-wires lock, atomic settle, per-LP privacy, default recut) | The product is only credible if it actually runs | ✅ Confirmed on a live LocalNet (see §5) and in an 8/8 test suite |
| They would use our solution | Problem awareness does not equal adoption | ⏳ Untested (no interviews yet) |
| They would pay or switch | Determines whether this is a business | ⏳ Untested |
| LPs will hold tokenized cash on Canton for the "no wires" leg | Adoption dependency outside our control | ⏳ Untested |

---

## 3. Conversations

No primary user interviews have been conducted yet.

| # | Who (role, company type) | Date | Key takeaway |
| --- | --- | --- | --- |
| 1 | _pending_ | | |
| 2 | _pending_ | | |
| 3 | _pending_ | | |

**Secondary evidence we are relying on until then:**
> *"The general partner should retain discretion in how to apply remedies"* — Morgan Lewis (private-funds practice), confirming the default remedy is real and must stay a human decision.
>
> *"The GP typically has discretion whether to declare a default and which remedies to apply"* — Cooley.

**Interview plan (next, see §6):** 5 to 8 conversations with fund administrators (Gen II / Alter Domus / Apex / Citco / Juniper Square type), GP finance/ops at mid-market private-credit funds, and Canton/Digital Asset ecosystem contacts. Three questions: how do you run a call and reconcile funding today; what actually happens when an LP defaults; would settling against tokenized cash with per-LP privacy change your process.

---

## 4. Tests and results

- **What we tried:** Technical validation only. No landing page, waitlist, demo share, survey, or pilot has been run.
- **What happened:** The system passes **8/8 Daml Script tests** and the full flow runs end to end on a live two-participant LocalNet, including a settlement of **real Canton Coin** (an asset the app did not issue). Details in §5 and in `docs/evidence/`.
- **What we changed because of it:** Engineering course-corrections driven by what the ledger actually enforced, not by user tests. Two recorded in JOURNAL.md: (1) one `AllocationRequest` **per LP** rather than one shared request, because senders are observers and a shared request would leak every LP's amount to every other LP; (2) driving interface choices over the **JSON Ledger API by package-name** rather than `dpm script`, after the deployed package id diverged from the rebuilt one.

---

## 5. Product and on-ledger metrics

All "Now" values are on a live LocalNet (two Canton participants, each with its own PQS). Production networks (DevNet/MainNet) are deliberately out of scope for this build.

| Metric | How we measure it | Now | Target by submission |
| --- | --- | --- | --- |
| Users who tried the demo | External people who ran the live UI | 0 external (builder only) | Record the walkthrough; share the live `/demo` with ≥3 people |
| Users who completed the core flow | call → allocate → settle/release → recut | Demonstrated end to end by the builder + covered by 8/8 tests | Unchanged (the flow is complete) |
| Transactions on DevNet / MainNet | On-ledger tx count on a production network | 0 (ran on LocalNet by design) | 0 for this build; DevNet is a post-hackathon target (§6) |
| Active parties | Distinct parties in the seeded demo | 9 across 2 participants (GP, admin, registry, 5 LPs, 1 isolated LP) | Unchanged |

**Verifiable results on the live network:**
- **8/8 Daml Script tests pass**, including `testLpCannotSeeOtherLp` (per-LP blindness), `testHappyPath` (14 transactions, atomic settle), and `testOneShortNothingMoves` (15 transactions, abort and release).
- **PQS privacy proof, re-verified live:** the same SQL against two participants' databases returns **6 obligations for the GP's node and 1 for the isolated LP's node**; the proposal naming the defaulter is **1 vs 0**.
- **Atomic settlement, live:** 5 LPs allocate, the GP settles every leg in **one transaction**, the fund receives **$2,500,000**; in the failure path the deadline releases every lock and the fund receives **$0** (`docs/evidence/settlement-proof.md`).
- **Real Canton Coin settled through our venue:** 100 units of real Canton Coin, locked via Canton Coin's own `AllocationFactory` and moved by our venue's `Allocation_ExecuteTransfer` (sender 62,830 to 62,730 CC; receiver +100) (`docs/evidence/canton-coin-proof.md`).
- **Market-gap validation:** a lexical sweep of all 30 Canton Season-3 gallery pitches, GitHub, and the forum returns **0** occurrences of `capital call`, `dilut*`, `waterfall`, `uncalled`, or `drawdown` (`PRIOR-ART.md`).

---

## 6. Success criteria after the hackathon

| Metric | Target in 90 days |
| --- | --- |
| Primary user interviews (GPs, fund administrators) | 5 to 8 completed, with notes |
| Design partner | 1 fund administrator or GP willing to review the flow against a real call |
| Production deployment | Deployed and demonstrated on Canton DevNet/TestNet |
| Real tokenized-cash pilot | 1 call settled against an external CIP-0056 cash asset with more than one real counterparty |
| Validated willingness to switch | Written confirmation from ≥1 target that this removes a real cost |

---

## 7. What we still don't know

- **Willingness to pay, and who the buyer is** (the fund administrator as a platform buyer vs the GP directly). Answer via the §6 interviews.
- **Whether LPs will tokenize cash on Canton** for the no-wires leg. Answer by finding a design partner whose LPs already hold tokenized cash or MMFs.
- **Regulatory and legal sign-off path** for using this as a settlement rail. Answer with counsel and an administrator design partner.
- **Integration effort** with existing fund-admin systems of record (Juniper Square, eFront, Investran). Answer during a pilot.

---

## Checklist

- [x] One North Star metric with a clear definition
- [ ] At least 3 conversations with potential users — **not done; honestly reported as pending**
- [x] Assumptions are marked confirmed, rejected or still testing
- [x] At least one test with a number attached (8/8 tests; 6-vs-1 privacy; $2.5M atomic; 100 CC)
- [x] Current values and targets are filled in
- [x] You show what changed because of what you learned (engineering course-corrections in §4)
