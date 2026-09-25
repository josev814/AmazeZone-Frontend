import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../Navbar'

describe('Navbar', () => {
  it('links to the site root and hides logout when not logged in', () => {
    const handleLogout = vi.fn()
    render(
      <MemoryRouter>
        <Navbar isLoggedIn={false} handleLogout={handleLogout} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  it('links to /home and calls handleLogout when logged in', async () => {
    const handleLogout = vi.fn()
    render(
      <MemoryRouter>
        <Navbar isLoggedIn={true} handleLogout={handleLogout} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(handleLogout).toHaveBeenCalledTimes(1)
  })
})
