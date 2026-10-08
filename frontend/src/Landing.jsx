// Landing page. Every number is the live demo's seed data, and every claim comes from
// README.md, WHY-CANTON.md or HONEST-GAPS.md.
import React, { useEffect, useRef, useState } from 'react'
import { Badge, Icon } from './ui.jsx'
import './landing.css'

const DEMO = '/demo'
const INVESTORS = ['LP #1', 'LP #2', 'LP #3', 'LP #4', 'LP #5', 'LP #6']
const MISSER = 5 // LP #6 never locks: it is the investor who misses the call

// One entry per scroll step: what the stage shows and what each investor chip says.
const STEPS = [
  {
    key: 'call', kicker: '01 · The call',
    title: 'The GP calls $3,000,000.',
    text: 'Six investors each owe $500,000. Each one is told its own share, and only its own share.',
    fund: { label: 'Capital call', value: '$3,000,000', note: '6 investors · $500,000 each' },
    chip: () => ({ state: 'called', note: '$500,000 due' }),
  },
  {
    key: 'lock', kicker: '02 · No wires',
    title: 'Investors lock funds. They don’t wire them.',
    text: 'Each investor locks its share inside its own wallet. Nobody holds the money in between. If the call doesn’t settle, the lock is released and the money never left.',
    fund: { label: 'Locked so far', value: '$2,500,000', note: '5 of 6 investors' },
    chip: i => (i === MISSER ? { state: 'called', note: 'not locked' } : { state: 'locked', note: '$500,000 locked' }),
  },
  {
    key: 'settle', kicker: '03 · All or nothing',
    title: 'One transaction moves every share.',
    text: 'The GP settles every locked share at once. Canton confirms it with each investor’s own server, so there is no moment where half the call has paid.',
    fund: { label: 'Fund received', value: '$2,500,000', note: 'in 1 transaction' },
    tx: 'Settled in one transaction',
    chip: i => (i === MISSER ? { state: 'called', note: 'not locked' } : { state: 'paid', note: 'paid in' }),
  },
  {
    key: 'release', kicker: '03b · Or none',
    title: 'Or the GP releases them all, and nothing moves.',
    text: 'After the deadline, nobody can settle around a missing investor. Releasing returns every lock in one transaction. Not one dollar reaches the fund.',
    fund: { label: 'Fund received', value: '$0', note: 'every lock returned' },
    tx: 'Released in one transaction',
    chip: i => (i === MISSER ? { state: 'called', note: 'not locked' } : { state: 'released', note: 'back in wallet' }),
  },
  {
    key: 'default', kicker: '04 · The default',
    title: 'Someone misses. The GP decides.',
    text: 'The software works out the re-split: the missing $500,000 shared pro rata, capped by each investor’s unused commitment. A person decides whether to run it. We automate the arithmetic, not the judgement.',
    fund: { label: 'Missing amount', value: '$500,000', note: 'GP: approve or decline' },
    decision: true,
    chip: i => (i === MISSER ? { state: 'missed', note: 'missed the call' } : { state: 'resplit', note: '+$100,000 share' }),
  },
]

function useActiveStep(count) {
  const refs = useRef([])
  const [active, setActive] = useState(0)
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(Number(e.target.dataset.step)) })
    }, { rootMargin: '-45% 0px -45% 0px' })
    refs.current.slice(0, count).forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [count])
  return [active, (i) => (el) => { refs.current[i] = el }]
}

function Stage({ step }) {
  const s = STEPS[step]
  return (
    <div className={`stage stage-${s.key}`} aria-hidden="true">
      <div className="stage-fund">
        <span className="stage-fund-k">{s.fund.label}</span>
        <span className="stage-fund-v num" key={s.fund.value}>{s.fund.value}</span>
        <span className="stage-fund-note">{s.fund.note}</span>
      </div>
      <div className={`stage-tx${s.tx ? ' on' : ''}${s.key === 'release' ? ' release' : ''}`}>
        <Icon name={s.key === 'release' ? 'undo' : 'check'} size={14} />{s.tx || 'One transaction'}
      </div>
      <div className="stage-grid">
        {INVESTORS.map((name, i) => {
          const c = s.chip(i)
          return (
            <div key={name} className={`chip chip-${c.state}`} style={{ '--i': i }}>
              <span className="chip-name">{name}</span>
              <span className="chip-note">{c.note}</span>
              <span className="chip-icon">
                <Icon name={{ called: 'clock', locked: 'lock', paid: 'check', released: 'undo', missed: 'alert', resplit: 'split' }[c.state]} size={14} />
              </span>
            </div>
          )
        })}
      </div>
      <div className={`stage-decision${s.decision ? ' on' : ''}`}>
        <span className="fake-btn primary">Approve re-split</span>
        <span className="fake-btn">Decline, keep shares</span>
      </div>
    </div>
  )
}

