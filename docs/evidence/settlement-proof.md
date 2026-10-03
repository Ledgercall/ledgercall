# Atomic settlement & deadline-release — on the live LocalNet

The two beats that complete the capital-call flow, run on the live multi-participant
LocalNet (not just the in-memory test ledger). Balances are read straight from the ledger
before and after, so the money movement — and the *absence* of it — is real.

Each LP locks funds in its own registry (a real token-standard `Allocation`). The GP
then settles **every leg inside ONE transaction** by submitting together with the
allocating LPs (`submitMulti [gp, lp1..lpN]` of `Allocation_ExecuteTransfer`). Canton
requires confirmation from every signatory's participant, so either all legs settle or
the whole transaction aborts — all-or-nothing is the ledger, not our code (spec §6.7).

## A) Happy path — all allocate, GP settles atomically

```text
   0. start               | fund(gp) received = 0
                          |   LP1..LP5  unlocked = 1,000,000   locked =         0   (each)
   1. after allocate      | fund(gp) received = 0
                          |   LP1..LP5  unlocked =   500,000   locked =   500,000   (each)
   2. after atomic settle | fund(gp) received = 2,500,000
                          |   LP1..LP5  unlocked =   500,000   locked =         0   (each)
```
=> the fund received the full call (5 × $500k) in ONE transaction; every LP was debited
its share. The $2,500,000 moved atomically.

## B) Nothing moves — allocate, then the deadline releases everything

```text
   0. start                   | fund(gp) received = 0
                              |   LP1..LP5  unlocked = 1,000,000   locked =         0
   1. after allocate (locked) | fund(gp) received = 0
                              |   LP1..LP5  unlocked =   500,000   locked =   500,000
   2. after deadline release  | fund(gp) received = 0
                              |   LP1..LP5  unlocked = 1,000,000   locked =         0
```
=> the fund received **NOTHING**; every LP is whole again. Not one cent moved. This is the
demo's payoff: a call that can't complete doesn't half-complete.

## Reproduce it

```bash
scripts/setup-localnet.sh      # LocalNet up (3 participants + PQS)
scripts/seed-localnet.sh       # call + per-LP obligations + cash, across participants
python3 scripts/demo-settlement.py   # runs both scenarios, prints the balances above
```

## Honest notes

- **Interface choices are exercised over the JSON Ledger API by package-name**
  (`#…:Allocation`, resolved on-ledger). `dpm script` can't drive these here because the
  locally-rebuilt DAR has a different package-id than the one deployed on the ledger;
  the JSON-API path (what the UI also uses) addresses the deployed package by name and
  works cleanly. (Recorded in JOURNAL.md.)
- Settlement is against **our own real token-standard registry** (`LedgerCallCash`), not
  Canton Coin — disclosed in [HONEST-GAPS.md](../../HONEST-GAPS.md). The `Allocation`
  interface and the atomicity are real; only the asset is ours. On LocalNet all LPs
  co-locate on one participant, so the multi-party submission confirms on one node here;
  the protocol requirement that *every* signatory's participant confirm is unchanged
  ("the isolation is protocol-level and real; the co-location is a packaging choice").
