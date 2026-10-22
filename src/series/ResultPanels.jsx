import { useMemo, useState } from 'react'
import OddsCurve from './OddsCurve'
import { pct } from './setup'
import { marginAndTotals } from '../utils/seriesOdds'

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

// Lines hide once a side's chance drops below this, so long series stay readable.
const LINE_FLOOR = 0.005
const MAX_LINES = 12

// Handicap and total-games lines, summed from the final score breakdown.
export function LinesPanel({ outcomes, p, labelA, labelB }) {
  const { margins, totals } = useMemo(() => marginAndTotals(outcomes, p), [outcomes, p])

  // Chance a side wins by more than `line` games.
  const covers = (side, line) => margins
    .filter(m => (side === 'A' ? m.margin : -m.margin) > line)
    .reduce((s, m) => s + m.prob, 0)

  const spreads = []
  for (let line = 1.5; spreads.length < MAX_LINES; line += 1) {
    const a = covers('A', line)
    const b = covers('B', line)
    if (Math.max(a, b) < LINE_FLOOR) break
    spreads.push({ line, a, b })
  }

  const overs = []
  const lowest = totals.length ? totals[0].total : 0
  for (let line = lowest - 0.5; overs.length < MAX_LINES; line += 1) {
    const over = totals.filter(t => t.total > line).reduce((s, t) => s + t.prob, 0)
    if (over < LINE_FLOOR) break
    if (over <= 1 - LINE_FLOOR) overs.push({ line, over })
  }

  return (
    <section className="panel">
      <h2>
        Lines
        <span className="panel-meta">summed from the breakdown</span>
      </h2>
      <div className="so-lines">
        <div>
          <h3 className="so-section-title">Handicap (games)</h3>
          {spreads.length ? (
            <table className="so-lines-table">
              <thead>
                <tr><th scope="col">Line</th><th scope="col">{labelA}</th><th scope="col">{labelB}</th></tr>
              </thead>
              <tbody>
                {spreads.map(s => (
                  <tr key={`m${s.line}`}>
                    <th scope="row">−{s.line}</th><td>{pct(s.a)}</td><td>{pct(s.b)}</td>
                  </tr>
                ))}
                {spreads.map(s => (
                  <tr key={`p${s.line}`}>
                    <th scope="row">+{s.line}</th><td>{pct(1 - s.b)}</td><td>{pct(1 - s.a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="so-hint">Only a one-game margin is possible from here.</p>
          )}
          <p className="so-hint">−1.5 means winning the series by 2 or more games; +1.5 means not losing by 2 or more.</p>
        </div>

        <div>
          <h3 className="so-section-title">Total games</h3>
          {overs.length ? (
            <table className="so-lines-table">
              <thead>
                <tr><th scope="col">Line</th><th scope="col">Over</th><th scope="col">Under</th></tr>
              </thead>
              <tbody>
                {overs.map(o => (
                  <tr key={o.line}>
                    <th scope="row">{o.line}</th><td>{pct(o.over)}</td><td>{pct(1 - o.over)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="so-hint">The number of games left is already settled.</p>
          )}
          <p className="so-hint">Counts every game in the series, including ones already played.</p>
        </div>
      </div>
    </section>
  )
}
