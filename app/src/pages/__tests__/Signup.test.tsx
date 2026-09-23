import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Signup from '../Signup'

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
  id: 2,
  name: 'Grace',
  email_address: 'grace@example.com',
  phone_number: '555-0101',
}

function fillInSignup() {
  // user-event is not concurrency-safe, so the fields are typed one after
  // another instead of with Promise.all.
  return (async () => {
    await userEvent.type(screen.getByPlaceholderText('Username'), 'grace')
    await userEvent.type(screen.getByPlaceholderText('Email'), 'grace@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret1')
    await userEvent.type(screen.getByPlaceholderText('Password Confirmation'), 'secret1')
  })()
}

function renderSignup(onSignupSuccess: () => void) {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path='/home' element={<div>home page</div>} />
        <Route path='/signup' element={<Signup onSignupSuccess={onSignupSuccess} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Signup', () => {
  beforeEach(() => {
    // Reset call counts from previous tests, then apply the default mock:
    // signup fails with validation errors.
    vi.clearAllMocks()
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: { errors: ['Password is too short'] },
    } as never)
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('shows the API validation errors when signup is rejected', async () => {
    const onSignupSuccess = vi.fn()
    renderSignup(onSignupSuccess)
    await fillInSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => expect(screen.getByText('Password is too short')).toBeInTheDocument())
    expect(onSignupSuccess).not.toHaveBeenCalled()
  })

  it('shows the validation errors when the response includes an error list', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      status: 200,
      data: { errors: ['Email is already taken'] },
    } as never)
    const onSignupSuccess = vi.fn()
    renderSignup(onSignupSuccess)
    await fillInSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => expect(screen.getByText('Email is already taken')).toBeInTheDocument())
    expect(onSignupSuccess).not.toHaveBeenCalled()
  })

  it('creates the account, auto signs in and reports success', async () => {
    const signupCalls: Array<Record<string, unknown>> = []
    vi.mocked(axiosClient.post).mockImplementation(async (url: string, body: unknown) => {
      signupCalls.push({ url, body })
      if (url === '/signup') return { status: 200, data: { message: 'User created' } }
      return { status: 200, data: { auth_token: 'tok-3' } }
    })
    vi.mocked(axiosClientWithAuth.get).mockResolvedValue({ data: user } as never)
    const onSignupSuccess = vi.fn()

    renderSignup(onSignupSuccess)
    await fillInSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => expect(onSignupSuccess).toHaveBeenCalledWith(user))
    const signupCall = signupCalls.find((c) => c.url === '/signup')
    expect(signupCall?.body).toEqual({
      user: {
        name: 'grace',
        email_address: 'grace@example.com',
        password: 'secret1',
        password_confirmation: 'secret1',
      },
    })
    expect(
      signupCalls.find((c) => c.url === '/auth/login')?.body,
    ).toEqual({ email_address: 'grace@example.com', password: 'secret1' })
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/auth/current')
    expect(window.localStorage.getItem('auth_token')).toBe('tok-3')
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('falls back to a generic message when signup fails without an error list', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { message: 'failed' } } as never)
    const onSignupSuccess = vi.fn()

    renderSignup(onSignupSuccess)
    await fillInSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() =>
      expect(screen.getByText('Could not create the account. Please try again.')).toBeInTheDocument(),
    )
    expect(onSignupSuccess).not.toHaveBeenCalled()
  })

  it('tells the user to log in manually when the auto sign-in step fails', async () => {
    const signupCalls: Array<Record<string, unknown>> = []
    vi.mocked(axiosClient.post).mockImplementation(async (url: string, body: unknown) => {
      signupCalls.push({ url, body })
      if (url === '/signup') return { status: 200, data: { message: 'User created' } }
      return { status: 200, data: {} }
    })
    const onSignupSuccess = vi.fn()

    renderSignup(onSignupSuccess)
    await fillInSignup()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() =>
      expect(
        screen.getByText('Account created, but automatic sign-in failed. Please log in manually.'),
      ).toBeInTheDocument(),
    )
    expect(onSignupSuccess).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('auth_token')).toBeNull()
    expect(axiosClientWithAuth.get).not.toHaveBeenCalled()
  })
})