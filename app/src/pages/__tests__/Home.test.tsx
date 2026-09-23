import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../Home'

function renderHome(signupSuccess: boolean) {
  return render(
    <MemoryRouter>
      <Home signupSuccess={signupSuccess} />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('shows the welcome heading, intro copy and login/signup links', () => {
    renderHome(false)
    expect(screen.getByRole('heading', { name: 'Welcome to AmazeZone' })).toBeInTheDocument()
    expect(screen.getByText('Get started by logging in or signing up:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/signup')
    expect(screen.queryByText('Sign up successful')).not.toBeInTheDocument()
  })

  it('shows the success message when signupSuccess is true', () => {
    renderHome(true)
    expect(screen.getByText('Sign up successful')).toBeInTheDocument()
  })
})