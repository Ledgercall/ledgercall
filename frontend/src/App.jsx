import React, { useEffect, useState } from 'react'
import { loadConfig, activeFor, exercise, submit, exerciseCmd, byTemplate, short, money, ALLOC_IFACE, EXTRA } from './ledger.js'

const SHORTFALL = '#ledgercall:LedgerCall.Cascade:ShortfallProposal'
const CASH = '#ledgercall:LedgerCall.TestRegistry:LedgerCallCash'
const T_OBL = 'LedgerCall.Call:CallObligation'
const T_CALL = 'LedgerCall.Call:CapitalCall'
const T_PROP = 'LedgerCall.Cascade:ShortfallProposal'
const T_RECUT = 'LedgerCall.Cascade:RecutObligation'
const T_CASH = 'LedgerCall.TestRegistry:LedgerCallCash'
const T_ALLOC = 'LedgerCall.TestRegistry:LedgerCallCashAllocation'
const participantOf = base => (base === '/au' ? 'app-user' : 'app-provider')

export default function App() {
  const [cfg, setCfg] = useState(null)
  const [err, setErr] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [left, setLeft] = useState('gp')
  const [right, setRight] = useState('lp0')
  const [banner, setBanner] = useState({
    tone: 'intro',
    text: 'A capital call today is a wire instruction. If one LP doesn’t pay, the fund holds part of the money with no way to unwind it.',
  })

  useEffect(() => { loadConfig().then(setCfg).catch(e => setErr(String(e))) }, [])
  if (err) return <div className="fatal">{err}</div>
  if (!cfg) return <div className="boot">loading<span className="dots">…</span></div>

  const roles = {
    gp: { key: 'gp', ...cfg.gp },
    admin: { key: 'admin', ...cfg.admin },
    ...Object.fromEntries(cfg.lps.map((l, i) => [`lp${i}`, { key: `lp${i}`, ...l }])),
  }
  const onAction = (text, tone = 'info') => { setBanner({ text, tone }); setRefreshKey(k => k + 1) }

  return (
    <div className="app">
      <div className="grain" aria-hidden />
      <header className="hero">
        <div className="eyebrow"><span className="live" /> Canton Network</div>
        <h1 className="display">
          A capital call where LPs never wire money.<br />
          <span className="accent">It settles in one transaction, or not at all.</span>
        </h1>
        <p className="lede">
          Each LP locks funds in its own wallet. The GP settles every leg in a single
          transaction, or the deadline releases them all. No LP can see another’s position.
        </p>
      </header>

      <div className="payoff-wrap">
        <div key={banner.text} className={`payoff ${banner.tone}`}>
          <span className="payoff-dot" />
          <span>{banner.text}</span>
        </div>
      </div>

      <ol className="rail">
        {[
          ['01', 'GP issues the call'],
          ['02', 'LPs allocate from their own wallet'],
          ['03', 'Settle, or release at the deadline'],
          ['04', 'On default, GP re-cuts'],
        ].map(([n, t]) => (
          <li key={n}><span className="num">{n}</span>{t}</li>
        ))}
      </ol>

      <div className="split">
        <PaneColumn side="A" roles={roles} selected={left} onSelect={setLeft} token={cfg.token} refreshKey={refreshKey} onAction={onAction} />
        <div className="seam" aria-hidden />
        <PaneColumn side="B" roles={roles} selected={right} onSelect={setRight} token={cfg.token} refreshKey={refreshKey} onAction={onAction} />
      </div>
      <p className="contrast">Each party sees only the contracts it is a party to.</p>

      <div className="proofs">
        <Proof label="8/8 Daml tests pass" sub="privacy, waterfall, atomic settlement" />
        <Proof label="Privacy" sub="verified across two PQS databases" href="privacy-proof" />
        <Proof label="Canton Coin" sub="settles real Canton Coin via the token standard" href="canton-coin-proof" />
      </div>
    </div>
  )
}

function Proof({ label, sub, href }) {
  return (
    <div className="proof">
      <div className="proof-check">✓</div>
      <div>
        <div className="proof-label">{label}</div>
        <div className="proof-sub">{sub}{href ? <> · <code>docs/evidence/{href}.md</code></> : null}</div>
      </div>
    </div>
  )
}

