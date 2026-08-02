import { describe, it, expect } from 'vitest'
import { CATEGORIES, GROUP_ORDER } from '../data/categories'

describe('CATEGORIES', () => {
  it('has a unique key for every category', () => {
    const keys = CATEGORIES.map(c => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('gives every category a non-empty label', () => {
    CATEGORIES.forEach(c => expect(c.label).toBeTruthy())
  })

  it('assigns every category a group that exists in GROUP_ORDER', () => {
    CATEGORIES.forEach(c => expect(GROUP_ORDER).toContain(c.group))
  })
})

describe('GROUP_ORDER', () => {
  it('has no duplicate groups', () => {
    expect(new Set(GROUP_ORDER).size).toBe(GROUP_ORDER.length)
  })

  it('covers every group used by CATEGORIES', () => {
    const usedGroups = new Set(CATEGORIES.map(c => c.group))
    usedGroups.forEach(g => expect(GROUP_ORDER).toContain(g))
  })
})
