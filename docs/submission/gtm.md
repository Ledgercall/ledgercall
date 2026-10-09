# GTM — Go-to-Market

> One page. Everything in Sections 4 and 5 is a **hypothesis** (we have no customers or revenue yet); each is labeled and paired with how we would test it.

---

## 1. Positioning

**In one sentence:**
For **GPs and fund administrators who run capital calls by hand** and **have no clean way to unwind a partially-funded call or handle an investor default**, **LEDGERCALL** is a **Canton-native capital-call settlement app** that **locks each investor's own funds and settles the whole call atomically, keeps every investor's position private, and computes the default re-allocation for the GP to approve**. Unlike **bank wires and spreadsheets**, **no money moves until the full call settles in one transaction, and no investor can see another's numbers**.

- **What do users do today instead?** Issue ILPA-template call notices, collect bank wires, reconcile them by hand across banks and currencies, and on default rebuild every LP's allocation in a spreadsheet while the GP applies a remedy by email and legal.
- **Why Canton, and not any other chain?** The app settles against cash held in registries it did not issue (the token-standard allocation mechanism), every leg commits in one atomic transaction with no half-funded state, and each LP's view is private by protocol. A public chain exposes positions and counterparties; a plain database gives no independent, atomic, multi-party settlement. See WHY-CANTON.md.

---

## 2. First customers

- **Segment:** Third-party **fund administrators** that run capital-call operations for many GPs, and **tokenization-forward GPs** (mid-market private credit / PE) already holding or piloting tokenized cash on Canton.
- **Why them first:** Administrators feel the per-call reconciliation and default-recut pain most often (weekly across a book of funds) and one adoption brings many funds with it. Tokenization-forward GPs are the only ones who can act on the "no wires" benefit today, because their LPs' cash can already be on-ledger.
- **First 3–5 targets** (fit the profile; not yet contacted): fund administrators such as **Gen II, Alter Domus, Apex Group, Citco, Juniper Square**; tokenization-forward private-credit GPs on Canton; and the **Alluvren** team (redemptions / money out) as a complementary-app partner, not a competitor.

---

## 3. Distribution channels

| Channel | Why it reaches our users | First concrete action | Effort / cost |
| --- | --- | --- | --- |
| Canton Foundation dev-fund / grant program | The Foundation already stated no open-source token-standard reference implementations exist and funds blueprints as a future deliverable; LEDGERCALL is a capital-call blueprint | Submit LEDGERCALL to the dev-fund as the capital-call + default reference implementation | Low (application) |
| Canton Featured Apps + Digital Asset partner network | Puts the app in front of institutions already transacting on Canton | Apply as a Featured App; request a BD intro to fund-admin and tokenized-cash contacts | Low to medium |
| Fund-administrator direct outreach via ILPA / SuperReturn / private-fund CFO-COO networks | These are where the buyers and daily users already gather | Run 5 to 8 discovery interviews with administrators and GP ops | Low (time) |
| Complementary-app partnership (Alluvren, redemptions) | "Money in + money out" is a stronger institutional pitch than either half alone | Propose a joint demo covering the full fund cash lifecycle | Low |
| Tokenized-cash issuers on Canton (deposit tokens, tokenized MMFs) | They supply the cash leg the "no wires" flow depends on | Identify which live CIP-0056 cash assets exist and pilot a call against one | Medium |

---

## 4. Acquisition hypotheses

| Hypothesis | How we test it | Success metric | Status |
| --- | --- | --- | --- |
| We believe **fund administrators** will pilot LEDGERCALL because the manual reconciliation and default recut is their highest per-call ops cost | 5 to 8 discovery interviews, then ask for a design-partner pilot | ≥1 administrator agrees to a pilot | ⏳ Untested |
| We believe **GPs with tokenized cash on Canton** will route a real call through it because atomic no-wires settlement removes partial-funding risk | Find a GP whose LPs hold tokenized cash; run one DevNet/TestNet call | 1 real call settled atomically with more than one counterparty | ⏳ Untested |
| We believe being the **only open-source capital-call + default reference implementation** will generate inbound from the Canton ecosystem | Publish the repo and submit to the dev-fund | Ecosystem intros, grant, or inbound inquiries | ⏳ Untested |
| We believe **pairing with a redemptions app** makes a more compelling institutional pitch | Joint demo with Alluvren covering money in and money out | Partner agreement or a joint intro to an institution | ⏳ Untested |

---

## 5. Business model

- **Who pays, and for what:** Fund administrators (as a platform adopted across the funds they service) and GPs (per fund). They pay to remove reconciliation labor, partial-funding risk, and manual default-recut error.
- **Pricing hypothesis (untested):** B2B licensing per fund or per call, or an AUM/called-capital basis-point fee, with an administrator platform license. Pricing to be validated in the §4 interviews.
- **Revenue on Canton:** B2B licensing and subscription are the primary model; possible Featured App rewards and grant funding near-term. This is not a consumer transaction-fee model.
- **Why now:** The token standard (CIP-0056) only recently became usable, no reference implementations existed as of April 2026, and Canton's institutional adoption is ramping, so a capital-call blueprint lands in an open gap rather than a crowded one.

---

## 6. First 90 days after the hackathon

| Period | Milestone | How we'll know it's done |
| --- | --- | --- |
| Weeks 1–4 | Discovery interviews; deploy to Canton DevNet/TestNet; submit to the Foundation dev-fund | 5 to 8 interviews logged; a live DevNet demo URL; application submitted |
| Weeks 5–8 | Secure 1 design partner; identify a live CIP-0056 cash asset to settle against; Featured App application | Design partner agreed in writing; target cash asset named; application in |
| Weeks 9–12 | Run 1 pilot call on DevNet/TestNet with tokenized cash and more than one real counterparty; fold in feedback | A real call settles atomically with external counterparties; feedback documented |

---

## 7. Risks and what you need

- **What could block adoption:** the dependency that LPs' cash must be tokenized on Canton for "no wires" to land; regulatory and legal sign-off for a new settlement rail; integration with administrators' systems of record (Juniper Square, eFront, Investran); and reaching institutions that are already on Canton.
- **What you need from the ecosystem:** intros to fund administrators and tokenized-cash issuers; a Canton Foundation grant; a Digital Asset mentor; DevNet/TestNet node access; and an intro to the Alluvren team for a joint money-in/money-out demo.

---

## Checklist

- [x] Positioning fits in one sentence
- [x] First segment is specific (fund administrators + tokenization-forward GPs on Canton)
- [x] At least two channels with a concrete first action
- [x] At least three hypotheses, each with a metric
- [x] It's clear who pays and why
- [x] You can explain why Canton and not any chain
