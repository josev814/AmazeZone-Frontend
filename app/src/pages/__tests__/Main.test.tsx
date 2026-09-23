import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Main from '../Main'

describe('Main', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('greets the user by name and links to the product list', () => {
    render(
      <MemoryRouter>
        <Main user={{ id: 1, name: 'Ada' }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Welcome Ada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Products' })).toHaveAttribute('href', '/products')
  })

  it('renders with an empty user when none is provided (default parameter)', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    // Spread an (intentionally empty) props object so TypeScript accepts the
    // call while, at runtime, `user` is undefined and Main's `user = {}`
    // default parameter branch is exercised.
    const missingUserProps = {} as ComponentProps<typeof Main>
    render(
      <MemoryRouter>
        <Main {...missingUserProps} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /Welcome/ })).toBeInTheDocument()
    expect(consoleSpy).toHaveBeenCalledWith('User object in Main component:', {})
  })
})