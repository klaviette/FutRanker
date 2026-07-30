import { useState, useMemo } from 'react'
import { PLAYERS } from './data/players'
import { PRESETS } from './data/presets'
import { scorePlayer } from './utils/scoring'
import WeightPanel from './components/WeightPanel'
import RankPanel from './components/RankPanel'

export default function App() {
  const [weights, setWeights] = useState({ ...PRESETS['Balanced'] })

  const ranked = useMemo(() =>
    PLAYERS
      .map(p => { const s = scorePlayer(p, weights); return { ...p, _total: s.total, _pct: s.pct } })
      .sort((a, b) => b._total - a._total)
      .slice(0, 10),
    [weights]
  )

  return (
    <div className="wrap">
      <header>
        <div className="heading-block">
          <img src="/GoatCalcLogo.png" alt="GOAT Calculator logo" className="header-logo" />
          <p className="eyebrow">Weighted Ranking Engine</p>
          <h1>The GOAT Calculator</h1>
          <p className="sub">
            Slide each accolade to how much it should count. The board recalculates your top 10 in
            real time from a built-in pool of legends, weighted by your priorities.
          </p>
        </div>
      </header>

      <div className="board">
        <WeightPanel weights={weights} setWeights={setWeights} />
        <RankPanel ranked={ranked} />
      </div>
    </div>
  )
}

