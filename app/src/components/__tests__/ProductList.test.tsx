import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductList from '../ProductList'

const products = [
  { id: 1, name: 'Widget', category: 'Toys', price: 9.99 },
  { id: 2, name: 'Gadget', category: 'Tools', price: 20 },
]

// Mock must be declared before the component under test is imported.
vi.mock('../../utils/AxiosClient', () => ({
  axiosClientWithAuth: {
    get: vi.fn(),
  },
}))

import { axiosClientWithAuth } from '../../utils/AxiosClient'

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axiosClientWithAuth.get).mockResolvedValue({ data: products } as never)
  })

  it('renders the fetched products with their show/edit/delete links and a new-product link', async () => {
    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>,
    )
    expect(axiosClientWithAuth.get).toHaveBeenCalledWith('/products')

    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(screen.getByText('Widget - Toys - $9.99')).toBeInTheDocument()
    expect(screen.getByText('Gadget - Tools - $20.00')).toBeInTheDocument()
    // Each product row links to its own detail, edit and delete pages.
    expect(screen.getAllByRole('link', { name: 'Show' })[0]).toHaveAttribute('href', '/products/1')
    expect(screen.getAllByRole('link', { name: 'Show' })[1]).toHaveAttribute('href', '/products/2')
    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute('href', '/products/1/edit')
    expect(screen.getAllByRole('link', { name: 'Delete' })[0]).toHaveAttribute('href', '/products/1/delete')
    expect(screen.getByRole('link', { name: 'New Product' })).toHaveAttribute('href', '/products/new')
  })
})
