import React, { useEffect, useState } from 'react'
import { loadConfig, activeFor, historyFor, exercise, submit, exerciseCmd, byTemplate, short, money, ALLOC_IFACE, EXTRA } from './ledger.js'
import { T, historyStart, outcomes, shareStatus, callSummary, recutDecision, recordCount } from './derive.js'
import { Badge, Banner, Button, Empty, Icon, Row, Section, Segmented, Select, Skeleton, Stamp, StatusBadge, Stepper } from './ui.jsx'

const SHORTFALL = '#ledgercall:LedgerCall.Cascade:ShortfallProposal'
const CASH = '#ledgercall:LedgerCall.TestRegistry:LedgerCallCash'
const isUserNode = base => base === '/au'
const serverName = base => (isUserNode(base) ? 'Investor server' : 'Fund server')
const serverTitle = base => `Separate Canton participant node (${isUserNode(base) ? 'app-user' : 'app-provider'})`

// One party's own view: active contracts plus its own history. Keeps the last good
// data while refreshing so panes never blank out.
function useSnapshot(role, token, refreshKey) {
  const [snap, setSnap] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let live = true
    setSnap(s => ({ ...s, loading: true, error: null, data: s.data?.party === role.party ? s.data : null }))
    ;(async () => {
      const contracts = await activeFor(role.base, token, role.party)
      const groups = byTemplate(contracts)
      const start = historyStart(groups)
      const history = start == null ? [] : await historyFor(role.base, token, role.party, start)
      return { party: role.party, groups, out: outcomes(history), decision: recutDecision(history) }
    })()
      .then(data => { if (live) setSnap({ data, error: null, loading: false }) })
      .catch(e => { if (live) setSnap(s => ({ ...s, error: String(e), loading: false })) })
    return () => { live = false }
  }, [role.party, role.base, token, refreshKey])
  return snap
}

export default function App() {
  const [cfg, setCfg] = useState(null)
  const [err, setErr] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [left, setLeft] = useState('gp')
  const [right, setRight] = useState('lp0')
  const [active, setActive] = useState('A')
  const [counts, setCounts] = useState({})
  const [announce, setAnnounce] = useState('')

  useEffect(() => { loadConfig().then(setCfg).catch(e => setErr(String(e))) }, [])
  if (err) return <Fatal detail={err} />
  if (!cfg) return <Boot />

  const roles = {
    gp: { key: 'gp', ...cfg.gp },
    admin: { key: 'admin', ...cfg.admin },
    ...Object.fromEntries(cfg.lps.map((l, i) => [`lp${i}`, { key: `lp${i}`, ...l, label: isUserNode(l.base) ? 'Isolated LP' : l.label }])),
  }
  // Readable names for any party id this UI shows (labels come from demo-config.json).
  const nameOf = p => {
    const r = Object.values(roles).find(r => r.party === p)
    if (r) return r.label
    const m = /^lp(\d+)$/.exec(short(p))
    return m ? `LP #${m[1]}` : short(p)
  }
  const onAction = text => { setAnnounce(text); setRefreshKey(k => k + 1) }
  const options = Object.values(roles).map(r => ({ value: r.key, label: r.label }))
  const panes = [
    { side: 'A', selected: left, onSelect: setLeft },
    { side: 'B', selected: right, onSelect: setRight },
  ]

  return (
    <div className="app">
      <a className="skip" href="#views">Skip to the two views</a>
      <header className="top">
        <div className="brand">
          <a className="wordmark" href="/" aria-label="LEDGERCALL home">LEDGERCALL</a>
          <Badge tone="ok" icon="server">Live on Canton LocalNet</Badge>
        </div>
        <h1 className="headline">A capital call where investors never wire money.</h1>
        <p className="lede">
          Each investor locks its share in its own wallet. The GP settles every share in one
          transaction, or releases them all. Each party sees only its own numbers.
        </p>
      </header>

      <Story role={roles.gp} token={cfg.token} refreshKey={refreshKey} />

      <div className="compare" aria-label="Compare two views">
        <Segmented label="Which view to show" value={active} onChange={setActive}
          options={panes.map(p => ({ value: p.side, kicker: `View ${p.side}`, label: roles[p.selected].label }))} />
        <p className="compare-line">
          {panes.map((p, i) => (
            <React.Fragment key={p.side}>
              {i > 0 && <span className="compare-sep" aria-hidden="true">·</span>}
              <span><strong>{roles[p.selected].label}</strong> sees <span className="num">{counts[p.side] ?? '—'}</span> {counts[p.side] === 1 ? 'record' : 'records'}</span>
            </React.Fragment>
          ))}
        </p>
      </div>

      <main id="views" className="split">
        {panes.map(p => (
          <Pane key={p.side} {...p} hidden={active !== p.side} roles={roles} options={options} nameOf={nameOf}
            token={cfg.token} refreshKey={refreshKey} onAction={onAction}
            onCount={n => setCounts(c => (c[p.side] === n ? c : { ...c, [p.side]: n }))} />
        ))}
      </main>
      <p className="sr-only" aria-live="polite">{announce}</p>

      <footer className="proofs">
        <h2 className="proofs-title">Checked, not claimed</h2>
        <div className="proofs-grid">
          <Proof title="8 of 8 ledger tests pass" text="Privacy, the re-split maths, and all-or-nothing settlement." />
          <Proof title="Privacy holds across two servers" text="The same query returns 6 shares on the fund's database and 1 on the investor's." file="docs/evidence/privacy-proof.md" />
          <Proof title="Settles real Canton Coin" text="An asset this app never issued, moved through the token standard." file="docs/evidence/canton-coin-proof.md" />
        </div>
      </footer>
    </div>
  )
}

