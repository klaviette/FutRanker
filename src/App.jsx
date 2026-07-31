import { useState, useEffect, useMemo } from 'react'
import { PLAYERS as FALLBACK_PLAYERS } from './data/players'
import { PRESETS } from './data/presets'
import { scorePlayer, computeMaxes } from './utils/scoring'
import WeightPanel from './components/WeightPanel'
import RankPanel from './components/RankPanel'
import DisclaimerPanel from './components/DisclaimerPanel'
import logo from './assets/GoatCalcLogo.png'

const DATA_URL = 'https://klaviette.github.io/futrankerdata/greatest_players_full.json'

export default function App() {
  const [weights, setWeights] = useState({ ...PRESETS['Balanced'] })
  const [players, setPlayers] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [selectedConfederations, setSelectedConfederations] = useState([])

  function toggleConfederation(conf) {
    setSelectedConfederations(prev =>
      prev.includes(conf) ? prev.filter(c => c !== conf) : [...prev, conf]
    )
  }

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

  const filteredPlayers = useMemo(() => {
    if (!players) return null
    if (selectedConfederations.length === 0) return players
    return players.filter(p => selectedConfederations.includes(p.confederation))
  }, [players, selectedConfederations])

  const maxes = useMemo(() => (filteredPlayers ? computeMaxes(filteredPlayers) : null), [filteredPlayers])

  const ranked = useMemo(() => {
    if (!filteredPlayers || !maxes) return []
    return filteredPlayers
      .map(p => { const s = scorePlayer(p, weights, maxes); return { ...p, _total: s.total, _pct: s.pct } })
      .sort((a, b) => b._total - a._total)
      .slice(0, 10)
  }, [filteredPlayers, maxes, weights])

  return (
    <div className="wrap">
      <header>
        <div className="heading-block">
          <img src={logo} alt="GOAT Calculator logo" className="header-logo" />
          <p className="eyebrow">Weighted Ranking Tool</p>
          <h1>The GOAT Calculator</h1>
          <p className="sub">
            World Cup overrated? Ballon d'Or overhyped? Find out who your GOAT is based on the awards and accolades you value. 
          </p>
          {loadError && <p className="sub">Couldn't reach the live player data — showing bundled data instead.</p>}
        </div>
      </header>

      <div className="board">
        <WeightPanel weights={weights} setWeights={setWeights} />
        <div className="col-right">
          {players ? (
            <RankPanel
              ranked={ranked}
              selectedConfederations={selectedConfederations}
              onToggleConfederation={toggleConfederation}
            />
          ) : (
            <section className="panel">
              <h2>Loading players…</h2>
            </section>
          )}
          <DisclaimerPanel />
        </div>
      </div>
    </div>
  )
}


