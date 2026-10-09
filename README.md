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

The four `splice-api-token-*` DARs under `.lib/` are the real CIP-0056 interfaces,
committed so the project builds offline. Regenerate them from source with
`scripts/build-token-standard.sh` (pins splice `9c7ffd2`).

---

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