function Proof({ title, text, file }) {
  return (
    <div className="proof">
      <Icon name="check" size={16} className="proof-icon" />
      <div>
        <div className="proof-title">{title}</div>
        <div className="proof-text">{text}</div>
        {file && <code className="proof-file">{file}</code>}
      </div>
    </div>
  )
}

function Boot() {
  return (
    <div className="app" aria-busy="true">
      <span className="sr-only" role="status">Loading the demo…</span>
      <div className="split boot"><div className="pane"><Skeleton /></div><div className="pane"><Skeleton /></div></div>
    </div>
  )
}

function Fatal({ detail }) {
  return (
    <div className="app fatal">
      <Banner tone="error" title="The demo isn't set up yet">
        The UI couldn't find its party list. Start LocalNet and seed the demo with <code>scripts/localnet-up.sh</code>, then reload.
        <details className="details"><summary>Technical detail</summary><code>{detail}</code></details>
      </Banner>
    </div>
  )
}

// The story so far, as the fund's own server records it.
function Story({ role, token, refreshKey }) {
  const { data } = useSnapshot(role, token, refreshKey)
  if (!data) return <div className="story-wrap"><div className="stepper-sk" aria-hidden="true" /></div>
  const g = data.groups
  const s = callSummary(g, data.out)
  const n = (g[T.obl] || []).length
  const last = data.out.last
  const proposal = (g[T.prop] || []).length > 0
  const settled = !!last
  const steps = [
    { label: 'Call issued', detail: s.call ? money(s.total) : 'not yet', state: s.call ? 'done' : 'active' },
    { label: 'Investors lock funds', detail: last?.kind === 'paid' && !s.lockers ? `${new Set(data.out.perAlloc.filter(l => l.kind === 'paid').map(l => l.owner)).size} of ${n} paid in` : `${s.lockers} of ${n} locked`, state: settled ? 'done' : s.call ? 'active' : 'todo' },
    { label: 'Settle or release', detail: last ? (last.kind === 'paid' ? `${money(s.paid)} paid in` : 'released, nothing moved') : 'one transaction', state: settled ? 'done' : s.locked > 0 ? 'active' : 'todo' },
    { label: 'Missed payment', detail: proposal ? 'GP to decide' : data.decision ? `re-split ${data.decision}` : 'none', state: proposal ? 'active' : data.decision ? 'done' : 'todo' },
  ]
  return <div className="story-wrap"><Stepper label="Progress of the call, as the fund's server records it" steps={steps} /></div>
}

