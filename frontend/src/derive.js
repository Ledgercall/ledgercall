// Display-only derivations over ONE party's own data: its active contracts plus its own
// transaction history. Nothing here reads another party's view, so every status a pane
// shows is something that party's server actually holds.

export const T = {
  call: 'LedgerCall.Call:CapitalCall',
  obl: 'LedgerCall.Call:CallObligation',
  prop: 'LedgerCall.Cascade:ShortfallProposal',
  recut: 'LedgerCall.Cascade:RecutObligation',
  cash: 'LedgerCall.TestRegistry:LedgerCallCash',
  alloc: 'LedgerCall.TestRegistry:LedgerCallCashAllocation',
}

const PAY = 'Allocation_ExecuteTransfer'
const RELEASE = 'Allocation_Withdraw'

// The earliest offset of the current call's contracts; history before it belongs to
// earlier demo runs (re-seeding reuses the same call id).
export function historyStart(groups) {
  const offs = [...(groups[T.obl] || []), ...(groups[T.call] || [])].map(c => c.offset).filter(o => o != null)
  return offs.length ? Math.min(...offs) - 1 : null
}

// Settlement outcomes found in this party's history: each allocation it saw being
// paid out or released, grouped by the transaction that did it.
export function outcomes(history) {
  const allocArgs = {}
  for (const tx of history) for (const e of tx.events)
    if (e.kind === 'CreatedEvent' && e.tpl === T.alloc) allocArgs[e.cid] = e.arg
  const perAlloc = []
  const txs = []
  for (const tx of history) {
    const legs = []
    for (const e of tx.events) {
      if (e.kind !== 'ExercisedEvent' || (e.choice !== PAY && e.choice !== RELEASE)) continue
      const a = allocArgs[e.cid]
      const leg = { kind: e.choice === PAY ? 'paid' : 'released', owner: a?.owner, amount: Number(a?.amount || 0), updateId: tx.updateId, at: tx.at }
      legs.push(leg); perAlloc.push(leg)
    }
    if (legs.length) txs.push({ updateId: tx.updateId, at: tx.at, offset: tx.offset, kind: legs[0].kind, legs })
  }
  return { perAlloc, txs, last: txs[txs.length - 1] || null }
}

// Status of one investor's share, from what this pane can see.
//   Locked   - an active allocation owned by the investor
//   Paid     - its allocation was paid out in a settlement this party saw
//   Released - its allocation was released and nothing moved
//   Awaiting - none of the above
export function shareStatus(lp, groups, out) {
  if ((groups[T.alloc] || []).some(a => a.arg.owner === lp)) return 'locked'
  const legs = out.perAlloc.filter(l => l.owner === lp)
  const last = legs[legs.length - 1]
  return last ? last.kind : 'awaiting'
}

// The GP's decision on a re-split, if this party saw one: 'approved' | 'declined' | null.
export function recutDecision(history) {
  for (const tx of [...history].reverse()) for (const e of tx.events) {
    if (e.kind !== 'ExercisedEvent') continue
    if (e.choice === 'ApproveRecut') return 'approved'
    if (e.choice === 'DeclineRecut') return 'declined'
  }
  return null
}

// Number of this app's contracts a party's server holds (the privacy comparison).
export const recordCount = groups => Object.values(T).reduce((n, t) => n + (groups[t]?.length || 0), 0)

export function callSummary(groups, out) {
  const call = (groups[T.call] || [])[0]
  const total = call ? Number(call.arg.totalAmount) : 0
  const locked = (groups[T.alloc] || []).reduce((s, a) => s + Number(a.arg.amount), 0)
  const lockers = new Set((groups[T.alloc] || []).map(a => a.arg.owner)).size
  const paid = out.perAlloc.filter(l => l.kind === 'paid').reduce((s, l) => s + l.amount, 0)
  const status = !call ? null : paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : locked > 0 ? 'locking' : 'open'
  return { call, total, locked, lockers, paid, status }
}
