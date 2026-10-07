# Honest gaps — the limitations, volunteered

Disclosing a real limitation is worth more than an overclaim that survives to Q&A. These
are ours, stated before a judge finds them.

## 1. The privacy leak we do not hide (shape-revealing projection)

LP #4 knows the call total, its own share, and its own recut. From its recut and its own
commitment it can **estimate the size of the shortfall** — and therefore roughly how much
was defaulted.

**It cannot learn WHO defaulted, or HOW MANY did.** That is the real, defensible claim.
This is Canton's own documented *"shape-revealing projection"* — informee sets, sizes,
required confirmers and timing are visible at view granularity. We don't pretend
otherwise. **[V]** (`docs.canton.network/overview/learn/privacy-model`)

## 2. Settling an asset we didn't issue — now DEMONSTRATED against real Canton Coin

RISK #1 (spec §11.6) is resolved. The settlement leg is written against the
`AllocationFactory` / `Allocation` interfaces, so the LPs' cash can sit in **any**
CIP-0056 registry. We proved this literally: **100 units of real Canton Coin — issued by
the DSO, locked via Canton Coin's own registry `AllocationFactory`, and settled by our
venue's `Allocation_ExecuteTransfer`** — moved end-to-end on the live LocalNet. Our venue
never touches Canton Coin's Daml; it only speaks the standard interfaces. Evidence:
[docs/evidence/canton-coin-proof.md](./docs/evidence/canton-coin-proof.md).

**The remaining honest nuance:** the *multi-LP* capital-call demo funds its LPs from our
own token-standard registry (`LedgerCallCash`) for convenience — tapping/funding real
Canton Coin to 30 fresh LP parties is fiddly, whereas the **settlement mechanism is
identical** and is proven against real Canton Coin above. So: "we settle assets we didn't
issue" is demonstrated with the real asset; the many-LP scenario uses our own asset only
to make funding many parties easy. We don't claim a live *second* external registry
(e.g. CBTC) — that needs a second network, and **BitSafe's maxim is "honest scope wins."**

## 3. The unit-test registry is ours; the venue is not

`LedgerCall/TestRegistry.daml` is a **minimal but real** implementation of the standard's
`Holding` and `Allocation` interfaces — it genuinely locks value and executes transfers.
It exists **only** to unit-test settlement offline (spec §11.6, fallback #2). It is not a
fake token in the sense that killed past projects: it implements the actual interfaces.

The claim that survives even though we supply the test asset: **our venue code
(`LedgerCall.Allocation`, `LedgerCall.Settlement`) has zero registry-specific imports.**
The venue is what proves the "assets we didn't issue" property, and on LocalNet the same
venue settles Canton Coin instead — no venue change. (This is exactly the disclosure
spec §11.6 requires when using fallback #2.)

## 4. Feeder funds — privacy terminates at the nominee

A feeder fund (iCapital-style) aggregates thousands of investors behind **one** LP line.
A feeder **is itself an LP** on the register — it gets the same call notice and the same
obligation, and allocates like any other LP. **What we do NOT claim** is per-*beneficial-
owner* privacy: behind a feeder, privacy terminates at the feeder. **Every privacy claim
in this project is scoped to LPs on the register.** **[V, SIX SDX / HKMA precedents]**

## 5. Deadlines don't fire themselves — there is no cron on a ledger

After `allocateBefore` passes, the allocation becomes releasable and **nothing can
prevent its release** — the holding can no longer be committed to this settlement. But a
release is a transaction like any other; **nothing fires by itself.** We never say "it
automatically unlocks itself." The point is that nothing can *stop* the release and no one
can settle around it. `testOneShortNothingMoves` releases the locks explicitly after
`passTime`, which is exactly this mechanic. **[V, CIP-0056]**

## 6. What is explicitly out of scope
Interest accrual, forced sale, secondary transfer of LP interests, the distribution
waterfall (money *out* — that's Alluvren's project), multi-currency/FX, subscription
lines, MainNet deployment. Cut deliberately to finish the smaller thing well.
