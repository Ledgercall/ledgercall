# ICP — Ideal Customer Profile

## 1. Who they are

| | |
| --- | --- |
| **Segment** | Closed-end private funds (private credit, private equity, venture, real assets) and the third-party fund administrators who run their capital-call operations. Narrowed to the tokenization-forward subset already piloting or holding assets on Canton. |
| **Company size / stage** | Institutional and regulated. GPs roughly $100M to $5B AUM (large enough to have many LPs and real default risk, small enough to feel ops cost per call). Fund administrators of any size that service dozens to hundreds of such funds. |
| **User** | The fund administrator / fund operations team that issues the call, reconciles funding, and computes the re-allocation when an LP defaults. Also the GP's finance/ops staff. |
| **Buyer** | The fund manager (COO/CFO of the GP), or the fund-administration firm itself adopting it as a settlement rail across the funds it services. |
| **Geography** | US first, then Switzerland/EU and Hong Kong/Singapore, where institutional tokenized-asset frameworks and Canton adoption are furthest along (SIX/SDX, HKMA precedents). |

---

## 2. Their pain

- **Top pain point:** "Every capital call I run means days of reconciling wires across banks, currencies and reference numbers that LPs get wrong. If one investor does not fund, I hold some of the money and a deal to close with no way to unwind it, and I have to rebuild every LP's allocation by hand in a spreadsheet without fat-fingering a cell. And a single spoofed call notice can redirect a seven-figure wire."
- **How often it happens:** Per deal / per drawdown, several times a year per fund. An administrator servicing many funds sees capital calls weekly, and LP defaults every cycle across a book of funds.
- **What it costs them:** Days of operations labor per call; fraud exposure on the wire (reported average attempted capital-call fraud around $809k, pending source verification); error-prone manual recut on default; and LP trust when numbers or privacy slip.
- **How they solve it today:** ILPA PDF call-notice templates, bank wires, and manual matching in fund-admin systems (Juniper Square, Allvue, eFront/BlackRock, Investran/FIS). Default re-allocation is spreadsheet arithmetic plus email and legal. No shared, private, atomic settlement exists.

---

## 3. What they want

- **Job to be done:** "When I issue a capital call and one investor may not fund, I want every investor to settle privately and atomically and the default re-allocation computed correctly, so I close the full call without wires, without reconciliation, and without being left holding a partially funded deal."
- **What would make them switch:** It settles against assets the LPs already hold on Canton (no wires); it keeps the default remedy a GP decision rather than automating judgment away; it gives each LP a private view enforced by the protocol, not by access control; and it requires no change to the LPA or the fund's legal structure.
- **What would stop them:** Compliance and legal sign-off on a new settlement rail; the adoption dependency that LPs' cash must actually be tokenized on Canton for the "no wires" benefit to land; integration with existing fund-admin systems of record; custody and audit questions; and trust in new infrastructure.

---

## 4. Where to find them

- **Communities, events and channels they use:** The Canton Network community and Digital Asset events; ILPA (Institutional Limited Partners Association); private-fund CFO/COO forums; SuperReturn and similar private-markets conferences; fund-administration industry groups.
- **Tools and platforms they already rely on:** Juniper Square, Allvue, eFront (BlackRock), Investran (FIS), Carta/DealCloud for fund operations; ILPA templates for notices; SWIFT and bank wires for the money.
- **3 real companies that fit this profile** (they match the ICP; not confirmed users):
  - **Third-party fund administrators** such as Gen II, Alter Domus, Apex Group, Citco, or Juniper Square, each running capital-call operations for many GPs.
  - **Tokenization-forward asset managers** piloting fund settlement on Canton (mid-market private credit or PE), the GPs with tokenized cash or MMF holdings who can act on "no wires" today.
  - **Feeder / wealth platforms** such as iCapital, Moonfare, or Titanbay that aggregate investors into a single LP line (a user type, with the honest caveat that per-beneficial-owner privacy terminates at the feeder; see HONEST-GAPS.md).

---

## 5. Who is NOT your customer (for now)

- **Retail investors and small angel syndicates:** no tokenized cash, low per-call value, privacy and default risk not acute enough to justify adoption.
- **Open-end and hedge funds:** they run subscriptions and redemptions, not capital calls. Redemptions are the structural mirror image handled by a separate project (Alluvren).
- **Funds whose LPs hold no tokenized assets on Canton:** the "no wires" benefit cannot land until the cash leg exists on-ledger, so they are a later cohort, not a first customer.
- **Per-beneficial-owner privacy behind feeders:** explicitly out of scope; every privacy claim is scoped to LPs on the register.
- **Crypto-native funds wanting public-chain settlement:** the privacy model and institutional posture are a mismatch.

---

## Checklist

- [x] The segment is narrow enough to name real companies or people
- [x] User (fund administrator / GP ops) and buyer (GP COO/CFO or the admin firm) are identified
- [x] The pain is described from their point of view
- [x] You know where to reach them (ILPA, Canton community, SuperReturn, the fund-admin platforms)
- [x] You've said who you're not targeting
