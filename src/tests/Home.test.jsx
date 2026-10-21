import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '../home/Home'

describe('Home', () => {
  it('links to the GOAT Calculator', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /The GOAT Calculator/i })
    expect(link).toHaveAttribute('href', '/goat/')
  })
})
