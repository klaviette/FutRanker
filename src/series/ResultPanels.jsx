import { useState } from 'react'
import OddsCurve from './OddsCurve'
import { pct } from './setup'

// Outcome bars share one fixed scale so they grow and shrink with the odds;
// it only stretches when a single outcome is more likely than this.
const BAR_SCALE_FLOOR = 0.3

export function SplitPanel({ title, meta, labelA, labelB, pA }) {
  return (
    <section className="panel">
      <h2>
        {title}
        <span className="panel-meta">{meta}</span>
      </h2>
      <div className="so-result">
        <Result label={labelA} p={pA} side="A" />
        <Result label={labelB} p={1 - pA} side="B" />
      </div>
      <div className="so-split" aria-hidden="true">
        <span className="so-split-a" style={{ flexGrow: pA }} />
        <span className="so-split-b" style={{ flexGrow: 1 - pA }} />
        <span className="so-split-mid" />
      </div>
    </section>
  )
}

function Result({ label, p, side }) {
  return (
    <div className={`so-result-side so-result-side--${side}`}>
      <span className="so-result-name">
        <i className="so-swatch" aria-hidden="true" />
        {label}
      </span>
      <span className="so-result-pct">{pct(p)}</span>
    </div>
  )
}

export function ChartPanel({ id, setup: s, gamePct, onPick }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="panel">
      <h2 className={`so-collapse-head${open ? '' : ' is-collapsed'}`}>
        <button
          type="button"
          className="so-collapse-btn"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(o => !o)}
        >
          <span className={`chev${open ? ' is-open' : ''}`} aria-hidden="true" />
          Series odds by game odds
        </button>
        <span className="panel-meta">{s.labelA}</span>
      </h2>
      {open && (
        <div id={id}>
          <OddsCurve
            target={s.target}
            winBy2={s.winBy2}
            winsA={s.winsA}
            winsB={s.winsB}
            gamePct={gamePct}
            onPick={onPick}
          />
        </div>
      )}
    </section>
  )
}

export function BreakdownPanel({ outcomes, labelA, labelB }) {
  const barScale = Math.max(BAR_SCALE_FLOOR, ...outcomes.map(o => o.prob))
  return (
    <section className="panel">
      <h2>Final score breakdown</h2>
      <ul className="so-outcomes">
        {outcomes.map(o => (
          <li key={`${o.winner}-${o.a}-${o.b}`} className={`so-outcome so-outcome--${o.winner}`}>
            <span className="so-outcome-who">{o.winner === 'A' ? labelA : labelB}</span>
            {o.extraFrom === undefined ? (
              <span className="so-outcome-score">{o.a}–{o.b}</span>
            ) : (
              <span className="so-outcome-score so-outcome-score--extra" title="Wins in extra games after this tie">
                after {o.extraFrom}–{o.extraFrom}
              </span>
            )}
            <span className="so-outcome-bar">
              <span style={{ width: `${(o.prob / barScale) * 100}%` }} />
            </span>
            <span className="so-outcome-pct">{pct(o.prob)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
