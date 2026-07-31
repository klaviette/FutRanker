import { useState, useEffect, useMemo } from 'react'
import { PLAYERS as FALLBACK_PLAYERS } from './data/players'
import { PRESETS } from './data/presets'
import { scorePlayer, computeMaxes } from './utils/scoring'
import WeightPanel from './components/WeightPanel'
import RankPanel from './components/RankPanel'

const DATA_URL = 'https://klaviette.github.io/futrankerdata/greatest_players_full.json'

export default function App() {
  const [weights, setWeights] = useState({ ...PRESETS['Balanced'] })
  const [players, setPlayers] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch player data: ${res.status}`)
        return res.json()
      })
      .then(data => { if (!cancelled) setPlayers(data) })
      .catch(err => {
        console.error('Failed to load remote player data, using bundled fallback:', err)
        if (!cancelled) { setPlayers(FALLBACK_PLAYERS); setLoadError(true) }
      })
    return () => { cancelled = true }
  }, [])

  const maxes = useMemo(() => (players ? computeMaxes(players) : null), [players])

  const ranked = useMemo(() => {
    if (!players || !maxes) return []
    return players
      .map(p => { const s = scorePlayer(p, weights, maxes); return { ...p, _total: s.total, _pct: s.pct } })
      .sort((a, b) => b._total - a._total)
      .slice(0, 10)
  }, [players, maxes, weights])

  return (
    <div className="wrap">
      <header>
        <div className="heading-block">
          <img src="/GoatCalcLogo.png" alt="GOAT Calculator logo" className="header-logo" />
          <p className="eyebrow">Weighted Ranking Engine</p>
          <h1>The GOAT Calculator</h1>
          <p className="sub">
            World Cup overrated? Ballon d'Or overhyped? Find out who your GOAT is based on the awards and accolades you value. 
          </p>
          {loadError && <p className="sub">Couldn't reach the live player data — showing bundled data instead.</p>}
        </div>
      </header>

      <div className="board">
        <WeightPanel weights={weights} setWeights={setWeights} />
        {players ? (
          <RankPanel ranked={ranked} poolSize={players.length} />
        ) : (
          <section className="panel">
            <h2>Loading players…</h2>
          </section>
        )}
      </div>
    </div>
  )
}


