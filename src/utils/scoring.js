import { CATEGORIES } from '../data/categories'
import { PLAYERS } from '../data/players'

export const MAXES = (() => {
  const m = {}
  CATEGORIES.forEach(c => { m[c.key] = Math.max(...PLAYERS.map(p => p[c.key]), 1) })
  return m
})()

export function scorePlayer(p, weights) {
  let total = 0, max = 0
  CATEGORIES.forEach(c => {
    const norm = (p[c.key] / MAXES[c.key]) * 100
    total += norm * weights[c.key]
    max += 100 * weights[c.key]
  })
  return { total, pct: max > 0 ? (total / max) * 100 : 0 }
}
