import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock must be declared before App (and its transitive imports) load.
vi.mock('../utils/AxiosClient', () => ({
  axiosClient: {
    post: vi.fn(),
  },
  axiosClientWithAuth: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { axiosClient, axiosClientWithAuth } from '../utils/AxiosClient'

const product = { id: 1, name: 'Widget', category: 'Toys', quantity: 3, price: 9.99 }

function renderApp(route: string) {
  // React Router's BrowserRouter reads the initial location from the history
  // state, so the target route must be set before the app mounts.
  window.history.pushState({}, '', route)
  return render(<App />)
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.setItem('auth_token', 'seed-token')
    vi.mocked(axiosClient.post).mockImplementation(async (url: string) => {
      if (url === '/auth/login') return { status: 200, data: { auth_token: 'new-token' } }
      return { status: 200, data: { message: 'User created' } }
    })
    vi.mocked(axiosClientWithAuth.get).mockImplementation(async (url: string) => {
      if (url === '/auth/current') {
        return { data: { id: 1, name: 'Ada', email_address: 'ada@example.com' } }
      }
      if (url === '/products') return { data: [product] }
      return { data: product }
    })
    vi.mocked(axiosClientWithAuth.post).mockResolvedValue({ data: product } as never)
    vi.mocked(axiosClientWithAuth.put).mockResolvedValue({ data: product } as never)
    vi.mocked(axiosClientWithAuth.delete).mockResolvedValue({ data: {} } as never)
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('shows the Home page for unmatched routes when logged out', () => {
    window.localStorage.clear()
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Welcome to AmazeZone' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  it('redirects /home to the login page when there is no token', async () => {
    window.localStorage.clear()
    renderApp('/home')
    expect(await screen.findByPlaceholderText('Email Address')).toBeInTheDocument()
  })

  it('renders the user dashboard at /home when a token exists', async () => {
    renderApp('/home')
    expect(await screen.findByRole('heading', { name: /Welcome/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Products' })).toHaveAttribute('href', '/products')
    // The route guard passes via the stored token, but App's own isLoggedIn
    // state is still false, so the navbar shows its logged-out variant.
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  it('logs in from /login and lands on the dashboard', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => expect(screen.getByText('Welcome Ada')).toBeInTheDocument())
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      email_address: 'ada@example.com',
      password: 'secret',
    })
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/auth/current')
    expect(window.localStorage.getItem('auth_token')).toBe('new-token')
  })
  it('signs up, auto-logs-in, then logs out to reveal the success banner on Home', async () => {
    renderApp('/signup')
    await userEvent.type(screen.getByPlaceholderText('Username'), 'ada')
    await userEvent.type(screen.getByPlaceholderText('Email'), 'ada@example.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret')
    await userEvent.type(screen.getByPlaceholderText('Password Confirmation'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Auto sign-in succeeded: the dashboard greets the new user.
    await waitFor(() => expect(screen.getByText('Welcome Ada')).toBeInTheDocument())
    expect(axiosClient.post).toHaveBeenCalledWith('/signup', {
      user: {
        name: 'ada',
        email_address: 'ada@example.com',
        password: 'secret',
        password_confirmation: 'secret',
      },
    })
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
      email_address: 'ada@example.com',
      password: 'secret',
    })

    // Logging out clears the session; the Home link now targets the site root,
    // and the catch-all Home page still shows the signup success banner.
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(window.localStorage.getItem('auth_token')).toBeNull()
    await userEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByText('Welcome to AmazeZone')).toBeInTheDocument()
    expect(screen.getByText('Sign up successful')).toBeInTheDocument()
  })

  it('lists products at /products', async () => {
    renderApp('/products')
    await waitFor(() => expect(screen.getByText('Widget - Toys - $9.99')).toBeInTheDocument())
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/products')
  })

  it('shows a product at /products/:id', async () => {
    renderApp('/products/1')
    expect(await screen.findByText('Widget')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/products/1/edit')
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/products/1')
  })

  it('creates a product from /products/new and returns to the list', async () => {
    renderApp('/products/new')
    expect(screen.getByRole('heading', { name: 'Create Product' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'New Widget' } })
    fireEvent.change(screen.getByLabelText('Quantity:'), { target: { value: '4' } })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() =>
      expect(axiosClientWithAuth.post).toHaveBeenCalledWith('/products', {
        name: 'New Widget',
        category: '',
        quantity: '4',
        price: 0,
      }),
    )
    expect(await screen.findByText('Widget - Toys - $9.99')).toBeInTheDocument()
  })

  it('edits a product from /products/:id/edit and returns to the list', async () => {
    renderApp('/products/1/edit')
    expect(screen.getByRole('heading', { name: 'Edit Product' })).toBeInTheDocument()
    // Wait for the existing product to be loaded into the form.
    await waitFor(() => expect(screen.getByDisplayValue('Widget')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Widget v2' } })

    await userEvent.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(axiosClientWithAuth.put).toHaveBeenCalledWith('/products/1', {
        ...product,
        name: 'Widget v2',
      }),
    )
    expect(await screen.findByText('Widget - Toys - $9.99')).toBeInTheDocument()
  })

  it('deletes a product from /products/:id/delete and returns to the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderApp('/products/1/delete')
    await userEvent.click(screen.getByRole('button', { name: 'Delete Product' }))

    await waitFor(() => expect(axiosClientWithAuth.delete).toHaveBeenCalledWith('/products/1'))
    expect(await screen.findByText('Widget - Toys - $9.99')).toBeInTheDocument()
  })
})