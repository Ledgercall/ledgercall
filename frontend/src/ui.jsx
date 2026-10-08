// UI primitives. Styling lives in styles.css (classes) and tokens.css (values).
import React, { useId } from 'react'

const PATHS = {
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 8v5m0 3.5v.5M10.3 3.9L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  server: 'M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01',
  eyeOff: 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3.1 4.3M6.6 6.6C4.5 8 3 10 2 12c1 2.5 5 7 10 7a9.8 9.8 0 0 0 4.4-1',
  split: 'M6 3v6a6 6 0 0 0 6 6 6 6 0 0 1 6 6M18 3v6a6 6 0 0 1-3 5.2',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
}

export function Icon({ name, size = 16, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  )
}

// variant: primary | ghost | danger | quiet · size: md | lg
export function Button({ variant = 'primary', size = 'md', loading = false, full = false, icon, children, disabled, ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size}${full ? ' btn-full' : ''}`} disabled={disabled || loading}
      aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      <span>{children}</span>
    </button>
  )
}

// tone: neutral | ok | warn | bad | accent. Always a word plus an icon, never colour alone.
export function Badge({ tone = 'neutral', icon, children }) {
  return <span className={`badge badge-${tone}`}>{icon && <Icon name={icon} size={12} />}{children}</span>
}

export const STATUS = {
  awaiting: { tone: 'neutral', icon: 'clock', label: 'Awaiting' },
  locked: { tone: 'warn', icon: 'lock', label: 'Locked' },
  paid: { tone: 'ok', icon: 'check', label: 'Paid' },
  released: { tone: 'neutral', icon: 'undo', label: 'Released' },
}
export const StatusBadge = ({ status }) => { const s = STATUS[status]; return <Badge tone={s.tone} icon={s.icon}>{s.label}</Badge> }

// tone: info | ok | warn | error
export function Banner({ tone = 'info', title, children, action }) {
  const icon = { info: 'clock', ok: 'check', warn: 'alert', error: 'alert' }[tone]
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={icon} size={18} className="banner-icon" />
      <div className="banner-body">
        {title && <div className="banner-title">{title}</div>}
        {children && <div className="banner-text">{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function Section({ title, aside, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      {(title || aside) && <div className="section-head"><h3>{title}</h3>{aside}</div>}
      {children}
    </section>
  )
}

export function Row({ label, sub, value, badge, strong }) {
  return (
    <div className={`row${strong ? ' row-strong' : ''}`}>
      <div className="row-label"><span>{label}</span>{sub && <span className="row-sub">{sub}</span>}</div>
      {badge}
      {value != null && <span className="row-value num">{value}</span>}
    </div>
  )
}

export function Empty({ icon = 'eyeOff', title, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={18} />
      <div><div className="empty-title">{title}</div>{children && <div className="empty-text">{children}</div>}</div>
    </div>
  )
}

export function Skeleton({ lines = 4 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="sk sk-hero" />
      {Array.from({ length: lines }, (_, i) => <div key={i} className="sk sk-line" style={{ width: `${88 - i * 9}%` }} />)}
    </div>
  )
}

export function Select({ label, value, onChange, options }) {
  const id = useId()
  return (
    <div className="select">
      <label htmlFor={id} className="select-label">{label}</label>
      <div className="select-box">
        <select id={id} value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg className="select-chev" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </div>
    </div>
  )
}

// steps: [{label, detail, state: 'done' | 'active' | 'todo'}]
export function Stepper({ steps, label }) {
  return (
    <ol className="stepper" aria-label={label}>
      {steps.map((s, i) => (
        <li key={i} className={`step step-${s.state}`} aria-current={s.state === 'active' ? 'step' : undefined}>
          <span className="step-dot">{s.state === 'done' ? <Icon name="check" size={12} /> : i + 1}</span>
          <span className="step-text"><span className="step-label">{s.label}</span>{s.detail && <span className="step-detail">{s.detail}</span>}</span>
        </li>
      ))}
    </ol>
  )
}

export function Segmented({ label, value, onChange, options }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value} className="seg" onClick={() => onChange(o.value)}>
          <span className="seg-k">{o.kicker}</span><span className="seg-v">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

// The signature moment: one transaction, stamped identically in every pane that saw it.
export function Stamp({ tx }) {
  const paid = tx.kind === 'paid'
  const time = new Date(tx.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className={`stamp stamp-${paid ? 'ok' : 'neutral'}`} key={tx.updateId}>
      <Icon name={paid ? 'check' : 'undo'} size={18} className="stamp-icon" />
      <div className="stamp-body">
        <div className="stamp-title">{paid ? 'Settled in one transaction' : 'Released in one transaction'}</div>
        <div className="stamp-id num" title={tx.updateId}>
          <span className="sr-only">Transaction ID </span>{tx.updateId.slice(0, 8)}…{tx.updateId.slice(-6)} · {time}
        </div>
      </div>
    </div>
  )
}
