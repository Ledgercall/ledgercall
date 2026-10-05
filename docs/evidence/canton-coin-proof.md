# Settling REAL Canton Coin through the venue — RISK #1, resolved

The build spec's RISK #1 (§11.6): *"does Canton Coin support the allocation API on
LocalNet?"* — because the whole Canton Fit claim rests on settling **assets we didn't
issue**. Answer, demonstrated end-to-end on the live LocalNet: **yes.**

100 units of **real Canton Coin** — issued by the DSO, locked via **Canton Coin's own
registry `AllocationFactory`**, and settled by **our venue's `Allocation_ExecuteTransfer`**
(the exact same CIP-0056 choice we use everywhere) — moved from one party to another. Our
venue never touches Canton Coin's Daml; it only speaks the standard interfaces.

## The flow (all against the live ledger)

1. **Canton Coin's registry advertises the allocation API.** The SV scan API
   (`/registry/metadata/v1/instruments`) returns, for instrument `Amulet` / "Canton Coin":
   `supportedApis` including `splice-api-token-allocation-instruction-v1` and
   `splice-api-token-allocation-v1`. Registry admin = the DSO party.
2. **Get the factory + context from the registry** (`POST /registry/allocation-instruction/v1/allocation-factory`):
   returns the `AllocationFactory` (which *is* the on-ledger `AmuletRules` contract), a
   choice context, and **4 disclosed contracts** (AmuletRules, the open mining round, …).
3. **Lock real CC** — `AllocationFactory_Allocate`, passing those disclosures: creates a
   `LockedAmulet` + an `AmuletAllocation` (which implements the standard `Allocation`).
4. **Settle it with our venue's choice** — get the execute-transfer context
   (`POST /registry/allocations/v1/{id}/choice-contexts/execute-transfer`) and exercise
   `Allocation_ExecuteTransfer`. The CC moves.

## The transcript

```text
>> instrument 'Canton Coin' advertises allocation API: True
   sender CC before   = 62,830
   receiver CC before = 100
>> 1. get Canton Coin's allocation factory + context from its registry
   factory (AmuletRules) = 00cd4401608d7f57535b945f…, disclosures = 4
>> 2. AllocationFactory_Allocate — lock 100 REAL Canton Coin
   locked — AmuletAllocation 007616b8bd2f567f12aac843… created
>> 3. Allocation_ExecuteTransfer — settle the real CC via our venue's choice
   sender CC after    = 62,730      (−100)
   receiver CC after  = 200         (+100)
```

Underlying ledger proof: before the allocate, the sender's single `Amulet` held
62,360 CC; after, it held a `LockedAmulet` for 100 and an unlocked `Amulet` reduced by
exactly 100; after the settle, the receiver holds a new `Amulet` of 100.

## Reproduce it

```bash
scripts/scan-proxy.sh              # publish the SV scan (registry) API to localhost:5012
python3 scripts/demo-canton-coin.py
```

## Why this matters

This is the literal version of the Canton Fit claim (spec §7.5): our venue settles a leg
denominated in an asset **it never issued and whose Daml it never saw** — Canton Coin —
purely through the CIP-0056 interfaces, using Canton Coin's own registry to mint the
allocation. The multi-LP capital-call flow uses our own registry for convenience of
funding many LPs, but the settlement mechanism is identical and is proven here against the
real thing.
