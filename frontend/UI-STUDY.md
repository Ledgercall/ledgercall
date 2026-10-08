# LEDGERCALL UI Study: reference products

**Date:** 2026-10-08
**Scope:** Patterns for a dark, two-pane "what each party can see" demo of a private-fund capital call on Canton.
**Method:** Web research only. Most fund-admin and tokenized-fund UIs sit behind a login, so screen-level claims about them are marked **[unverified]** unless a public doc describes them. No quotes, numbers or reviews are invented. Where a source is a third-party aggregator, I say so.

---

## 1. Reference products

### 1.1 Carta: LP Portal and Fund ERP (fund-admin category)
**What it does well**
- **One consolidated view per LP.** Carta describes the LP Portal as "one consolidated view of their commitments and holdings", plus a document hub for K-1s, capital call notices and LPAs. https://carta.com/explore-erp/private-equity/lp-portal/
- **The GP controls visibility.** The marketing copy says "As a GP, you decide what to share with your limited partners." That is the same privacy idea we are demoing, but here it is a policy setting, not a property of the ledger. https://carta.com/explore-erp/venture-capital/lp-portal/
- **Active capital calls appear first.** On the "All fund investments" page, LPs see active capital calls, fund commitment information and their active investments. https://carta.com/blog/updated-lp-portal-experience/
- **The money is shown with its context.** The commitments view shows total commitment, amount contributed, vintage year and net asset balance (summarised from Carta pages via search; I could not fetch them directly, HTTP 403). A called amount is never shown on its own: it always sits next to the commitment and what has already been paid in.
- **GP preview of each LP's notice.** GPs can "preview the notice each LP will receive" before sending, and can click an investor's name in the Capital Activity Notice to see that LP's notice. https://carta.com/uk/en/explore/fund-erp/ and https://releasenotes.carta.com/capital-activity-quick-search-2wGj16. This is the closest real-world version of our "view as party X" switcher.
- **Pro rata calls are a first-class option.** The redesigned capital-call tool lets GPs "make pro rata calls or call from specific investors directly" to reduce clerical errors. https://carta.com/product-updates/streamlined-capital-calls-and-more-improvements-to-cartas-investor-services/
- **Low-friction access.** Since 2019, notices can be opened from a secure email link with no login; the link expires after 15 business days. https://releasenotes.carta.com/easier-lp-access-to-capital-call-notices-11xFLi
- Layout, typography and motion: **[unverified]**. The portal is gated, and Carta's own help video is being updated "to reflect the current visual experience". https://support.carta.com/kb/guide/en/how-to-navigate-the-lp-portal-ZPjFDBnTLw/Steps/3899045

**Complaints**
- Slow support: "fairly lean when it comes to support … can take days to get answers back on fairly simple questions" (G2 reviewer, Carta Fund ERP). https://www.g2.com/survey_responses/carta-fund-erp-review-13045189
- In the 2022 post, confirmations were still sent by email ("Right now, we send these confirmations by email"), so the status of a call lived outside the product. https://carta.com/product-updates/streamlined-capital-calls-and-more-improvements-to-cartas-investor-services/
- I found no Reddit threads about the LP portal specifically (not found, not verified).

### 1.2 Juniper Square (fund-admin / investor portal)
**What it does well**
- **Clear service scope.** Juniper Square says it will "calculate investor amounts for capital calls", "prepare capital call notices" and "securely email capital call notices to investors via the Software". https://www.junipersquare.com/terms-and-policies/description-of-services-v202107
- **Payment status tracked per investor position** (for distributions) with ACH or check instructions. https://www.peievents.com/en/wp-content/uploads/2021/06/Juniper-Square-Software-Features-and-Editions.pdf
- The visual design of the investor portal: **[unverified]** (gated).

