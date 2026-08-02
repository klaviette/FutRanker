import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DisclaimerPanel from '../components/DisclaimerPanel'

describe('DisclaimerPanel', () => {
  it('renders the About heading and disclaimer copy', () => {
    render(<DisclaimerPanel />)
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
    expect(screen.getByText(/solely for fun/i)).toBeInTheDocument()
    expect(screen.getByText(/TransferMarkt, Wikipedia, and RSSSF/i)).toBeInTheDocument()
  })
})
