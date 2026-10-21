import { useState, useMemo, useRef } from 'react'
import { seriesOdds, seriesWinChance, solveGameChance } from '../utils/seriesOdds'
import { useSeriesSetup, usePercentField, pct } from './setup'
import { SetupFields, PercentField, AssumptionNote } from './SetupFields'
import { SplitPanel, ChartPanel, BreakdownPanel } from './ResultPanels'
import logo from '../assets/SeriesCalcLogo.png'

const TABS = [
  { id: 'forward', label: 'Forward', blurb: 'Game odds → series odds' },
  { id: 'reverse', label: 'Reverse', blurb: 'Series odds → game odds' },
]

export default function SeriesOdds() {
  const [tab, setTab] = useState('forward')
  const tabRefs = useRef({})

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onTabKey(e) {
    const i = TABS.findIndex(t => t.id === tab)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = TABS[(i + step + TABS.length) % TABS.length].id
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="wrap">
      <header>
        <div className="heading-block">
          <a href="/" className="home-link">&larr; All tools</a>
          <img src={logo} alt="Series-State Odds Calculator logo" className="header-logo" />
          <p className="eyebrow">Probability Tool</p>
          <h1>Series-State Odds Calculator</h1>
          <p className="sub">
            Go from the odds of a single game to the odds of the whole series, or work backwards from series odds
            to the per-game odds they imply.
          </p>
        </div>
      </header>

      <div className="so-tabs" role="tablist" aria-label="Calculator mode" onKeyDown={onTabKey}>
        {TABS.map(t => (
          <button
            key={t.id}
            ref={el => { tabRefs.current[t.id] = el }}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={`so-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="so-tab-label">{t.label}</span>
            <span className="so-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      {/* Both tabs stay mounted so each keeps its own, independent setup. */}
      <div id="panel-forward" role="tabpanel" aria-labelledby="tab-forward" hidden={tab !== 'forward'}>
        <ForwardTab />
      </div>
      <div id="panel-reverse" role="tabpanel" aria-labelledby="tab-reverse" hidden={tab !== 'reverse'}>
        <ReverseTab />
      </div>
    </div>
  )
}

function ForwardTab() {
  const s = useSeriesSetup()
  const game = usePercentField(50, 1, 99)

  const { pA, outcomes } = useMemo(
    () => seriesOdds(s.target, s.winsA, s.winsB, game.value / 100, { winBy2: s.winBy2 }),
    [s.target, s.winsA, s.winsB, s.winBy2, game.value]
  )

  return (
    <div className="board">
      <section className="panel">
        <h2>Series setup</h2>
        <SetupFields setup={s} id="fwd" />
        <PercentField id="fwd-game-pct" label={`${s.labelA} fair odds or best estimate`} field={game} />
        <AssumptionNote />
      </section>

      <div className="col-right">
        <SplitPanel title="Series odds" meta={`${s.winsA}–${s.winsB} · ${s.formatMeta}`} labelA={s.labelA} labelB={s.labelB} pA={pA} />
        <ChartPanel id="fwd-curve" setup={s} gamePct={game.value} onPick={game.set} />
        <BreakdownPanel outcomes={outcomes} labelA={s.labelA} labelB={s.labelB} />
      </div>
    </div>
  )
}

function ReverseTab() {
  const s = useSeriesSetup()
  const series = usePercentField(60, 0.1, 99.9)

  const p = useMemo(
    () => solveGameChance(s.target, s.winsA, s.winsB, series.value / 100, { winBy2: s.winBy2 }),
    [s.target, s.winsA, s.winsB, s.winBy2, series.value]
  )
  const { outcomes } = useMemo(
    () => seriesOdds(s.target, s.winsA, s.winsB, p, { winBy2: s.winBy2 }),
    [s.target, s.winsA, s.winsB, s.winBy2, p]
  )

  // Clicking the chart picks a game chance; set the series odds that it produces.
  function pickFromChart(gamePct) {
    const sc = seriesWinChance(s.target, s.winsA, s.winsB, gamePct / 100, { winBy2: s.winBy2 })
    series.set(Math.min(99.9, Math.max(0.1, Math.round(sc * 1000) / 10)))
  }

  return (
    <div className="board">
      <section className="panel">
        <h2>Series setup</h2>
        <SetupFields setup={s} id="rev" />
        <PercentField id="rev-series-pct" label={`${s.labelA} series odds`} field={series} />
        <AssumptionNote />
      </section>

      <div className="col-right">
        <SplitPanel
          title="Implied per-game odds"
          meta={`${s.winsA}–${s.winsB} · ${s.formatMeta}`}
          labelA={s.labelA}
          labelB={s.labelB}
          pA={p}
        />
        <p className="so-reverse-note">
          {s.labelA} needs to win each game {pct(p)} of the time to have a {series.value}% chance of taking the series from here.
        </p>
        <ChartPanel id="rev-curve" setup={s} gamePct={p * 100} onPick={pickFromChart} />
        <BreakdownPanel outcomes={outcomes} labelA={s.labelA} labelB={s.labelB} />
      </div>
    </div>
  )
}
