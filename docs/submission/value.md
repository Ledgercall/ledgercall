# Value

## 1. The problem in one sentence

**Private-fund managers (GPs) and their fund administrators** struggle to **run capital calls and handle investors who fail to fund** because **money moves by manual bank wires across siloed ledgers with no shared, private, atomic settlement, and the default re-allocation is done by hand in spreadsheets**, which costs them **days of reconciliation per call, seven-figure exposure to wire fraud, and partially-funded calls they cannot unwind**.

---

## 2. The value you create

| | Today | With LEDGERCALL |
| --- | --- | --- |
| **What the user does** | GP sends call notices; each LP wires money to the fund's bank account; the administrator manually matches wires to expected amounts across banks, currencies and reference numbers; when an LP defaults, the admin recomputes every LP's share in a spreadsheet and the GP applies a remedy by email and legal | GP issues one on-ledger call; each LP locks its own funds in its own token registry (no wires); the GP settles every leg in a single atomic transaction; on default, the dilution waterfall is computed automatically and proposed to the GP, who approves or declines; each LP sees only its own numbers |
| **Time / cost / risk** | Days of month-end-style reconciliation per call; a seven-figure wire exposed to spoofed-notice fraud; partial funding with no mechanism to unwind; error-prone manual recut; privacy by access control and trust | Settlement is atomic and immediate once legs are locked; no wire to intercept (funds stay in the LP's custody until the atomic settle); partial funding is structurally impossible (all-or-nothing); the recut is deterministic and machine-checked; privacy is enforced by the protocol |

- **Value proposition in one line:** Capital calls that settle atomically with no wires, keep every investor's position private, and handle the LP default correctly, which is the one part of the workflow nobody has automated.
- **Why users would switch from what they do today:** It removes the two worst failure modes at once (fraud on the wire and a partially-funded call you cannot reverse) and automates the error-prone default re-allocation, without taking the remedy decision away from the GP.

---

## 3. Why it matters

- **Cost of the problem:**
  - *Fraud.* The capital-call notice is described as *"the single most valuable phishing target in private markets"* (spec §5.3). Reported average attempted capital-call fraud: **~$809,000**, roughly 7x an ordinary business-email-compromise scam. **(Verify the primary source before external use.)**
  - *Partial funding.* If nineteen LPs wire and one does not, the fund holds some of the money and a deal to close, with no mechanism to give it back.
  - *Reconciliation.* The administrator manually matches wires to expected amounts across banks, currencies and reference-number conventions that LPs routinely get wrong.
- **How many people or companies have it:** Every closed-end private fund (private equity, venture, private credit, real assets) runs capital calls and carries LP-default risk. This is a multi-trillion-dollar asset class, and the call mechanic is universal to it.
- **Evidence:**
  - Legal practitioners confirm the default remedy is real and must stay discretionary: **Morgan Lewis**, *"the general partner should retain discretion in how to apply remedies"* (remedies exist *"as a deterrent"*); **Cooley**, *"the GP typically has discretion whether to declare a default and which remedies to apply."*
  - Existing utilities cover the easy part but not this one: **DTCC AIP** supports capital calls but not institutional LP-direct settlement at scale; Northern Trust's blockchain drawdown product reached **one client in nine years**. Nobody automates the default remedy.
  - A lexical sweep of all 30 Canton Season-3 gallery pitches, GitHub, and the Canton forum returns **zero** occurrences of `capital call`, `dilut*`, `waterfall`, `uncalled`, or `drawdown` (PRIOR-ART.md). The default to dilution waterfall is unclaimed ground.

---

## 4. Why now

- **What changed:** The **Canton Network Token Standard (CIP-0056)** now exists and is live, giving a common `Holding` / `Allocation` interface across registries. The Canton Foundation's dev-fund proposal (approved **2026-05-13**) states verbatim that **"no open-source reference implementations"** of the token standard existed as of April 2026 and funds production blueprints as a *future* deliverable. The vendor is actively steering teams here: `TransferCommand` was deprecated in Splice 0.5.16 with Digital Asset staff stating *"the preferred approach is to use the token standard APIs."*
- **Why this couldn't be solved well before:** Before the token standard, an application could not settle against assets held in registries it did not issue, so a fund could never atomically sweep cash it did not control. Before Canton's sub-transaction privacy, you could not give each LP a private view of a shared deal on a shared ledger. LEDGERCALL is built directly in that gap.

---

## 5. Why Canton

- **What Canton makes possible here:**
  - *Composing with assets you did not issue.* The settlement code imports only the standard token interfaces, with zero registry-specific code, so the LPs' cash can sit in any CIP-0056 registry. Proven by settling **real Canton Coin** through our venue using Canton Coin's own registry.
  - *Atomicity for free.* Every leg settles inside one Daml transaction; Canton requires confirmation from the participant hosting each signatory, so there is no state in which half the call committed. One offline LP aborts the whole settlement and nothing moves.
  - *Per-party privacy, protocol-enforced.* Each LP sees only its own obligation; the proposal naming the defaulter is visible only to GP and admin. Demonstrated by running the same SQL against two participants' databases and getting different answers (6 vs 1).
- **Why a public chain or a plain database wouldn't do:** A public chain exposes every position and counterparty, which institutional LPs cannot accept. A plain database is controlled by one operator, gives no independent settlement guarantee, and cannot provide atomic multi-party settlement between counterparties who do not trust each other. Canton provides atomic multi-party settlement *and* per-party privacy on shared infrastructure, which is exactly the combination a capital call needs.

---

## Checklist

- [x] The problem fits in one sentence
- [x] It names a specific user (GPs and fund administrators), not "everyone"
- [x] The value is shown as a before and after
- [x] There is evidence the problem is real (legal sources, market incumbents, the prior-art sweep)
- [x] "Why now" is answered (the token standard is new; no reference implementations existed as of April 2026)
- [x] It's clear why this belongs on Canton (compose-across-registries + atomicity + privacy)

---

> **Pre-submission check:** verify the ~$809k capital-call-fraud figure against its primary source (or cut it), and add a sourced private-capital AUM number in Section 3 if you have one.
