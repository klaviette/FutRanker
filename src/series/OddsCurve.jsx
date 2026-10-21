import { useEffect, useMemo, useRef, useState } from 'react'
import { seriesWinChance } from '../utils/seriesOdds'

const H = 220
const PAD = { top: 12, right: 14, bottom: 28, left: 40 }
const PLOT_H = H - PAD.top - PAD.bottom

// Series win chance for side A (y) across every single-game win chance (x),
// from the current series state. The marker follows the slider.
export default function OddsCurve({ target, winBy2, winsA, winsB, gamePct, onPick }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const [hoverPct, setHoverPct] = useState(null)
  // Draw at the container's real pixel width so text and strokes never scale.
  const [W, setW] = useState(360)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setW(Math.max(200, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PLOT_W = W - PAD.left - PAD.right
  const x = gp => PAD.left + (gp / 100) * PLOT_W
  const y = sp => PAD.top + (1 - sp) * PLOT_H

  const points = useMemo(() => {
    const pts = []
    for (let gp = 0; gp <= 100; gp += 1) pts.push([gp, seriesWinChance(target, winsA, winsB, gp / 100, { winBy2 })])
    return pts
  }, [target, winsA, winsB, winBy2])

  const path = points.map(([gp, sp], i) => `${i ? 'L' : 'M'}${x(gp).toFixed(1)},${y(sp).toFixed(1)}`).join('')
  const current = seriesWinChance(target, winsA, winsB, gamePct / 100, { winBy2 })
  const hover = hoverPct === null ? null : { gp: hoverPct, sp: seriesWinChance(target, winsA, winsB, hoverPct / 100, { winBy2 }) }

  function pctFromEvent(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    return Math.round(Math.min(99, Math.max(1, ((px - PAD.left) / PLOT_W) * 100)))
  }

  return (
    <div className="so-curve" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={`Series win chance for side A plotted against single-game win chance. At ${gamePct}% per game, side A wins the series ${(current * 100).toFixed(1)}% of the time.`}
        onPointerMove={e => setHoverPct(pctFromEvent(e))}
        onPointerLeave={() => setHoverPct(null)}
        onClick={e => onPick(pctFromEvent(e))}
      >
        {[0, 0.5, 1].map(v => (
          <g key={v}>
            <line className="so-curve-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="so-curve-tick" x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end">{v * 100}%</text>
          </g>
        ))}
        {[0, 50, 100].map(v => (
          <text key={v} className="so-curve-tick" x={x(v)} y={H - 10} textAnchor="middle">{v}%</text>
        ))}

        {/* Reference: series odds equal to single-game odds */}
        <line className="so-curve-ref" x1={x(0)} y1={y(0)} x2={x(100)} y2={y(1)} />

        <path className="so-curve-line" d={path} />

        <line className="so-curve-guide" x1={x(gamePct)} x2={x(gamePct)} y1={y(0)} y2={y(current)} />
        <line className="so-curve-guide" x1={x(0)} x2={x(gamePct)} y1={y(current)} y2={y(current)} />
        <circle className="so-curve-dot" cx={x(gamePct)} cy={y(current)} r="5" />

        {hover && (
          <g className="so-curve-hover">
            <line x1={x(hover.gp)} x2={x(hover.gp)} y1={PAD.top} y2={y(0)} />
            <circle cx={x(hover.gp)} cy={y(hover.sp)} r="4" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="so-curve-tip"
          style={{ left: `${(x(hover.gp) / W) * 100}%`, top: `${(y(hover.sp) / H) * 100}%` }}
        >
          <span>Game {hover.gp}%</span>
          <b>Series {(hover.sp * 100).toFixed(1)}%</b>
        </div>
      )}

      <p className="so-curve-caption">
        <span className="so-curve-key so-curve-key--line" aria-hidden="true" /> Series win chance
        <span className="so-curve-key so-curve-key--ref" aria-hidden="true" /> Same as one game
        <span className="so-curve-hint">Click the chart to set the odds.</span>
      </p>
    </div>
  )
}
