// Canton JSON Ledger API v2 client.

export async function loadConfig() {
  const r = await fetch('/demo-config.json')
  if (!r.ok) throw new Error('demo-config.json not found; run scripts/gen-frontend-config.sh')
  return r.json()
}

async function ledgerEnd(base, token) {
  const r = await fetch(`${base}/v2/state/ledger-end`, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`ledger-end ${r.status}: ${await r.text()}`)
  return (await r.json()).offset
}

// The template's short name, e.g. "LedgerCall.Call:CallObligation", from either the
// package-id form ("<hash>:Module:Entity") or the package-name form ("#name:Module:Entity").
export function shortTemplate(tpl) {
  const p = tpl.split(':')
  return `${p[p.length - 2]}:${p[p.length - 1]}`
}

// Active contracts visible to a party.
export async function activeFor(base, token, party) {
  const offset = await ledgerEnd(base, token)
  const body = {
    filter: { filtersByParty: { [party]: { cumulative: [{ identifierFilter: { WildcardFilter: { value: { includeCreatedEventBlob: false } } } }] } } },
    verbose: false,
    activeAtOffset: offset,
  }
  const r = await fetch(`${base}/v2/state/active-contracts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`active-contracts ${r.status}: ${await r.text()}`)
  const arr = await r.json()
  return arr
    .map(e => e.contractEntry?.JsActiveContract?.createdEvent)
    .filter(Boolean)
    .map(ce => ({ cid: ce.contractId, tpl: shortTemplate(ce.templateId), arg: ce.createArgument, offset: ce.offset }))
}

// A party's own transaction history after `beginExclusive`, read-only. Uses the
// ledger-effects shape so exercised choices are named (e.g. Allocation_ExecuteTransfer).
export async function historyFor(base, token, party, beginExclusive) {
  const end = await ledgerEnd(base, token)
  if (end <= beginExclusive) return []
  const filtersByParty = { [party]: { cumulative: [{ identifierFilter: { WildcardFilter: { value: { includeCreatedEventBlob: false } } } }] } }
  const body = {
    beginExclusive,
    endInclusive: end,
    updateFormat: { includeTransactions: { eventFormat: { filtersByParty, verbose: false }, transactionShape: 'TRANSACTION_SHAPE_LEDGER_EFFECTS' } },
  }
  const r = await fetch(`${base}/v2/updates?limit=1000`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`updates ${r.status}: ${await r.text()}`)
  const arr = await r.json()
  return arr
    .map(u => u.update?.Transaction?.value)
    .filter(Boolean)
    .map(tx => ({
      updateId: tx.updateId,
      offset: tx.offset,
      at: tx.effectiveAt,
      events: tx.events.map(e => {
        const [kind, v] = Object.entries(e)[0]
        return { kind, cid: v.contractId, tpl: shortTemplate(v.templateId), choice: v.choice, arg: v.createArgument }
      }),
    }))
}

// Token-standard Allocation interface id and empty extra-args.
export const ALLOC_IFACE = '#splice-api-token-allocation-v1:Splice.Api.Token.AllocationV1:Allocation'
export const EXTRA = { context: { values: {} }, meta: { values: {} } }

export const exerciseCmd = (templateId, contractId, choice, choiceArgument) =>
  ({ ExerciseCommand: { templateId, contractId, choice, choiceArgument } })

// Submit commands as one or more parties in a single transaction.
export async function submit(base, token, actAs, commands) {
  const body = {
    commands,
    commandId: `ui-${Date.now()}`,
    actAs,
    readAs: [],
    applicationId: 'ledgercall-ui',
  }
  const r = await fetch(`${base}/v2/commands/submit-and-wait`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`submit ${r.status}: ${await r.text()}`)
  return r.json()
}

// Convenience: exercise one choice as a single party.
export async function exercise(base, token, actAs, templateId, contractId, choice, choiceArgument) {
  return submit(base, token, [actAs], [exerciseCmd(templateId, contractId, choice, choiceArgument)])
}

// Group a party's contracts by template short-name.
export function byTemplate(contracts) {
  const g = {}
  for (const c of contracts) (g[c.tpl] ??= []).push(c)
  return g
}

export const short = p => (p ? p.split('::')[0] : '')
export const money = d => '$' + Number(d).toLocaleString('en-US', { maximumFractionDigits: 0 })
