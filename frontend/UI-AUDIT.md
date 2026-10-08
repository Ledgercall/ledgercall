# UI audit — LEDGERCALL viewports (Step 1, read-only)

2026-10-08 · Screenshots: `docs/ui/before/` (390×844, 1440×900, 360×780, plus each flow state)

## Project, filled in
- **Purpose:** a live demo of a private-fund capital call on Canton. LPs lock funds in their own wallet, the GP settles atomically or releases at the deadline, and a default triggers a GP-decided re-cut. Each party sees only its own data.
- **Users and devices:** hackathon judges and fund-ops viewers watching a laptop or projector demo, sometimes on a phone.
- **Stack:** Vite 5 + React 18, plain CSS (`src/styles.css`, already uses CSS custom properties), Google Fonts (Fraunces / Hanken Grotesk / JetBrains Mono). No router, no component library, no tests for the frontend. The data layer is `src/ledger.js` (JSON Ledger API v2).
- **Brand:** none fixed. The dark "terminal-luxe" direction already exists.

## Map: one route, one screen, many states
`App` = hero → status banner → 4-step rail → **two `PaneColumn`s** (party picker + node badge + `Viewport`) → privacy note → proof strip.

`Viewport` renders a party's active contracts in sections: **Fund received** (GP/admin, after settlement) · **Capital call** (or "not visible") · **Obligations** · **GP controls** (count locked, Settle / Release) · **LP Funds** (Allocate button or "locked to the call" + wallet balance) · **Default: re-cut proposed** (Approve / Decline, GP only) · **Your re-cut**.

### Every action (all verified working on the live ledger, no page errors)
| Action | Who | Ledger call | Before shot |
|---|---|---|---|
| Pick party for view A / B | anyone | read only | `before-*-gp-*.png` |
| Allocate $X | LP #1, LP #2 | `Cash_Allocate` | `before-settle-1440-02/03` |
| Settle call | GP / Admin | `Allocation_ExecuteTransfer` ×N, one `submitMulti` | `before-settle-1440-04` |
| Release | GP / Admin | `Allocation_Withdraw` ×N | `before-release-1440-02` |
| Approve re-cut | GP only | `ApproveRecut` | `before-approve-1440-02..04` |
| Decline re-cut | GP only | `DeclineRecut` | `before-decline-1440-01` |

### States per section (what exists today)
| State | Today |
|---|---|
| App loading | "LOADING…" mono text, full screen |
| App fatal (no config) | raw error string in red mono |
| Pane loading | "loading…" text. Panes go blank on every refresh, causing layout jumps |
| Pane error | raw `String(e)` (e.g. `submit 400: {json…}`) in red. Replaces the **whole pane**, and the only way out is changing the dropdown |
| Busy (action in flight) | buttons disabled, with no spinner and no label change |
| Success | top banner text swaps (5 tones). It sits far above the button that was clicked, so on phone it's off-screen |
| Empty | "not visible to this party", "none visible" in dim italics |

## What's wrong, concretely

**Layout and responsiveness**
1. **Horizontal scroll at 390px and 360px** (scrollWidth 487). The `.proofs` grid keeps 2 columns, `code` paths don't wrap, and the 3rd proof card hangs off-screen.
2. Party picker truncates on phone ("General Partn").
3. On phone the panes stack, which **loses the core idea**: you can't see two views side by side. The viewer scrolls about 1,200px between "GP sees 6" and "LP sees 1".
4. The hero takes the whole first screen on desktop (about 470px of headline) before any product appears. On a projector, the panes start below the fold.
5. The action feedback banner sits above the rail, far from the buttons. After clicking Allocate in pane B you don't see the confirmation.

**Hierarchy**
6. There's no "big number first". Each pane opens with section labels in spaced-out mono caps, and every section has the same weight. The one number that matters per party (GP: locked/received of $3M; LP: "you owe $500k", "locked", "+$100k re-cut") isn't the hero.
7. The **status of the call is wrong-looking**: the "OPEN" badge stays after settlement, and the LP still sees "Allocate $500,000" after being paid in. These are data/logic facts (the obligation and call status aren't updated on-ledger), so the UI can't fix them without a logic change. **Flag for you.**
8. The GP view labels the GP's list of all LPs' recuts as **"Your re-cut"**, which is wrong for the GP and shows 5 identical anonymous rows (`+$100,000 → $600,000`) with no LP name.
9. The 4-step rail looks like a stepper but is static. It never shows where you are in the story.

**Colour**
10. There are 8 hues in play (green, amber, slate, violet, red, blue, purple, plus three background glows and film grain). State colours double as decoration (the green hero italic, green count badges), so green no longer means "money moved".
11. The **disabled primary button looks enabled**: it's a dimmed green fill with 2.4:1 text contrast. "Settle call" at $0 locked reads as clickable.
12. `--dim` (#5c6878) is 3.3:1 on panels. It's used for real content at 12–13.5px: party names in obligations, wallet balance, proof subtitles, the privacy note. **That fails WCAG AA.**

**Copy and jargon**
13. Ledger and infra jargon reaches the viewer: `app-provider` / `app-user` badges, `VIEW A/B`, `app_user_ledgercall-localparty-1` as a party name (and as the "defaulter", in red), "obligations", "re-cut", "PQS databases", `docs/evidence/*.md` file paths.
14. The defaulter is shown as a raw party ID in alarming red, which is the most prominent text in the GP pane.
15. Errors are raw JSON from the ledger, with no plain explanation and no retry.

**Accessibility**
16. The two `<select>`s have **no label** (the "VIEW A" tag isn't a `<label>`).
17. There's **no `aria-live`** region, so screen readers never hear "Fund received $1,000,000".
18. There are **no focus styles** beyond the browser default, and the custom select hides its arrow.
19. There's **no `prefers-reduced-motion`** handling, yet the page has rise animations, a pulsing glow, a blinking live dot and film grain.
20. Heading outline: h1 jumps to h3 and there's no h2.

**Performance and tech**
21. Three Google Font families, about 10 weights including variable Fraunces, are render-blocking via `<link>`. The display face is used only in the hero.
22. Each action re-fetches both panes and blanks them, so content jumps.
23. `money()` rounds to whole dollars (fine) but uses a mix of mono and sans for the same figures.

## Decisions I need from you (logic, not UI)
- **#7:** after settlement, the call still says OPEN and LPs still see an Allocate button, because nothing archives or updates the obligation on-ledger. The UI could *derive* "settled" from "fund received ≥ due", but that's display logic layered over the data. Should I do that derivation, or leave it as is?
- Showing a readable LP name instead of `app_user_ledgercall-localparty-1` needs only the labels already in `demo-config.json` (UI-only). I plan to do this unless you object.
