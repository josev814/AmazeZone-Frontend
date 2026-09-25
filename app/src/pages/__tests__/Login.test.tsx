import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from '../Login'

// Mock must be declared before the component under test is imported.
vi.mock('../../utils/AxiosClient', () => ({
  axiosClient: {
    post: vi.fn(),
  },
  axiosClientWithAuth: {
    get: vi.fn(),
  },
}))

import { axiosClient, axiosClientWithAuth } from '../../utils/AxiosClient'

const user = {
  id: 1,
  name: 'Ada',
  email_address: 'ada@example.com',
  phone_number: '555-0100',
}

function renderLogin(handleLogin: () => void) {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path='/home' element={<div>home page</div>} />
        <Route path='/login' element={<Login handleLogin={handleLogin} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    // Reset call counts from previous tests.
    vi.clearAllMocks()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('stores the token, loads the current user and signs in', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { auth_token: 'tok-1' } } as never)
    vi.mocked(axiosClientWithAuth.get).mockResolvedValue({ data: user } as never)
    const handleLogin = vi.fn()

    renderLogin(handleLogin)
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(handleLogin).toHaveBeenCalledWith(user))
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      email_address: 'ada@example.com',
      password: 'secret',
    })
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/auth/current')
    expect(window.localStorage.getItem('auth_token')).toBe('tok-1')
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('shows validation errors when the login response has no token', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { errors: ['Invalid credentials'] } } as never)
    const handleLogin = vi.fn()

    renderLogin(handleLogin)
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'wrong@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    expect(handleLogin).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('auth_token')).toBeNull()
  })

  it('keeps the session error visible when loading the current user fails', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { auth_token: 'tok-2' } } as never)
    vi.mocked(axiosClientWithAuth.get).mockRejectedValue(new Error('boom'))
    const handleLogin = vi.fn()

    renderLogin(handleLogin)
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() =>
      expect(
        screen.getByText('Logged in, but could not load your account details. Please try again.'),
      ).toBeInTheDocument(),
    )
    expect(handleLogin).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('auth_token')).toBe('tok-2')
  })
})
