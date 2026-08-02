import { describe, it, expect } from 'vitest'
import { computeMaxes, scorePlayer } from '../utils/scoring'
import { CATEGORIES } from '../data/categories'

function zeroWeights() {
  const w = {}
  CATEGORIES.forEach(c => { w[c.key] = 0 })
  return w
}

describe('computeMaxes', () => {
  it('finds the max value per category across all players', () => {
    const players = [
      { wc: 1, league: 5 },
      { wc: 3, league: 2 },
    ]
    const maxes = computeMaxes(players)
    expect(maxes.wc).toBe(3)
    expect(maxes.league).toBe(5)
  })

  it('defaults missing stats to 0 and never returns a max below 1', () => {
    const players = [{}, {}]
    const maxes = computeMaxes(players)
    CATEGORIES.forEach(c => expect(maxes[c.key]).toBe(1))
  })
})

describe('scorePlayer', () => {
  it('gives a perfect 100 pct to the top player in every category when weighted equally', () => {
    const players = [
      { wc: 1, league: 1 },
      { wc: 2, league: 2 },
    ]
    const maxes = computeMaxes(players)
    const weights = zeroWeights()
    weights.wc = 1
    weights.league = 1
    const { pct } = scorePlayer(players[1], weights, maxes)
    expect(pct).toBeCloseTo(100)
  })

  it('scores 0 when a player has no stats in weighted categories', () => {
    const players = [{ wc: 5 }]
    const maxes = computeMaxes(players)
    const weights = zeroWeights()
    weights.wc = 1
    const { total, pct } = scorePlayer({}, weights, maxes)
    expect(total).toBe(0)
    expect(pct).toBe(0)
  })

  it('returns pct 0 when all weights are 0', () => {
    const players = [{ wc: 5 }]
    const maxes = computeMaxes(players)
    const { total, pct } = scorePlayer(players[0], zeroWeights(), maxes)
    expect(total).toBe(0)
    expect(pct).toBe(0)
  })

  it('weights categories proportionally to their assigned weight', () => {
    const players = [{ wc: 10, league: 10 }]
    const maxes = computeMaxes(players)
    const weights = zeroWeights()
    weights.wc = 2
    weights.league = 1
    const { total } = scorePlayer(players[0], weights, maxes)
    // both categories are at 100% of max, so total = 100*2 + 100*1
    expect(total).toBe(300)
  })
})
