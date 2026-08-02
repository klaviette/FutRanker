import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { PLAYERS as FALLBACK_PLAYERS } from '../data/players'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state before player data resolves', () => {
    fetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<App />)
    expect(screen.getByText(/Loading players/i)).toBeInTheDocument()
  })

  it('renders the ranked list once remote data loads successfully', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => FALLBACK_PLAYERS })
    render(<App />)
    await waitFor(() => expect(screen.getByText('Your Top 10')).toBeInTheDocument())
    expect(screen.queryByText(/Couldn't reach the live player data/i)).not.toBeInTheDocument()
  })

  it('falls back to bundled data and shows a warning when the fetch fails', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 })
    render(<App />)
    await waitFor(() => expect(screen.getByText(/Couldn't reach the live player data/i)).toBeInTheDocument())
    expect(screen.getByText('Your Top 10')).toBeInTheDocument()
  })
})