**Complaints** (G2, about 106 reviews, 4.7 stars average)
- Manual processes slow down transaction approvals. One investment manager had to "delete and recreate nearly 100 transactions" just to add units, because some transaction fields can't be edited after creation. https://g2.com/products/juniper-square/reviews_and_filters?page=4
- Investor portals at the fund level are more limited than the portals for direct SPE investors, and some reviewers want better accounting integration. https://g2.com/products/juniper-square/reviews_and_filters?page=3
- Lesson for us: **you cannot edit a transaction after the fact.** Atomic, immutable settlement fixes the ledger side. The UI still needs to make it obvious that *Release* or a *re-cut* is the way to correct things, not editing.

### 1.3 iCapital (alternatives platform for advisors and investors)
- Public descriptions of the UI are thin. "Interactive dashboards" for portfolio and client reporting are mentioned only by an aggregator, so treat as **[unverified]**. https://rfp.wiki/vendors/icapital
- Complaints (AI-generated aggregator, 30% confidence, so weak evidence): "bugs, crashes, and clunky navigation", plus usability and data-transparency complaints about the retail website. https://rfp.wiki/vendors/icapital
- I found no App Store reviews. Use this only as a soft signal that **navigation depth is what investors notice**.

### 1.4 Canton Network: Splice Wallet and the Canton docs (on-chain category)
**What it does well**
- **Locked first, then completed.** In the token-standard two-step transfer, the sender's coin is locked into a `TransferInstruction` contract. When the receiver accepts, it "is unlocked and the transfer is completed". This is exactly our **Allocate (lock) → Settle** model. https://docs.dev.sync.global/background/tokenomics/cc_transfer_splice_wallet_tokenomics.html
- **Plain verbs.** The wallet lets users "Accept, reject, or withdraw incoming transfer offers", view their "CC balance and individual Holding contracts", and see a "transaction history" where both steps of a two-step transfer "appear as separate entries". https://docs.canton.network/overview/reference/splice-wallet-reference
- **A worked privacy table to borrow.** The Canton use-cases page has a DvP example. Carol sees only the payment leg to Alice, Bob doesn't see Carol, Alice sees all three legs, a third party sees nothing, and it is still one atomic transaction. A securities example says "The Bank will only see the $10k cash transfer, not the underlying shares". https://docs.canton.network/overview/understand/use-cases
- Sub-transaction privacy is explained in plain words: each party sees "only their relevant portions", and the synchronizer routes encrypted views it can't read. https://docs.canton.network/overview/understand/cantons-solution
- Splice Wallet visual design, colour and motion: **[unverified]**. The docs describe what it can do but give no button labels or screenshots.

**Complaints / pitfalls**
- An expired offer does **not** automatically fail. "Funds remain locked until either party takes action to unlock them" (Dfns docs, third party). https://docs.dfns.co/networks/canton. This maps directly onto our deadline **Release**: show who still has money locked, and that the GP must act.
- I found no public user reviews (not found).