function PaneColumn({ side, roles, selected, onSelect, token, refreshKey, onAction }) {
  const role = roles[selected]
  const p = participantOf(role.base)
  return (
    <div className="pane">
      <div className="pane-head">
        <span className="view-tag">VIEW {side}</span>
        <div className="select-wrap">
          <select value={selected} onChange={e => onSelect(e.target.value)}>
            {Object.values(roles).map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <span className={`node ${p}`} title={p}><span className="node-dot" />{p}</span>
      </div>
      <Viewport role={role} token={token} refreshKey={refreshKey} onAction={onAction} />
    </div>
  )
}

function Viewport({ role, token, refreshKey, onAction }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    setError(null)
    activeFor(role.base, token, role.party)
      .then(cs => { if (live) setData(byTemplate(cs)) })
      .catch(e => { if (live) setError(String(e)) })
    return () => { live = false }
  }, [role.party, role.base, token, refreshKey])

  if (error) return <div className="vp"><p className="err">{error}</p></div>
  if (!data) return <div className="vp"><p className="muted">loading…</p></div>

  const calls = data[T_CALL] || []
  const obls = data[T_OBL] || []
  const props = data[T_PROP] || []
  const recuts = data[T_RECUT] || []
  const cash = data[T_CASH] || []
  const allocs = data[T_ALLOC] || []
  const isLp = role.key.startsWith('lp')
  const isGp = role.key === 'gp' || role.key === 'admin'

  const fundReceived = cash.filter(c => c.arg.owner === role.party).reduce((s, c) => s + Number(c.arg.amount), 0)
  const lockedTotal = allocs.reduce((s, a) => s + Number(a.arg.amount), 0)
  const funders = new Set(allocs.map(a => a.arg.owner)).size

  const run = async (fn) => { setBusy(true); try { await fn() } catch (e) { setError(String(e)) } finally { setBusy(false) } }

  const allocate = (obl, cashC) => run(async () => {
    const o = obl.arg
    const settlement = { executor: o.gp, settlementRef: { id: o.callId, cid: null }, requestedAt: o.allocateBefore, allocateBefore: o.allocateBefore, settleBefore: o.settleBefore, meta: { values: {} } }
    await exercise(role.base, token, role.party, CASH, cashC.cid, 'Cash_Allocate',
      { executor: o.gp, receiver: o.gp, settlement, transferLegId: `${o.callId}-${short(o.lp)}`, allocAmount: o.amountDue })
    onAction(`${role.label} locked ${money(o.amountDue)} from its own wallet.`, 'lock')
  })

  const settleAll = () => run(async () => {
    const liveAllocs = (await activeFor(role.base, token, role.party)).filter(c => c.tpl === T_ALLOC)
    if (!liveAllocs.length) return onAction('No funds allocated yet.', 'info')
    const owners = [...new Set(liveAllocs.map(a => a.arg.owner))]
    const total = liveAllocs.reduce((s, a) => s + Number(a.arg.amount), 0)
    await submit(role.base, token, [role.party, ...owners], liveAllocs.map(a => exerciseCmd(ALLOC_IFACE, a.cid, 'Allocation_ExecuteTransfer', { extraArgs: EXTRA })))
    onAction(`Fund received ${money(total)} in one transaction.`, 'settle')
  })

  const releaseAll = () => run(async () => {
    const liveAllocs = (await activeFor(role.base, token, role.party)).filter(c => c.tpl === T_ALLOC)
    if (!liveAllocs.length) return onAction('Nothing allocated to release.', 'info')
    const owners = [...new Set(liveAllocs.map(a => a.arg.owner))]
    const total = liveAllocs.reduce((s, a) => s + Number(a.arg.amount), 0)
    await submit(role.base, token, owners, liveAllocs.map(a => exerciseCmd(ALLOC_IFACE, a.cid, 'Allocation_Withdraw', { extraArgs: EXTRA })))
    onAction(`${money(total)} released. No funds moved to the fund.`, 'release')
  })

  const approve = (p) => run(async () => {
    const defaulters = p.arg.defaulters || []
    const baseShares = obls.filter(o => !defaulters.includes(o.arg.lp)).map(o => ({ _1: o.arg.lp, _2: o.arg.amountDue }))
    await exercise(role.base, token, role.party, SHORTFALL, p.cid, 'ApproveRecut', { baseShares })
    onAction('Re-cut approved. Each LP sees only its own revised figure.', 'recut')
  })
  const decline = (p) => run(async () => {
    await exercise(role.base, token, role.party, SHORTFALL, p.cid, 'DeclineRecut', { reason: 'bank delay, not a default' })
    onAction('Re-cut declined. No positions changed.', 'recut')
  })

  return (
    <div className="vp">
      {isGp && fundReceived > 0 && (
        <div className="received">
          <span className="received-k">fund received</span>
          <span className="received-v">{money(fundReceived)}</span>
        </div>
      )}

      {calls.length > 0 ? (
        <section>
          <h3>Capital call</h3>
          {calls.map(c => (
            <div key={c.cid} className="line">
              <span className="line-k">{c.arg.purpose}</span>
              <span className="num-lg">{money(c.arg.totalAmount)}</span>
              <span className="state open">{c.arg.status.replace('Call', '')}</span>
            </div>
          ))}
        </section>
      ) : isLp && (
        <section><h3>Capital call</h3><p className="blind">not visible to this party</p></section>
      )}

      <section>
        <h3>Obligations {obls.length > 0 && <span className="count">{obls.length}</span>}</h3>
        {obls.length === 0 ? <p className="blind">none visible</p> :
          <table><tbody>{obls.map(o => (
            <tr key={o.cid}><td className="mono dim">{short(o.arg.lp)}</td><td className="num">{money(o.arg.amountDue)}</td></tr>
          ))}</tbody></table>}
      </section>

      {isGp && (allocs.length > 0 || obls.length > 0) && (
        <section className="controls">
          <div className="fundbar">
            <span>{funders} of {obls.length} LPs allocated</span>
            <span className="num lock-c">{money(lockedTotal)} locked</span>
          </div>
          <div className="btns">
            <button disabled={busy || allocs.length === 0} className="btn settle" onClick={settleAll}>Settle call</button>
            <button disabled={busy || allocs.length === 0} className="btn release" onClick={releaseAll}>Release</button>
          </div>
        </section>
      )}

      {isLp && (cash.length > 0 || allocs.length > 0) && (
        <section className="controls">
          <h3>Funds</h3>
          {allocs.length > 0
            ? allocs.map(a => (
              <div key={a.cid} className="line locked">
                <span className="line-k">locked to the call</span>
                <span className="num">{money(a.arg.amount)}</span>
              </div>))
            : obls.filter(o => o.arg.lp === role.party).map(o => (
              <button key={o.cid} disabled={busy || cash.length === 0} className="btn lock full" onClick={() => allocate(o, cash[0])}>
                Allocate {money(o.arg.amountDue)}
              </button>))}
          {cash.length > 0 && <div className="line"><span className="line-k">wallet balance</span><span className="num dim">{money(cash.reduce((s, c) => s + Number(c.arg.amount), 0))}</span></div>}
        </section>
      )}

      {props.length > 0 && (
        <section className="proposal">
          <h3>Default: re-cut proposed</h3>
          {props.map(p => (
            <div key={p.cid}>
              <div className="line"><span className="line-k">shortfall</span><span className="num">{money(p.arg.shortfall)}</span></div>
              <div className="line"><span className="line-k">defaulter</span><span className="mono danger" title={(p.arg.defaulters || []).join(', ')}>{(p.arg.defaulters || []).map(short).join(', ')}</span></div>
              {role.key === 'gp' && <div className="btns">
                <button disabled={busy} className="btn settle" onClick={() => approve(p)}>Approve</button>
                <button disabled={busy} className="btn decline" onClick={() => decline(p)}>Decline</button>
              </div>}
            </div>
          ))}
        </section>
      )}

      {recuts.length > 0 && (
        <section>
          <h3>Your re-cut</h3>
          <table><tbody>{recuts.map(r => (
            <tr key={r.cid}><td className="dim">+{money(r.arg.extraDue)}</td><td className="num recut-c">{money(r.arg.newTotal)}</td></tr>
          ))}</tbody></table>
        </section>
      )}
    </div>
  )
}
