import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProductDetail from '../ProductDetail'

const product = {
  id: 1,
  name: 'Widget',
  category: 'Toys',
  quantity: 3,
  price: 9.99,
}

// Mock must be declared before the component under test is imported.
vi.mock('../../utils/AxiosClient', () => ({
  axiosClientWithAuth: {
    get: vi.fn(),
  },
}))

import { axiosClientWithAuth } from '../../utils/AxiosClient'

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path='/products/:id' element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axiosClientWithAuth.get).mockResolvedValue({ data: product } as never)
  })

  it('shows a loading state before the product arrives', async () => {
    renderAt('1')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    // Drain the mocked fetch so no state update fires outside act().
    await screen.findByText('Widget')
  })

  it('renders the product details with edit and delete links once loaded', async () => {
    renderAt('1')
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/products/1')

    expect(await screen.findByText('Widget')).toBeInTheDocument()
    expect(screen.getByText('Toys')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('$9.99')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/products/1/edit')
    expect(screen.getByRole('link', { name: 'Delete' })).toHaveAttribute('href', '/products/1/delete')
  })
})