// The product in one picture: two servers, two different views, one shared transaction.
function HeroVisual() {
  return (
    <div className="hv" aria-hidden="true">
      <div className="hv-card hv-fund">
        <div className="hv-head"><Icon name="server" size={14} />Fund’s server<span>sees 6</span></div>
        {INVESTORS.map((name, i) => (
          <div key={name} className="hv-row" style={{ '--i': i }}>
            <span>{name}</span>
            {i === MISSER ? <Badge tone="bad" icon="alert">Missed</Badge> : <Badge tone="ok" icon="check">Paid</Badge>}
            <span className="num">$500,000</span>
          </div>
        ))}
      </div>
      <div className="hv-stamp"><Icon name="check" size={14} />Same transaction on both servers</div>
      <div className="hv-card hv-lp">
        <div className="hv-head"><Icon name="server" size={14} />LP #2’s server<span>sees 1</span></div>
        <div className="hv-k">Your share</div>
        <div className="hv-v num">$500,000 <Badge tone="ok" icon="check">Paid</Badge></div>
        <div className="hv-hidden"><Icon name="eyeOff" size={14} />Other investors: not on this server</div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [active, stepRef] = useActiveStep(STEPS.length)
  useEffect(() => { document.title = 'LEDGERCALL · capital calls that settle in one transaction' }, [])

  return (
    <div className="landing">
      <a className="skip" href="#main">Skip to content</a>
      <nav className="nav" aria-label="Main">
        <a className="wordmark" href="/">LEDGERCALL</a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#privacy">Privacy</a>
          <a href="#proof">Proof</a>
          <a className="btn btn-primary" href={DEMO}>Open the live demo</a>
        </div>
      </nav>

      <main id="main">
        <header className="l-hero">
          <div className="l-hero-copy">
          <Badge tone="accent" icon="server">Built on Canton · HackCanton Season 3</Badge>
          <h1 className="l-title">What happens when an investor <span className="l-em">doesn’t pay</span>?</h1>
          <p className="l-lede">
            LEDGERCALL runs a private-fund capital call where investors never wire money.
            The call settles in one transaction or not at all. When someone misses, the GP
            decides what happens next, and every investor sees only its own number.
          </p>
          <div className="l-ctas">
            <a className="btn btn-primary btn-lg" href={DEMO}>Open the live demo <span aria-hidden="true">→</span></a>
            <a className="btn btn-ghost btn-lg" href="#how">See how it works</a>
          </div>
          <dl className="l-facts">
            <div><dt>Settlement</dt><dd>1 transaction</dd></div>
            <div><dt>Wires</dt><dd>0</dd></div>
            <div><dt>What each investor sees</dt><dd>its own share</dd></div>
          </dl>
          </div>
          <HeroVisual />
        </header>

        <section className="l-problem" aria-labelledby="problem-title">
          <h2 id="problem-title" className="l-h2">A capital call today is a wire instruction.</h2>
          <div className="problem-grid">
            <p>Every investor wires its share on its own schedule. The money arrives piece by piece.</p>
            <p>If one investor doesn’t pay, the fund holds part of the money and a deal to close, with no clean way to give it back.</p>
            <p>A partly funded call is the failure the market actually complains about. LEDGERCALL makes it impossible.</p>
          </div>
        </section>

        <section id="how" className="story" aria-labelledby="how-title">
          <h2 id="how-title" className="l-h2 story-title">How a call runs on LEDGERCALL</h2>
          <p className="story-sub">Numbers from the live demo.</p>
          <div className="story-grid">
            <div className="story-stage"><Stage step={active} /></div>
            <ol className="story-steps">
              {STEPS.map((s, i) => (
                <li key={s.key} ref={stepRef(i)} data-step={i} className={`story-step${i === active ? ' active' : ''}`}>
                  <span className="story-kicker">{s.kicker}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privacy" className="l-privacy" aria-labelledby="privacy-title">
          <div className="l-section-head">
            <span className="l-kicker">Privacy, proven</span>
            <h2 id="privacy-title" className="l-h2">Same question. Two servers. Different answers.</h2>
            <p className="l-sub">
              We ran the same database query on the fund’s server and on one investor’s server.
              Canton never sent the investor anything it isn’t part of. The app enforces none of this; the protocol does.
            </p>
          </div>
          <div className="query-grid">
            {[
              { who: 'Fund’s server', node: 'app-provider', rows: [['Investors’ shares visible', '6'], ['Who missed the call', 'visible']] },
              { who: 'Investor’s server', node: 'app-user', rows: [['Investors’ shares visible', '1'], ['Who missed the call', 'not there']] },
            ].map(q => (
              <figure key={q.who} className="query">
                <figcaption><Icon name="server" size={14} />{q.who}<span className="query-node">{q.node}</span></figcaption>
                <code className="query-sql">SELECT count(*) FROM active('…:CallObligation')</code>
                {q.rows.map(([k, v]) => (
                  <div key={k} className="query-row"><span>{k}</span><strong className="num">{v}</strong></div>
                ))}
              </figure>
            ))}
          </div>
          <p className="l-note">
            <strong>The honest limit:</strong> an investor can roughly work out how big the shortfall was, because it knows the
            call total and its own new share. It cannot learn who missed, or how many did.
          </p>
        </section>

        <section className="l-why" aria-labelledby="why-title">
          <div className="l-section-head">
            <span className="l-kicker">Why Canton</span>
            <h2 id="why-title" className="l-h2">Three things this needs that most chains don’t give you.</h2>
          </div>
          <div className="why-grid">
            <article className="why">
              <Icon name="lock" size={20} />
              <h3>Settles money it never issued</h3>
              <p>Investors’ cash can sit in any wallet that follows Canton’s token standard. The settlement code imports only the standard’s interfaces, and it settled real Canton Coin unchanged.</p>
            </article>
            <article className="why">
              <Icon name="check" size={20} />
              <h3>All or nothing is the ledger’s job</h3>
              <p>Every share settles inside one Daml transaction, confirmed by each investor’s own server. If one confirmation fails, the whole call aborts. We didn’t write that guarantee; Canton gives it.</p>
            </article>
            <article className="why">
              <Icon name="eyeOff" size={20} />
              <h3>Privacy by protocol</h3>
              <p>Canton splits each transaction into views, and a server receives only the views its parties are in. Investor #4 never receives investor #17’s commitment, obligation, or default.</p>
            </article>
          </div>
        </section>

        <section id="proof" className="l-proof" aria-labelledby="proof-title">
          <div className="l-section-head">
            <span className="l-kicker">Checked, not claimed</span>
            <h2 id="proof-title" className="l-h2">Every claim on this page has evidence in the repo.</h2>
          </div>
          <div className="proof-list">
            {[
              ['8 of 8 ledger tests pass', 'Privacy between investors, the re-split maths, atomic settlement, and “one short, nothing moves”.', 'daml/LedgerCall/Test*.daml'],
              ['Privacy holds across two servers', 'The same query returns 6 shares on the fund’s database and 1 on the investor’s.', 'docs/evidence/privacy-proof.md'],
              ['Settles real Canton Coin', '100 Canton Coin, an asset this app never issued, locked through Canton Coin’s own registry and settled by LEDGERCALL.', 'docs/evidence/canton-coin-proof.md'],
              ['Atomic settle, live', 'The GP settles every share in one transaction, or releases every lock and the fund gets $0.', 'docs/evidence/settlement-proof.md'],
            ].map(([t, d, f]) => (
              <div key={t} className="proof-item">
                <Icon name="check" size={16} className="proof-icon" />
                <div><div className="proof-title">{t}</div><div className="proof-text">{d}</div><code>{f}</code></div>
              </div>
            ))}
          </div>
        </section>

        <section className="l-scope" aria-labelledby="scope-title">
          <h2 id="scope-title" className="l-h3">What we don’t claim</h2>
          <ul>
            <li><strong>Deadlines don’t fire themselves.</strong> After the deadline, nothing can stop a release and nobody can settle around a missing investor, but someone still has to send the release.</li>
            <li><strong>Privacy ends at the investor of record.</strong> Behind a feeder fund, the feeder is one investor.</li>
            <li><strong>The multi-investor demo uses our own test currency</strong> to fund many investors easily. The same settlement path is proven with real Canton Coin.</li>
          </ul>
        </section>

        <section className="l-final" aria-labelledby="final-title">
          <h2 id="final-title" className="l-h2">Watch the fund and an investor, side by side.</h2>
          <p className="l-sub">Every button in the demo is a real transaction on a live Canton network.</p>
          <a className="btn btn-primary btn-lg" href={DEMO}>Open the live demo <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <footer className="l-footer">
        <span className="wordmark">LEDGERCALL</span>
        <span>Built for HackCanton Season 3 · Track 3, Investment Infrastructure</span>
      </footer>
    </div>
  )
}
