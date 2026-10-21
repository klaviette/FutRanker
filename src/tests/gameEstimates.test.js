import { describe, it, expect } from 'vitest'
import { eloWinChance, log5, recordWinChance } from '../utils/gameEstimates'

describe('gameEstimates', () => {
  it('Elo: equal ratings are 50%, a 400-point edge is 10:1', () => {
    expect(eloWinChance(1500, 1500)).toBeCloseTo(0.5)
    expect(eloWinChance(1900, 1500)).toBeCloseTo(10 / 11)
    expect(eloWinChance(1500, 1900)).toBeCloseTo(1 / 11)
  })

  it('log5 matches the known example (.600 vs .400 → .692)', () => {
    expect(log5(0.6, 0.4)).toBeCloseTo(0.6923, 4)
    expect(log5(0.55, 0.55)).toBeCloseTo(0.5)
  })

  it('records go through log5 and handle edge cases', () => {
    expect(recordWinChance(60, 40, 40, 60)).toBeCloseTo(0.6923, 4)
    expect(recordWinChance(0, 0, 5, 5)).toBeCloseTo(0.5)
    expect(recordWinChance(3, 0, 2, 0)).toBe(0.5) // both unbeaten
  })
})
