# PQS blindness proof — the privacy claim, displayed in SQL

This is the product claim made **falsifiable and reproducible**: the same SQL, run
against two *different Canton participants'* Participant Query Store (PQS) databases,
returns **different answers**. Per-LP blindness is not asserted here — it is enforced
by the Canton protocol and shown by querying two nodes you can inspect yourself.

Captured on a cn-quickstart LocalNet (Splice 0.6.11), three genuinely distinct
participant nodes (`sv`, `app-provider`, `app-user`), each with its own Ledger API and
its own PQS Postgres database.

## Party → participant layout (spec §8.1, §12.1)

| Role | Party (operator of the node) | Participant | Its PQS database |
| --- | --- | --- | --- |
| **GP** | `app_provider_ledgercall-localparty-1::1220c0d9…` | app-provider | `pqs-app-provider` |
| **Isolated LP** | `app_user_ledgercall-localparty-1::12204b12…` | app-user | `pqs-app-user` |
| other LPs, admin | freshly allocated | app-provider | (seen via the GP) |

The GP is the sole signatory of every `CallObligation`; each LP is an observer of only
its own. So the GP's node sees them all, and the isolated LP's node sees exactly one.

## The proof — same query, two databases, different answers

```text
# Participant: app-provider  (the GP's PQS database)
$ psql -d pqs-app-provider -c "SELECT count(*) FROM active('ledgercall:LedgerCall.Call:CallObligation');"
6

# Participant: app-user  (the isolated LP's PQS database) — SAME query
$ psql -d pqs-app-user -c "SELECT count(*) FROM active('ledgercall:LedgerCall.Call:CallObligation');"
1

# ShortfallProposal (carries the defaulter identity) — visible only to GP/admin
app-provider: 1
app-user    : 0   <- the LP's node cannot even see the proposal exists
```

Per-row detail from `pqs-app-provider` (the GP sees every LP's number):

```text
lp1::1220c0d9…                                 | 1000000.0000000000 | divulged_only=f
lp2::1220c0d9…                                 | 1000000.0000000000 | f
lp3::1220c0d9…                                 | 1000000.0000000000 | f
lp4::1220c0d9…                                 | 1000000.0000000000 | f
lp5::1220c0d9…                                 | 1000000.0000000000 | f
app_user_ledgercall-localparty-1::12204b12…    | 1000000.0000000000 | f
```

…while `pqs-app-user` returns a single row — its own:

```text
app_user_ledgercall-localparty-1::12204b12…    | 1000000.0000000000 | divulged_only=f
```

`divulged_only = f` on every row confirms these are genuine stakeholder views, not
divulgence — the isolated LP's node never received the other five obligations at all.

## Reproduce it

```bash
scripts/setup-localnet.sh      # bring up LocalNet (3 participants + 2 PQS), Nix-free
scripts/seed-localnet.sh       # allocate parties across participants + create the call
scripts/privacy-proof.sh       # run the queries above against both PQS databases
```

Notes:
- The count scales with the number of LPs on app-provider: `N_AP=29 scripts/seed-localnet.sh`
  on a fresh ledger gives the headline **30 vs 1**. The differential is the proof; the
  magnitude is a knob. (This capture used `N_AP=5`.)
- **Honest nuance (spec §11.3):** the three participants are genuinely distinct Canton
  nodes — distinct keys, namespaces, ACS stores and Ledger APIs — co-located in one
  container for resource reasons. *The isolation is protocol-level and real; the
  co-location is a packaging choice.*
- PQS query form note (spec §6.3): inside the PQS database the template is addressed as
  `package-name:Module:Template`; the leading `#` form is for the Ledger API, not the DB.
