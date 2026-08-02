import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RankRow from '../components/RankRow'

const player = {
  name: 'Test Player',
  _pct: 87.4,
  wc: 1, cont: 0, olympic: 0, goals_i: 10, assists_i: 5,
  ucl: 2, europa: 0, conf: 0, cwc: 0, icc: 0,
  league: 3, domestic: 1, goals_c: 100, assists_c: 40,
  bdor: 0, egs: 0, wcgb: 0, wcboot: 0, glove: 0, puskas: 0,
}

describe('RankRow', () => {
  it('renders the rank number, name and rounded gauge percentage', () => {
    const { container } = render(
      <RankRow player={player} rank={3} onHandlePointerDown={() => {}} rowRef={() => {}} isDragging={false} />
    )
    expect(container.querySelector('.rank-num')).toHaveTextContent('3')
    expect(screen.getByText('Test Player')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument() // gauge span
  })

  it('renders nothing but the list item when dragging', () => {
    render(<RankRow player={player} rank={1} onHandlePointerDown={() => {}} rowRef={() => {}} isDragging={true} />)
    expect(screen.queryByText('Test Player')).not.toBeInTheDocument()
  })

  it('toggles the breakdown open state when the info button is clicked', () => {
    render(<RankRow player={player} rank={1} onHandlePointerDown={() => {}} rowRef={() => {}} isDragging={false} />)
    const toggle = screen.getByRole('button')
    expect(toggle).not.toHaveClass('open')
    fireEvent.click(toggle)
    expect(toggle).toHaveClass('open')
  })

  it('fires the pointer-down handler from the drag handle', () => {
    const onHandlePointerDown = vi.fn()
    const { container } = render(
      <RankRow player={player} rank={1} onHandlePointerDown={onHandlePointerDown} rowRef={() => {}} isDragging={false} />
    )
    fireEvent.pointerDown(container.querySelector('.drag-handle'))
    expect(onHandlePointerDown).toHaveBeenCalledTimes(1)
  })
})
