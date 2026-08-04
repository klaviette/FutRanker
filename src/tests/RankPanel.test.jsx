import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RankPanel from '../components/RankPanel'

function buildRanked() {
  return [
    { name: 'Player A', _pct: 90 },
    { name: 'Player B', _pct: 70 },
    { name: 'Player C', _pct: 50 },
  ]
}

describe('RankPanel', () => {
  it('renders one row per ranked player in order', () => {
    render(<RankPanel ranked={buildRanked()} selectedConfederations={[]} onToggleConfederation={() => {}} />)
    const names = screen.getAllByText(/Player [ABC]/).map(el => el.textContent)
    expect(names).toEqual(['Player A', 'Player B', 'Player C'])
  })

  it('shows the combined filter count when confederations are selected', () => {
    render(
      <RankPanel ranked={buildRanked()} selectedConfederations={['UEFA']} onToggleConfederation={() => {}} />
    )
    expect(screen.getByRole('button', { name: /Filter \(1\)/ })).toBeInTheDocument()
  })

  it('opens the filter menu and toggles a confederation checkbox', () => {
    const onToggleConfederation = vi.fn()
    render(
      <RankPanel ranked={buildRanked()} selectedConfederations={[]} onToggleConfederation={onToggleConfederation} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
    const uefaCheckbox = screen.getByLabelText('UEFA')
    fireEvent.click(uefaCheckbox)
    expect(onToggleConfederation).toHaveBeenCalledWith('UEFA')
  })

  it('shows the combined filter count when positions are selected', () => {
    render(
      <RankPanel
        ranked={buildRanked()}
        selectedConfederations={[]}
        onToggleConfederation={() => {}}
        positionOptions={['GK', 'FW']}
        selectedPositions={['FW']}
        onTogglePosition={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /Filter \(1\)/ })).toBeInTheDocument()
  })

  it('opens the filter menu and toggles a position checkbox', () => {
    const onTogglePosition = vi.fn()
    render(
      <RankPanel
        ranked={buildRanked()}
        selectedConfederations={[]}
        onToggleConfederation={() => {}}
        positionOptions={['GK', 'FW']}
        selectedPositions={[]}
        onTogglePosition={onTogglePosition}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
    const fwCheckbox = screen.getByLabelText('FW')
    fireEvent.click(fwCheckbox)
    expect(onTogglePosition).toHaveBeenCalledWith('FW')
  })

  it('re-syncs its internal order whenever the ranked prop changes', () => {
    const { rerender } = render(
      <RankPanel ranked={buildRanked()} selectedConfederations={[]} onToggleConfederation={() => {}} />
    )
    const reordered = [
      { name: 'Player C', _pct: 99 },
      { name: 'Player A', _pct: 80 },
      { name: 'Player B', _pct: 60 },
    ]
    rerender(<RankPanel ranked={reordered} selectedConfederations={[]} onToggleConfederation={() => {}} />)
    const names = screen.getAllByText(/Player [ABC]/).map(el => el.textContent)
    expect(names).toEqual(['Player C', 'Player A', 'Player B'])
  })
})
