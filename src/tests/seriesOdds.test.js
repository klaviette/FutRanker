import { describe, it, expect } from 'vitest'
import { seriesOdds, seriesWinChance, solveGameChance, marginAndTotals, winsNeeded, isFinished } from '../utils/seriesOdds'

describe('seriesOdds', () => {
  it('computes wins needed for a best-of series', () => {
    expect(winsNeeded(7)).toBe(4)
    expect(winsNeeded(1)).toBe(1)
  })

  it('is 50/50 for an even matchup from 0-0', () => {
    expect(seriesOdds(4, 0, 0, 0.5).pA).toBeCloseTo(0.5)
  })

  it('matches the known value for leading 3-1 in a best of 7 at even odds', () => {
    // Trailing side must win 3 straight: 1/8
    expect(seriesOdds(4, 3, 1, 0.5).pA).toBeCloseTo(7 / 8)
  })

  it('outcome probabilities sum to 1', () => {
    const { outcomes } = seriesOdds(4, 1, 2, 0.6)
    expect(outcomes.reduce((s, o) => s + o.prob, 0)).toBeCloseTo(1)
  })

  it('handles a finished series', () => {
    expect(seriesOdds(3, 3, 1, 0.2).pA).toBe(1)
  })

  it('matches the known tennis game value with win by 2', () => {
    // First to 4, win by 2, p = 0.6 → ≈ 0.7357
    expect(seriesOdds(4, 0, 0, 0.6, { winBy2: true }).pA).toBeCloseTo(0.7357, 4)
  })

  it('uses the deuce formula from a tie past target - 1', () => {
    expect(seriesOdds(4, 3, 3, 0.6, { winBy2: true }).pA).toBeCloseTo(0.36 / 0.52)
    expect(seriesOdds(13, 14, 13, 0.5, { winBy2: true }).pA).toBeCloseTo(0.75)
  })

  it('groups extra games into one outcome per side and still sums to 1', () => {
    const { outcomes } = seriesOdds(4, 0, 0, 0.55, { winBy2: true })
    expect(outcomes.filter(o => o.extraFrom !== undefined)).toHaveLength(2)
    expect(outcomes.reduce((s, o) => s + o.prob, 0)).toBeCloseTo(1)
  })

  it('treats a one-point lead past the target as unfinished with win by 2', () => {
    expect(isFinished(4, 4, 3, true)).toBe(false)
    expect(isFinished(4, 5, 3, true)).toBe(true)
    expect(isFinished(4, 4, 3, false)).toBe(true)
  })
})

describe('seriesWinChance', () => {
  it('agrees with seriesOdds across formats and states', () => {
    const cases = [
      [4, 0, 0, false], [4, 2, 3, false], [1, 0, 0, false], [13, 5, 9, false],
      [4, 0, 0, true], [4, 3, 2, true], [4, 3, 3, true], [13, 14, 13, true], [13, 12, 14, true], [50, 10, 20, true],
    ]
    for (const [t, a, b, winBy2] of cases) {
      for (const p of [0.01, 0.3, 0.5, 0.62, 0.99]) {
        expect(seriesWinChance(t, a, b, p, { winBy2 })).toBeCloseTo(seriesOdds(t, a, b, p, { winBy2 }).pA, 10)
      }
    }
  })
})

describe('solveGameChance', () => {
  it('round-trips with seriesWinChance', () => {
    for (const [t, a, b, winBy2] of [[4, 0, 0, false], [4, 3, 1, false], [4, 0, 0, true], [13, 12, 11, true], [50, 5, 30, false]]) {
      for (const p of [0.05, 0.4, 0.5, 0.73, 0.95]) {
        const sc = seriesWinChance(t, a, b, p, { winBy2 })
        expect(solveGameChance(t, a, b, sc, { winBy2 })).toBeCloseTo(p, 6)
      }
    }
  })

  it('gives 50% per game for 50% series odds from an even score', () => {
    expect(solveGameChance(4, 2, 2, 0.5)).toBeCloseTo(0.5, 9)
  })
})

describe('marginAndTotals', () => {
  it('gives known best-of-7 values at even odds', () => {
    const { outcomes } = seriesOdds(4, 0, 0, 0.5)
    const { margins, totals } = marginAndTotals(outcomes, 0.5)
    const aBy2Plus = margins.filter(m => m.margin >= 2).reduce((s, m) => s + m.prob, 0)
    expect(aBy2Plus).toBeCloseTo(0.34375) // 4–0, 4–1, 4–2
    const over55 = totals.filter(t => t.total > 5.5).reduce((s, t) => s + t.prob, 0)
    expect(over55).toBeCloseTo(0.625) // 6 or 7 games
  })

  it('accounts for every outcome, including unbounded extra games', () => {
    for (const p of [0.2, 0.5, 0.8]) {
      const { outcomes } = seriesOdds(4, 2, 1, p, { winBy2: true })
      const { margins, totals } = marginAndTotals(outcomes, p)
      expect(margins.reduce((s, m) => s + m.prob, 0)).toBeCloseTo(1, 9)
      expect(totals.reduce((s, t) => s + t.prob, 0)).toBeCloseTo(1, 9)
      expect(margins.every(m => Math.abs(m.margin) >= 2)).toBe(true)
    }
  })
})
