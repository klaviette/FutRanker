import { describe, it, expect } from 'vitest'
import { PRESETS } from '../data/presets'
import { CATEGORIES } from '../data/categories'

describe('PRESETS', () => {
  it('defines a weight for every category key in every preset', () => {
    Object.entries(PRESETS).forEach(([, weights]) => {
      CATEGORIES.forEach(c => {
        expect(weights).toHaveProperty(c.key)
      })
    })
  })

  it('only uses weights within the 0-10 slider range', () => {
    Object.values(PRESETS).forEach(weights => {
      Object.values(weights).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(10)
      })
    })
  })

  it('has a Reset preset that zeroes out every category', () => {
    expect(PRESETS.Reset).toBeDefined()
    Object.values(PRESETS.Reset).forEach(v => expect(v).toBe(0))
  })
})