### 1.5 Securitize / Superstate / Ondo (tokenized funds)
- **Superstate** describes buying "on-chain with USDC, or off-chain with U.S. Dollars", a $100k minimum, and an allowlisted wallet. Its protocol path mints or burns USTB "in one transaction". https://superstate.com/ustb and https://superstate.com/blog/introducing-protocol-mint-and-redeem. A third-party guide describes an off-chain queued redemption "typically settled at the next NAV" (https://docs.yield.xyz/docs/superstate). This conflicts with the one-transaction path. Lesson: **name which path settles instantly and which is queued**.
- **Ondo USDY**: mint is a request → off-chain purchase → "claim" flow. Redemption can take "within five Business Days" of a valid request. https://forum.arbitrum.foundation/t/ondo-finance-usdy-llc-step-application/23593. Status labels in the app are **[unverified]**.
- **Securitize** has almost no public reviews: one G2 review at 3.5 stars (https://www.g2.com/sellers/securitize), and Trustpilot "3.2, 1 review" according to an aggregator with 15% confidence (https://www.rfp.wiki/vendors/securitize). Its portal UI is **[unverified]**.
- Takeaway: these products all struggle to explain **time-to-settle**. Our demo's selling point is that settlement is a single instant event, so make that visible.

### 1.6 Stripe Dashboard (adjacent: payments craft)
- **A disciplined set of status badges.** Stripe's Badge component has exactly six types, each with a rule:
  - **neutral:** "everything is working as expected"
  - **positive:** "no action required"
  - **negative:** an important negative outcome, no action required
  - **warning:** "Needs immediate action, optional to resolve"
  - **urgent:** "strong requirement to resolve"
  - **info:** marks a key state

  Badges are read-only and never act as buttons. https://docs.stripe.com/stripe-apps/components/badge
- The canonical charge statuses are just **succeeded / pending / failed**. https://stripe.dev/stripe-terminal-android/v3/external/com.stripe.stripeterminal.external.models/-charge/status.html
- Downstream tools separate **processing** (a few minutes) from **pending** (2–3 business days). https://docs.flashquotes.com/finance/payments
- Complaint pattern (anecdotal forum post): an integration showed "pending" while the Stripe Dashboard showed succeeded. https://forums.knack.com/t/stripe-payments-pending/14270. So **always show where a status comes from and how fresh it is**.
- Typography and colour specifics: **[unverified]**. I found only a secondary design write-up.

### 1.7 Mercury (adjacent: banking craft)
- A **"Pending" or "Failed" badge sits next to each transaction**, and clicking it shows the failure reason. Help copy explains a pending charge as "the merchant has started the payment process but hasn't fully completed it". https://support.mercury.com/hc/en-us/articles/28778366589076-Processing-times-for-Card-transactions
- Praise: a "clean, intuitive interface", "works great on mobile" (G2). https://g2.com/products/mercury-mercury/reviews_and_filters?page=4
- Complaints: "delayed balance updates", app instability, slow transfers, and accounts closed without clear explanation (Kimola analysis of Trustpilot reviews, third party). https://kimola.com/reports/in-depth-mercury-bank-feedback-analysis-report-trustpilot-en-us-147007 and https://kimola.com/reports/mercury-business-banking-consumer-insights
- Lesson: **a balance that lags behind the action destroys trust**. After Settle, every pane must update in the same frame.

### 1.8 Ramp (adjacent: approval-decision craft)
- **Approval queue patterns.**
  - Approve and **Reject** buttons. Ramp says "Reject", not "Decline", and rejecting offers two paths: request changes or request repayment.
  - Bulk approval via checkboxes.
  - A "Requires your approval" section on the home page and a "Needs review" tab.

  https://support.ramp.com/hc/en-us/articles/4417421399699-Reviewing-transactions-from-Ramp-cards and https://support.ramp.com/hc/en-us/articles/31702539953171-Vendor-Approvals
- **Pitfall:** approving as the final approver "automatically dismisses" remaining missing items, a hidden side effect. https://support.ramp.com/hc/en-us/articles/4417421399699-Reviewing-transactions-from-Ramp-cards
- Complaints (aggregator of G2 and Capterra): "Full admin tasks often still desktop-first, which matters if approvers review on phones", and heavy configuration effort. https://www.rfp.wiki/accounting-finance/accounts-payable-applications/ramp/gep
- (Vercel's deploy states Queued / Building / Ready / Error / Canceled are another clean, terminal-vs-in-progress vocabulary. https://vercel.com/docs/rest-api/sdk/deployments/cancel-a-deployment and https://directus.com/docs/raw/guides/integrations/vercel/deployments.md)

---

## 2. Patterns worth stealing (for LEDGERCALL)

### 2.1 Two-pane privacy comparison
1. **A "seen by" matrix as the headline**, modelled on Canton's DvP table (§1.4). Make it a small grid: rows are the facts (LP#1 amount, LP#2 amount, the total called, the default), columns are the parties. Use filled or empty dots, and refresh it on every action. It compresses the whole privacy story into one glance for judges.
2. **Show what is hidden, don't just leave it out.** In the LP#1 pane, LP#2's row should appear as a redacted slot ("Another LP: not visible to you"), not disappear. If it is simply missing, the audience reads it as a bug. If it is visibly redacted, they read it as privacy. Carta's "you decide what to share" (§1.1) is policy; ours is cryptographic, so say so: "Not on this node."
3. **"Preview as party X"**, the way Carta lets a GP preview each LP's notice (§1.1). Keep the two pane headers sticky, with the party name, its role and its node ("Node B, isolated").
4. The isolated-node LP pane should show an **explicit empty state**: "This node has received nothing about this call." That empty pane is the proof.

### 2.2 Money states
- Show each LP's amount as **Committed → Called → Locked → Paid in** (Carta shows commitment and contributed side by side, §1.1). Use tabular figures and right-aligned amounts with the currency code, and never round on the settle screen.
- Use **one badge vocabulary with fixed meanings**, Stripe-style (§1.6):

| State | Meaning | Badge type |
|---|---|---|
| Awaiting | Called, not yet locked | neutral or warning |
| Locked | Funds held in escrow, still the LP's own | info, with a lock icon |
| Paid | Settled | positive |
| Released | Funds unlocked, nothing moved | neutral |
| Missed | Defaulted | negative |
| Needs decision | Re-cut pending | urgent |

- Badges are read-only. Actions are always buttons (Stripe rule).
- Put **"Locked" in the LP's own wallet balance** ("$2.0M available · $0.5M locked"). This follows Splice's lock-into-`TransferInstruction` model (§1.4) and shows that the money hasn't left yet.

### 2.3 All-or-nothing settlement feedback
- **One transaction, one moment.** On Settle, flip every row in every pane to "Paid" in the same frame. Show a single shared transaction ID and timestamp in all panes ("Same transaction: 0x…"). This avoids Mercury's lagging-balance complaint (§1.7).
- **Arm before settling.** Show a checklist of "N of N locked". The Settle button is enabled only when every LP has locked. Otherwise show "Settle (waiting on LP #2)".
- **Release is also atomic.** After Release, every pane shows "Released · nothing moved" with the same transaction ID. A Dfns-style limbo of offers that are expired but still locked (§1.4) must never appear.
- Motion: one short (≤300 ms) simultaneous state change in both panes. That is enough on a projector, so don't stagger it.

### 2.4 Default / re-cut decision
- Model it on Ramp's approval queue (§1.8): a "Needs your decision" card at the top of the GP pane, with a two-column preview before → after:
  - LP#1: $500k → $625k (+$125k)
  - LP#2: $500k → $625k (+$125k)
- **Show the side effects before the click.** Avoid Ramp's hidden auto-dismiss. Spell out: "Approving asks LP #1 and LP #2 to lock more. Nothing moves until you Settle."
- Primary button: "Approve re-cut". Secondary: "Decline: release everyone". The decline label states its consequence.
- The LP panes should show only *their own* new number ("Your share increased by $125k because another LP missed the call"), never who defaulted.

---

## 3. Do NOT copy

| Anti-pattern | Seen in | Why not |
|---|---|---|
| Status lives in email, not in the product | Carta 2022 confirmations by email (§1.1) | Our demo *is* the status. Every state change must be visible on screen. |
| Edit-in-place or "delete and recreate" corrections | Juniper Square G2 complaint (§1.2) | It contradicts an immutable ledger. Corrections are new actions (Release, Re-cut) with history. |
| Hidden side effects on Approve | Ramp final-approver auto-dismiss (§1.8) | A re-cut changes other people's obligations, so show them first. |
| Locked funds with no clear owner of the next step | Canton offers expire but stay locked (Dfns, §1.4) | Always label who must act and by when (deadline countdown on Release). |
| Two sources of truth for one status | Stripe pending vs succeeded mismatch (§1.6) | Show one transaction ID and "as of" time in every pane. |
| Instant and queued settlement paths mixed together | Superstate vs yield.xyz (§1.5), Ondo 5-day redemption | Our selling point is instant atomicity, so never show a vague "processing" spinner after Settle. |
| Desktop-only approvals | Ramp complaint (§1.8) | Judges may be on a phone. Stack the panes vertically under ~720px and keep Approve/Decline reachable. |
| Hiding other parties' rows entirely | Generic portals | It reads as missing data. Show a redacted placeholder instead. |
| Colour as the only status signal | General | Projector contrast washes colours out. Pair every badge with a word and an icon. |

---

## 4. Jargon → plain language

| Term in code | On-screen wording | Why / grounding |
|---|---|---|
| Capital call | **Capital call** (keep it) | Fund-ops people use this term. Carta and Juniper Square both say "capital call notices" (§1.1, §1.2). |
| Obligation | **Your share** / "Amount due" | Carta talks about commitment and contributed amounts. LPs think in "my share of this call". |
| Allocate | **Lock funds** (button) → status "Locked" | Splice says the coin is "locked" until accepted (§1.4). "Allocate" sounds like the GP's job. |
| Settle | **Settle call: pay everyone at once** | Stripe and Mercury use "Paid / Succeeded". The subtitle carries the all-or-nothing message. |
| Release | **Release all: no money moves** | It is the opposite of Settle. Saying "no money moves" prevents people from reading it as a payout. |
| Shortfall | **Missing amount** | Plain words. Show it as a number, not a label alone. |
| Defaulter | **LP that missed the call** (GP view only) | Softer. LP panes never name the defaulter. |
| Re-cut | **Re-split the missing amount** ("Approve re-split" / "Decline: release everyone") | Carta uses the "pro rata" wording (§1.1). Put "pro rata" in the helper text for fund-ops viewers. |
| Approve / Decline | **Approve / Decline** | Ramp uses "Reject" (§1.8). For a GP choosing between options, "Decline" is less hostile. Keep it, with the consequence spelled out. |
| Participant / node | **Server** or "Node B (separate server)" in a tooltip | Splice calls each validator node's wallet "built-in" (§1.4). Judges need "separate machine", not "participant". |
| App-provider / app-user | **Fund operator** / **Investor** | These are Canton roles. Show them only in a dev or tech drawer. |
| PQS | Hide it. If needed: **"Read from this party's own ledger copy"** | Implementation detail. It only matters as the source of the "as of" stamp. |
| Contract / Holding | **Locked funds** / **Balance** | Splice's "Holding contracts (UTXOs)" is developer language (§1.4). |
| Sub-transaction privacy | **"Each party only receives its own part"** | Close to Canton's own phrasing, "only their relevant portions" (§1.4). |

---

## 5. Not verified / gaps
- Carta LP Portal, Juniper Square, iCapital, Securitize, Ondo and Superstate **screen-level layout, typography, colour and motion**: gated. Marked [unverified] above.
- Splice Wallet exact button labels and visuals: the docs describe what it can do but show no screens.
- Stripe and Linear typography and colour tokens: not confirmed from primary sources.
- Not researched: Allvue, Addepar, Altvia, Chronograph, Vestberry, Libre.
- I found no Reddit threads for Carta LP Portal, Securitize or iCapital. The review evidence for iCapital and Securitize comes from low-confidence aggregators (rfp.wiki).

---

## 6. Corrections after review (main session)
These suggestions above are **not** adopted, because they conflict with the product or with the UI-only rule:
- **Redacted placeholder rows for other LPs (§2.1.2, §3).** One placeholder per hidden LP would tell each LP *how many* LPs exist and how many defaulted. HONEST-GAPS.md §1 says that must stay hidden, and the LP's node has no way to know the count anyway. Use one fixed sentence instead: "Other investors' shares are not on this server."
- **Settle enabled only when every LP has locked (§2.3).** That changes the app's behaviour: today the GP can settle whatever is locked. Keep the behaviour and make the label honest ("Settle 2 of 6 locked").
- **"Decline: release everyone" (§2.4, §4).** Wrong. `DeclineRecut` only archives the proposal and releases nothing. Use "Decline, keep shares as they are".
- **Example amounts "$500k → $625k" (§2.4).** These are invented. The live seed gives each of 5 LPs +$100,000 → $600,000. The UI must show real ledger values only.
- **Committed → Called → … (§2.2).** The LocalNet seed creates no `Commitment` contracts, so "committed" can't be shown without a data change. Use Called → Locked → Paid in.
