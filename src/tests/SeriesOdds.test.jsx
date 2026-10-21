import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SeriesOdds from '../series/SeriesOdds'

describe('SeriesOdds', () => {
  it('keeps the same wins needed when switching best of 7 to first to', async () => {
    render(<SeriesOdds />)
    await userEvent.click(screen.getByRole('button', { name: 'First to' }))
    expect(screen.getByRole('spinbutton', { name: 'First to' })).toHaveValue(4)
  })

  it('shows extra-game outcomes when win by 2 is on', async () => {
    render(<SeriesOdds />)
    expect(screen.queryByText(/after 3–3/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('switch', { name: /win by 2/i }))
    expect(screen.getAllByText(/after 3–3/)).toHaveLength(2)
  })

  it('lets a side go past target - 1 only with win by 2', async () => {
    render(<SeriesOdds />)
    const incA = screen.getByRole('button', { name: 'Increase Side A wins' })
    for (let i = 0; i < 3; i++) await userEvent.click(incA)
    expect(incA).toBeDisabled()
    await userEvent.click(screen.getByRole('switch', { name: /win by 2/i }))
    const incB = screen.getByRole('button', { name: 'Increase Side B wins' })
    for (let i = 0; i < 3; i++) await userEvent.click(incB)
    expect(incA).not.toBeDisabled() // 3–3: A can go to 4–3
  })
})

describe('SeriesOdds chart', () => {
  it('collapses and expands the odds chart', async () => {
    render(<SeriesOdds />)
    const toggle = screen.getByRole('button', { name: /series odds by game odds/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('img', { name: /series win chance/i })).toBeInTheDocument()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('img', { name: /series win chance/i })).not.toBeInTheDocument()
  })
})

describe('SeriesOdds reverse tab', () => {
  it('solves the per-game odds from series odds', async () => {
    render(<SeriesOdds />)
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const box = screen.getByRole('spinbutton', { name: /series odds, percent/i })
    await userEvent.clear(box)
    await userEvent.type(box, '50')
    expect(screen.getByText(/needs to win each game 50\.0% of the time/)).toBeInTheDocument()
  })

  it('keeps each tab’s setup independent', async () => {
    render(<SeriesOdds />)
    await userEvent.click(screen.getByRole('button', { name: 'Increase Side A wins' }))
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    expect(within(screen.getByRole('tabpanel')).getByLabelText('Side A wins')).toHaveTextContent('0')
    await userEvent.click(screen.getByRole('tab', { name: /forward/i }))
    expect(within(screen.getByRole('tabpanel')).getByLabelText('Side A wins')).toHaveTextContent('1')
  })
})

describe('SeriesOdds per-game odds source', () => {
  it('estimates per-game odds from Elo ratings', async () => {
    render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'Elo' }))
    const a = panel().getByRole('spinbutton', { name: 'Side A Elo' })
    const b = panel().getByRole('spinbutton', { name: 'Side B Elo' })
    await userEvent.clear(a); await userEvent.type(a, '1900')
    await userEvent.clear(b); await userEvent.type(b, '1500')
    expect(panel().getByText('90.9%')).toBeInTheDocument()
  })

  it('hands a record estimate over to the manual slider', async () => {
    render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'Record' }))
    await userEvent.click(panel().getByRole('button', { name: 'Fine-tune manually' }))
    // Defaults 10–5 vs 8–7 → log5 ≈ 63.6%
    expect(panel().getByRole('spinbutton', { name: /per game, percent/i })).toHaveValue(63.6)
  })
})
