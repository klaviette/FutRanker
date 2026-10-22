import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SeriesOdds from '../series/SeriesOdds'

// Settings persist in localStorage; start every test from the defaults.
beforeEach(() => { window.localStorage.clear() })

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
    expect(within(screen.getByRole('tabpanel')).getAllByText(/after 3–3/)).toHaveLength(2)
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

  it('shares the series setup between tabs but keeps odds inputs separate', async () => {
    render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'Increase Side A wins' }))
    await userEvent.click(panel().getByRole('button', { name: 'First to' }))
    await userEvent.click(panel().getByRole('button', { name: 'Elo' }))

    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    expect(panel().getByLabelText('Side A wins')).toHaveTextContent('1')
    expect(panel().getByRole('button', { name: 'First to' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(panel().getByRole('button', { name: 'Increase Side B wins' }))

    await userEvent.click(screen.getByRole('tab', { name: /forward/i }))
    expect(panel().getByLabelText('Side B wins')).toHaveTextContent('1')
    expect(panel().getByRole('button', { name: 'Elo' })).toHaveAttribute('aria-pressed', 'true')
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

describe('SeriesOdds saved settings', () => {
  it('remembers format, length, win by 2 and both sliders across a reload', async () => {
    const { unmount } = render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'First to' }))
    await userEvent.click(panel().getByRole('button', { name: 'Increase series length' }))
    await userEvent.click(panel().getByRole('switch', { name: /win by 2/i }))
    const game = panel().getByRole('spinbutton', { name: /per game, percent/i })
    await userEvent.clear(game); await userEvent.type(game, '62.5')
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const series = panel().getByRole('spinbutton', { name: /series odds, percent/i })
    await userEvent.clear(series); await userEvent.type(series, '70')
    await userEvent.click(panel().getByRole('button', { name: 'Increase Side A wins' }))
    unmount()

    render(<SeriesOdds />)
    expect(panel().getByRole('button', { name: 'First to' })).toHaveAttribute('aria-pressed', 'true')
    expect(panel().getByRole('spinbutton', { name: 'First to' })).toHaveValue(5)
    expect(panel().getByRole('switch', { name: /win by 2/i })).toHaveAttribute('aria-checked', 'true')
    expect(panel().getByRole('spinbutton', { name: /per game, percent/i })).toHaveValue(62.5)
    expect(panel().getByLabelText('Side A wins')).toHaveTextContent('0') // score isn't saved
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    expect(panel().getByRole('spinbutton', { name: /series odds, percent/i })).toHaveValue(70)
  })

  it('ignores invalid saved values', () => {
    window.localStorage.setItem('seriesOdds.settings.v1', JSON.stringify({ format: 'bestOf', length: 8, gamePct: 500 }))
    render(<SeriesOdds />)
    const panel = within(screen.getByRole('tabpanel'))
    expect(panel.getByRole('spinbutton', { name: 'Best of' })).toHaveValue(7)
    expect(panel.getByRole('spinbutton', { name: /per game, percent/i })).toHaveValue(50)
  })
})

describe('SeriesOdds reverse odds source', () => {
  it('turns an Elo estimate into series odds and solves back to the same per-game odds', async () => {
    render(<SeriesOdds />)
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'Elo' }))
    const a = panel().getByRole('spinbutton', { name: 'Side A Elo' })
    const b = panel().getByRole('spinbutton', { name: 'Side B Elo' })
    await userEvent.clear(a); await userEvent.type(a, '1900')
    await userEvent.clear(b); await userEvent.type(b, '1500')
    // 400-point edge → 90.9% per game; the solver recovers it from the series odds.
    expect(panel().getByText(/needs to win each game 90\.9% of the time/)).toBeInTheDocument()
  })

  it('hands a record-based series estimate to the manual series slider', async () => {
    render(<SeriesOdds />)
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: 'Record' }))
    const readout = panel().getByText(/series odds:/).querySelector('b').textContent
    await userEvent.click(panel().getByRole('button', { name: 'Fine-tune manually' }))
    expect(panel().getByRole('spinbutton', { name: /series odds, percent/i })).toHaveValue(parseFloat(readout))
  })

  it('keeps each tab’s slider value when switching tabs', async () => {
    render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    const game = panel().getByRole('spinbutton', { name: /per game, percent/i })
    await userEvent.clear(game); await userEvent.type(game, '58')
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const series = panel().getByRole('spinbutton', { name: /series odds, percent/i })
    await userEvent.clear(series); await userEvent.type(series, '81')
    await userEvent.click(screen.getByRole('tab', { name: /forward/i }))
    expect(panel().getByRole('spinbutton', { name: /per game, percent/i })).toHaveValue(58)
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    expect(panel().getByRole('spinbutton', { name: /series odds, percent/i })).toHaveValue(81)
  })
})

describe('SeriesOdds steppers and lines', () => {
  it('steps the percent fields by one point within their limits', async () => {
    render(<SeriesOdds />)
    const panel = () => within(screen.getByRole('tabpanel'))
    await userEvent.click(panel().getByRole('button', { name: /^Increase Side A fair odds/ }))
    expect(panel().getByRole('spinbutton', { name: /per game, percent/i })).toHaveValue(51)
    await userEvent.click(screen.getByRole('tab', { name: /reverse/i }))
    const box = panel().getByRole('spinbutton', { name: /series odds, percent/i })
    await userEvent.clear(box); await userEvent.type(box, '99.5')
    const inc = panel().getByRole('button', { name: /^Increase Side A series odds/ })
    await userEvent.click(inc)
    expect(box).toHaveValue(99.9)
    expect(inc).toBeDisabled()
  })

  it('shows handicap and total-games lines for an even best of 7', () => {
    render(<SeriesOdds />)
    const lines = within(screen.getByRole('tabpanel')).getByRole('heading', { name: /^Lines/ }).closest('section')
    const row = name => within(within(lines).getByRole('rowheader', { name }).closest('tr')).getAllByRole('cell').map(c => c.textContent)
    expect(row('−1.5')).toEqual(['34.4%', '34.4%'])
    expect(row('+1.5')).toEqual(['65.6%', '65.6%'])
    expect(row('5.5')).toEqual(['62.5%', '37.5%'])
  })
})