function Pane({ side, selected, onSelect, hidden, roles, options, nameOf, token, refreshKey, onAction, onCount }) {
  const role = roles[selected]
  return (
    <section className={`pane${hidden ? ' pane-inactive' : ''}`} aria-label={`View ${side}: ${role.label}`}>
      <div className="pane-head">
        <Select label={`View ${side}`} value={selected} onChange={onSelect} options={options} />
        <span title={serverTitle(role.base)}><Badge tone={isUserNode(role.base) ? 'accent' : 'neutral'} icon="server">{serverName(role.base)}</Badge></span>
      </div>
      <Viewport role={role} nameOf={nameOf} token={token} refreshKey={refreshKey} onAction={onAction} onCount={onCount} />
    </section>
  )
}

function Viewport({ role, nameOf, token, refreshKey, onAction, onCount }) {
  const snap = useSnapshot(role, token, refreshKey)
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [retry, setRetry] = useState(0)
  const data = snap.data

  useEffect(() => { setNotice(null); setActionError(null) }, [role.party])
  useEffect(() => { setNotice(n => (n?.fresh ? { ...n, fresh: false } : null)) }, [refreshKey])
  useEffect(() => { onCount(data ? recordCount(data.groups) : null) }, [data])
  useEffect(() => { if (retry) onAction('') }, [retry])

  if (!data && snap.error) return (
    <div className="vp">
      <Banner tone="error" title="Couldn't load this party's view"
        action={<Button variant="ghost" icon="refresh" onClick={() => setRetry(r => r + 1)}>Try again</Button>}>
        Its server didn't answer. Check that LocalNet is running.
        <details className="details"><summary>Technical detail</summary><code>{snap.error}</code></details>
      </Banner>
    </div>
  )
  if (!data) return <div className="vp" aria-busy="true"><Skeleton /></div>

  const g = data.groups
  const obls = g[T.obl] || []
  const props = g[T.prop] || []
  const recuts = g[T.recut] || []
  const cash = g[T.cash] || []
  const allocs = g[T.alloc] || []
  const isLp = role.key.startsWith('lp')
  const isGp = role.key === 'gp' || role.key === 'admin'
  const sum = callSummary(g, data.out)

  const fundReceived = cash.filter(c => c.arg.owner === role.party).reduce((s, c) => s + Number(c.arg.amount), 0)
  const lockedTotal = allocs.reduce((s, a) => s + Number(a.arg.amount), 0)

  const run = async (key, fn) => {
    setBusy(key); setActionError(null); setNotice(null)
    try { await fn() } catch (e) { setActionError(String(e)) } finally { setBusy(null) }
  }
  // A notice belongs to the action that caused it; the next refresh after that clears it.
  const done = (text, tone = 'ok') => { setNotice({ text, tone, fresh: true }); onAction(text) }

  const allocate = (obl, cashC) => run('allocate', async () => {
    const o = obl.arg
    const settlement = { executor: o.gp, settlementRef: { id: o.callId, cid: null }, requestedAt: o.allocateBefore, allocateBefore: o.allocateBefore, settleBefore: o.settleBefore, meta: { values: {} } }
    await exercise(role.base, token, role.party, CASH, cashC.cid, 'Cash_Allocate',
      { executor: o.gp, receiver: o.gp, settlement, transferLegId: `${o.callId}-${short(o.lp)}`, allocAmount: o.amountDue })
    done(`${role.label} locked ${money(o.amountDue)} in its own wallet.`, 'warn')
  })

  const settleAll = () => run('settle', async () => {
    const liveAllocs = (await activeFor(role.base, token, role.party)).filter(c => c.tpl === T.alloc)
    if (!liveAllocs.length) return done('Nothing is locked yet, so there is nothing to settle.', 'info')
    const owners = [...new Set(liveAllocs.map(a => a.arg.owner))]
    const total = liveAllocs.reduce((s, a) => s + Number(a.arg.amount), 0)
    await submit(role.base, token, [role.party, ...owners], liveAllocs.map(a => exerciseCmd(ALLOC_IFACE, a.cid, 'Allocation_ExecuteTransfer', { extraArgs: EXTRA })))
    done(`The fund received ${money(total)} from ${owners.length} investor${owners.length > 1 ? 's' : ''} in one transaction.`)
  })

  const releaseAll = () => run('release', async () => {
    const liveAllocs = (await activeFor(role.base, token, role.party)).filter(c => c.tpl === T.alloc)
    if (!liveAllocs.length) return done('Nothing is locked, so there is nothing to release.', 'info')
    const owners = [...new Set(liveAllocs.map(a => a.arg.owner))]
    const total = liveAllocs.reduce((s, a) => s + Number(a.arg.amount), 0)
    await submit(role.base, token, owners, liveAllocs.map(a => exerciseCmd(ALLOC_IFACE, a.cid, 'Allocation_Withdraw', { extraArgs: EXTRA })))
    done(`${money(total)} released back to investors. No money moved.`, 'info')
  })

  const approve = (p) => run('approve', async () => {
    const defaulters = p.arg.defaulters || []
    const baseShares = obls.filter(o => !defaulters.includes(o.arg.lp)).map(o => ({ _1: o.arg.lp, _2: o.arg.amountDue }))
    await exercise(role.base, token, role.party, SHORTFALL, p.cid, 'ApproveRecut', { baseShares })
    done('Re-split approved. Each investor sees only its own new share.')
  })
  const decline = (p) => run('decline', async () => {
    await exercise(role.base, token, role.party, SHORTFALL, p.cid, 'DeclineRecut', { reason: 'bank delay, not a default' })
    done('Re-split declined. Every share stays as it was.', 'info')
  })

  const feedback = (
    <>
      {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
      {actionError && (
        <Banner tone="error" title="The ledger rejected this action. Nothing changed."
          action={<Button variant="quiet" onClick={() => setActionError(null)}>Dismiss</Button>}>
          <details className="details"><summary>Technical detail</summary><code>{actionError}</code></details>
        </Banner>
      )}
      {snap.error && <Banner tone="warn" title="Showing the last data we had">This view couldn't refresh. <details className="details"><summary>Technical detail</summary><code>{snap.error}</code></details></Banner>}
    </>
  )

  return (
    <div className={`vp${snap.loading ? ' vp-refreshing' : ''}`}>
      {isGp ? (
        <FundView {...{ role, g, sum, obls, props, recuts, nameOf, data, busy, fundReceived, lockedTotal, allocs, feedback, settleAll, releaseAll, approve, decline }} />
      ) : (
        <InvestorView {...{ role, g, obls, recuts, cash, allocs, data, busy, feedback, allocate }} />
      )}
    </div>
  )
}

const CALL_STATUS = {
  open: { tone: 'neutral', icon: 'clock', label: 'Open' },
  locking: { tone: 'warn', icon: 'lock', label: 'Funds locking' },
  partial: { tone: 'ok', icon: 'check', label: 'Partly paid' },
  paid: { tone: 'ok', icon: 'check', label: 'Paid in full' },
}

function Meter({ total, paid, locked }) {
  const pct = v => (total > 0 ? Math.min(100, (v / total) * 100) : 0)
  return (
    <div className="meter" role="img" aria-label={`${money(paid)} paid and ${money(locked)} locked of ${money(total)}`}>
      <span className="meter-paid" style={{ width: `${pct(paid)}%` }} />
      <span className="meter-locked" style={{ width: `${pct(locked)}%` }} />
    </div>
  )
}

function FundView({ role, g, sum, obls, props, recuts, nameOf, data, busy, fundReceived, lockedTotal, allocs, feedback, settleAll, releaseAll, approve, decline }) {
  const isTheGp = role.key === 'gp'
  const cs = sum.status && CALL_STATUS[sum.status]
  return (
    <>
      {sum.call ? (
        <div className="hero">
          <div className="hero-top">
            <span className="hero-k">Capital call · {sum.call.arg.purpose}</span>
            <Badge tone={cs.tone} icon={cs.icon}>{cs.label}</Badge>
          </div>
          <div className="hero-v num">{money(sum.total)}</div>
          <Meter total={sum.total} paid={sum.paid} locked={lockedTotal} />
          <div className="legend">
            <span><i className="dot dot-ok" />{money(sum.paid)} paid in</span>
            <span><i className="dot dot-warn" />{money(lockedTotal)} locked</span>
            <span className="legend-of">{sum.lockers} of {obls.length} investors locked</span>
          </div>
        </div>
      ) : (
        <Empty title="No capital call on this server" />
      )}

      {data.out.last && <Stamp tx={data.out.last} />}
      {feedback}

      {fundReceived > 0 && <div className="received"><span>Fund received</span><span className="num">{money(fundReceived)}</span></div>}

      {!isTheGp && obls.length > 0 && (
        <Empty icon="lock" title="Settling is the GP’s job">Locked funds aren’t on the administrator’s server, so it can’t settle or release them.</Empty>
      )}
      {isTheGp && (allocs.length > 0 || obls.length > 0) && (
        <div className="actions">
          <div className="btns">
            <Button size="lg" disabled={!!busy || allocs.length === 0} loading={busy === 'settle'} onClick={settleAll}>
              {allocs.length ? `Settle ${money(lockedTotal)}` : 'Settle · nothing locked yet'}
            </Button>
            <Button size="lg" variant="ghost" disabled={!!busy || allocs.length === 0} loading={busy === 'release'} onClick={releaseAll}>Release all</Button>
          </div>
          <p className="hint">
            {allocs.length
              ? 'One transaction: every locked share moves to the fund, or none does. Release returns every lock and moves nothing.'
              : sum.paid > 0 ? 'Every locked share has been settled. Nothing else is locked right now.' : 'Investors lock funds from their own wallets. Nothing can be settled until someone does.'}
          </p>
        </div>
      )}

      {props.map(p => {
        const defaulters = p.arg.defaulters || []
        const extra = Object.fromEntries((p.arg.recuts || []).map(r => [r._1, Number(r._2)]))
        return (
          <div key={p.cid} className="decision">
            <div className="decision-head">
              <Badge tone="warn" icon="alert">{isTheGp ? 'Needs your decision' : 'Waiting on the GP'}</Badge>
              <h3>An investor missed the call</h3>
            </div>
            <Row label="Missing amount" value={money(p.arg.shortfall)} strong />
            <Row label="Missed by" sub="Only the fund's server knows this" value={defaulters.map(nameOf).join(', ')} />
            <div className="preview">
              <div className="preview-head"><span>If the GP re-splits it pro rata</span><span>Share → new share</span></div>
              {obls.filter(o => extra[o.arg.lp]).map(o => (
                <Row key={o.cid} label={nameOf(o.arg.lp)}
                  value={`${money(o.arg.amountDue)} → ${money(Number(o.arg.amountDue) + extra[o.arg.lp])}`} />
              ))}
              {Number(p.arg.unfunded) > 0 && <Row label="Still unfunded" value={money(p.arg.unfunded)} />}
            </div>
            {isTheGp && (
              <div className="btns">
                <Button disabled={!!busy} loading={busy === 'approve'} icon="split" onClick={() => approve(p)}>Approve re-split</Button>
                <Button variant="ghost" disabled={!!busy} loading={busy === 'decline'} onClick={() => decline(p)}>Decline, keep shares</Button>
              </div>
            )}
            <p className="hint">Investors never learn who missed the call. Each sees only its own new share.</p>
          </div>
        )
      })}

      {recuts.length > 0 && (
        <Section title="Re-split shares" aside={<Badge tone="ok" icon="check">Approved</Badge>}>
          {recuts.map(r => <Row key={r.cid} label={nameOf(r.arg.lp)} sub={`+${money(r.arg.extraDue)}`} value={money(r.arg.newTotal)} />)}
        </Section>
      )}

      <Section title="Investors’ shares" aside={<span className="count num">{obls.length}</span>}>
        {obls.length === 0 ? <Empty title="No shares on this server" /> : obls.map(o => (
          <Row key={o.cid} label={nameOf(o.arg.lp)} value={money(o.arg.amountDue)}
            badge={isTheGp ? <StatusBadge status={shareStatus(o.arg.lp, g, data.out)} /> : null} />
        ))}
        {!isTheGp && obls.length > 0 && <p className="hint">Lock status isn’t on the administrator’s server.</p>}
      </Section>
    </>
  )
}

function InvestorView({ role, g, obls, recuts, cash, allocs, data, busy, feedback, allocate }) {
  const mine = obls.filter(o => o.arg.lp === role.party)
  const wallet = cash.reduce((s, c) => s + Number(c.arg.amount), 0)
  const lockedTotal = allocs.reduce((s, a) => s + Number(a.arg.amount), 0)
  const status = shareStatus(role.party, g, data.out)
  return (
    <>
      {mine.length === 0 ? <Empty title="No share in this call on this server" /> : mine.map(o => (
        <div key={o.cid} className="hero">
          <div className="hero-top"><span className="hero-k">Your share of the call</span><StatusBadge status={status} /></div>
          <div className="hero-v num">{money(o.arg.amountDue)}</div>
          <div className="legend"><span className="legend-of">of a {money(o.arg.callTotal)} call</span><span>Wallet {money(wallet)}</span>{lockedTotal > 0 && <span><i className="dot dot-warn" />{money(lockedTotal)} locked</span>}</div>
        </div>
      ))}

      {data.out.last && <Stamp tx={data.out.last} />}
      {feedback}

      {mine.map(o => {
        if (status === 'locked') return (
          <div key={o.cid} className="locked">
            <Icon name="lock" size={18} />
            <div><div className="locked-title">{money(lockedTotal)} locked to this call</div>
              <div className="locked-text">Still in your wallet. It moves only if the GP settles; otherwise it’s released.</div></div>
          </div>
        )
        if (status === 'paid') return <Banner key={o.cid} tone="ok" title="Paid in">Your {money(o.arg.amountDue)} moved to the fund in the call’s single settlement transaction.</Banner>
        if (!cash.length) return <Empty key={o.cid} icon="lock" title="No funds on this server">This investor’s wallet holds no cash here, so it can’t lock its share.</Empty>
        return (
          <div key={o.cid} className="actions">
            <Button size="lg" full icon="lock" disabled={!!busy} loading={busy === 'allocate'} onClick={() => allocate(o, cash[0])}>
              Lock {money(o.arg.amountDue)}
            </Button>
            <p className="hint">The money stays in your wallet until the GP settles. If the call doesn’t settle, it’s released.</p>
          </div>
        )
      })}

      {recuts.map(r => (
        <Banner key={r.cid} tone="warn" title={`Your share went up by ${money(r.arg.extraDue)}`}>
          New share: <span className="num">{money(r.arg.newTotal)}</span>. Another investor missed the call, and the GP approved re-splitting the missing amount pro rata.
        </Banner>
      ))}

      <Empty title="Not on this server">Other investors’ shares, and who has or hasn’t paid, are never sent to this investor’s server.</Empty>
    </>
  )
}
