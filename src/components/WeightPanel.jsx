import { useState } from 'react'
import { CATEGORIES, GROUP_ORDER } from '../data/categories'
import { PRESETS } from '../data/presets'

const NOTE_PARAGRAPHS = [
  "Each category is scored 0–100 relative to the best in the pool, then multiplied by your weight (0–10) and summed. Set a weight to 0 to ignore a category entirely.",
  "⚠ Trophy/goal figures are career totals as commonly reported and rounded. For some of the older stats, it was literally impossible to find consensus data so I had to make my best estimate.",
  "⚠ Assist totals weren't tracked until the 1990s, so don't put much stock into the assist numbers I pulled here (even for recent players).",
  "⚠ Club World Cup didn't exist until the early 2000s, so older legends' wins in the Intercontinental Cup are the only ones counted for that era.",
  "⚠ Yes, there is an inherent bias towards more recent players due to better data availability and more awards. However, this site is just for fun.",
]

export default function WeightPanel({ weights, setWeights }) {
  const [openGroups, setOpenGroups] = useState(new Set([GROUP_ORDER[0]]))

  function applyPreset(name) { setWeights({ ...PRESETS[name] }) }

  function randomize() {
    const next = {}
    CATEGORIES.forEach(c => { next[c.key] = Math.floor(Math.random() * 11) })
    setWeights(next)
  }

  function toggleGroup(name) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <section className="panel">
      <h3>Choose which accolades should carry the most weight</h3>
      <h2>Presets</h2>

      <div className="presets">
        {Object.keys(PRESETS).map(name => (
          <button key={name} className="preset-btn" type="button" onClick={() => applyPreset(name)}>
            {name}
          </button>
        ))}
        <button className="preset-btn preset-btn--random" type="button" onClick={randomize}>
          🎲 Randomize
        </button>
      </div>

      <div>
        {GROUP_ORDER.map(groupName => {
          const groupCats = CATEGORIES.filter(c => c.group === groupName)
          const isOpen = openGroups.has(groupName)
          const avg = groupCats.reduce((sum, c) => sum + weights[c.key], 0) / groupCats.length
          return (
            <div key={groupName} className={`group${isOpen ? ' is-open' : ''}`}>
              <button className="group-header" type="button" onClick={() => toggleGroup(groupName)}>
                <span className="left">
                  <span className="chev" />
                  <span>{groupName}</span>
                </span>
                <span className="group-count">avg {avg.toFixed(1)}</span>
              </button>
              <div className="group-body-outer">
                <div className="group-body-inner">
                  <div className="group-body">
                    {groupCats.map(c => (
                      <div key={c.key} className="slider-row">
                        <div className="slider-label">
                          <span className="name">{c.label}</span>
                          <span className="val">{weights[c.key]}</span>
                        </div>
                        <input
                          type="range"
                          min={0} max={10} step={1}
                          value={weights[c.key]}
                          style={{ '--fill': `${weights[c.key] / 10 * 100}%` }}
                          onChange={e => setWeights(prev => ({ ...prev, [c.key]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="note">
        {NOTE_PARAGRAPHS.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  )
}
