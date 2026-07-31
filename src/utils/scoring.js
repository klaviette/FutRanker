import { CATEGORIES } from '../data/categories'

// finds the max value for the current pool of players for each category
// scores for everyone are based around this value
export function computeMaxes(players) {
  const m = {}
  CATEGORIES.forEach(c => { m[c.key] = Math.max(...players.map(p => p[c.key] || 0), 1) })
  return m
}


// formula explanation: each player's stat is scored as a percent of the highest in the field
// these values are then multiplied by the user's weights and summed to get the total score
// the player's score out of the total possible points is then calculated as a percentage which is displayed
// final list is sorted based on high-to-low scoring of these players
export function scorePlayer(p, weights, maxes) {
  let total = 0, max = 0
  CATEGORIES.forEach(c => {
    const norm = ((p[c.key] || 0) / maxes[c.key]) * 100
    total += norm * weights[c.key]
    max += 100 * weights[c.key]
  })
  return { total, pct: max > 0 ? (total / max) * 100 : 0 }
}

// so basically its completely arbitrary of a score but should provide a reasonable ranking of players relative to each other
// based on the user specified weights