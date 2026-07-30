import { useState } from 'react'
import { CATEGORIES } from '../data/categories'

export default function RankRow({ player, rank }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <li className="rank-row" style={{ animationDelay: `${(rank - 1) * 30}ms` }}>
      <span className="drag-handle"></span>
      <div className="rank-num">{rank}</div>
      <div className="rank-main">
        <div className="rank-name">{player.name}</div>
        <div className={`breakdown${isOpen ? ' open' : ''}`}>
          <div className="breakdown-inner">
            <div className="breakdown-grid">
              {CATEGORIES.map(c => (
                <div key={c.key} className="breakdown-row">
                  <span className="k">{c.label}</span>
                  <span className="v">{player[c.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="gauge" style={{ '--pct': player._pct.toFixed(0) }}>
        <span>{player._pct.toFixed(0)}</span>
      </div>
      <button
        className={`rank-toggle${isOpen ? ' open' : ''}`}
        type="button"
        onClick={() => setIsOpen(v => !v)}
      >
        i
      </button>
    </li>
  )
}
