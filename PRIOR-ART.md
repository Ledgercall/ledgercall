# Prior art — what exists, and why this isn't it

A lexical sweep of all 30 Season 3 gallery pitches + GitHub + the Canton forum returns
**zero** occurrences of: `capital call`, `drawdown`, `uncalled`, `dilut*`, `waterfall`,
`record date`, `merkle`, `share register`, `transfer agent`, `cap table`. **[V]**

> The LP default remedy — the dilution waterfall — is untouched across the gallery,
> GitHub, and the forum. That is the ground LEDGERCALL stands on.

## Adjacent projects in the field (know them by name)

| Project | Relationship | Why LEDGERCALL is distinct |
| --- | --- | --- |
| **Alluvren** | Structural mirror image | Redemptions — deterministic pro-rata, per-investor privacy, threshold gate — but **money OUT**. LEDGERCALL is money **in**, plus the **default remedy** Alluvren does not touch. |
| **Baseline** | Same contract shape | Subscription credit facilities — what funds use *instead of* calling capital. Private commitment → eligibility → consequence, others blind. Adjacent, not the default remedy. |
| **Lookthrough.systems** | Per-LP contracts for reporting | Has `LpPosition` per-LP with differential info rights — privacy for **reporting**, not money movement or default. |
| **Privity / Mithra** | Settlement legs / scheduled obligations | Building blocks, not the capital-call default. |

The organisers' own published wishlist names *"capital calls"* explicitly — so the call
is pre-blessed and **expected**. That is exactly why we **never pitch the call**; we
pitch **the default**, the only genuinely unclaimed ground.

## The commercial incumbent sweep (the check that killed earlier ideas)

Two earlier project ideas died because only hackathon galleries were searched, never the
boring 30-year incumbent. So, for capital calls:

- **DTCC AIP** supports purchases, redemptions, **and capital calls with integrated
  money settlement**, 2,500+ clients — but through the **intermediated wealth channel**,
  not institutional LP-direct at scale. **[V, needs the LP-direct fraction confirmed]**
- **ILPA** publishes a standardized capital-call **template** (a PDF format), not a
  settlement network.
- **iCapital / Arch / Canoe / Vestlane** aggregate feeders and automate notices; none
  settle a call atomically against assets in registries the fund never integrated with.

**What survives the sweep:** *"No incumbent settles a capital call **atomically against
assets held in registries the fund never integrated with**."* That is the allocation
claim, and it is Canton-only. We **do not** claim "no capital-call utility exists" — DTCC
AIP does. We claim the atomic-cross-registry settlement is new.

## Ideas already killed (do not re-propose)

DRAWDOWN (capital calls v1 — Northern Trust built it on blockchain in 2017, 1 client in
9 years; the default remedy is *deliberately* discretionary), COUPON (Daml Finance ships
the primitives; GS DAP + J.P. Morgan already did it), REGISTRAR (SEC: "only one
recordkeeping transfer agent"), SUBROGATE (ISO ClaimSearch — 1.8bn claims), TALLYMARK,
RECEIPT, PROJECTOR. Full autopsies live in the research corpus. LEDGERCALL is the one
that survived — because the **default remedy** is both unbuilt and Canton-shaped.
