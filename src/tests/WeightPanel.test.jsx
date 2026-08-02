import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import WeightPanel from '../components/WeightPanel'
import { CATEGORIES } from '../data/categories'
import { PRESETS } from '../data/presets'

function buildWeights(value = 5) {
  const w = {}
  CATEGORIES.forEach(c => { w[c.key] = value })
  return w
}

describe('WeightPanel', () => {
  it('renders a preset button for every preset plus randomize', () => {
    render(<WeightPanel weights={buildWeights()} setWeights={() => {}} />)
    Object.keys(PRESETS).forEach(name => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /randomize/i })).toBeInTheDocument()
  })

  it('applies a preset\'s weights when its button is clicked', () => {
    const setWeights = vi.fn()
    render(<WeightPanel weights={buildWeights()} setWeights={setWeights} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(setWeights).toHaveBeenCalledWith(PRESETS.Reset)
  })

  it('sets a random weight for every category when randomize is clicked', () => {
    const setWeights = vi.fn()
    render(<WeightPanel weights={buildWeights()} setWeights={setWeights} />)
    fireEvent.click(screen.getByRole('button', { name: /randomize/i }))
    const nextWeights = setWeights.mock.calls[0][0]
    CATEGORIES.forEach(c => {
      expect(nextWeights[c.key]).toBeGreaterThanOrEqual(0)
      expect(nextWeights[c.key]).toBeLessThanOrEqual(10)
    })
  })

  it('opens the first group by default and toggles others on header click', () => {
    render(<WeightPanel weights={buildWeights()} setWeights={() => {}} />)
    const internationalGroup = screen.getByRole('button', { name: /International/ }).closest('.group')
    const europeGroup = screen.getByRole('button', { name: /Europe/ }).closest('.group')
    expect(internationalGroup).toHaveClass('is-open')
    expect(europeGroup).not.toHaveClass('is-open')

    fireEvent.click(screen.getByRole('button', { name: /Europe/ }))
    expect(europeGroup).toHaveClass('is-open')
  })

  it('updates an individual category weight via its slider', () => {
    const category = CATEGORIES.find(c => c.group === 'International')

    function Harness() {
      const [weights, setWeights] = useState(buildWeights(3))
      return <WeightPanel weights={weights} setWeights={setWeights} />
    }

    render(<Harness />)
    const slider = screen.getByText(category.label).closest('.slider-row').querySelector('input[type="range"]')
    fireEvent.change(slider, { target: { value: '8' } })
    expect(slider.value).toBe('8')
  })
})
