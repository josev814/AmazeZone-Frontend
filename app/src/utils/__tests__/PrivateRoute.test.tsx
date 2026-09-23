import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../PrivateRoute'

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path='/login' element={<div>login page</div>} />
        <Route element={<PrivateRoute />}>
          <Route path='/private' element={<div>secret content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the outlet when an auth token is present', () => {
    window.localStorage.setItem('auth_token', 'a-token')
    renderWithRoutes()
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('redirects to /login when no auth token is present', () => {
    renderWithRoutes()
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })
})