import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProductDelete from '../ProductDelete'

// Mock must be declared before the component under test is imported.
vi.mock('../../utils/AxiosClient', () => ({
  axiosClientWithAuth: {
    delete: vi.fn(),
  },
}))

import { axiosClientWithAuth } from '../../utils/AxiosClient'

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/products/${id}/delete`]} key={id}>
      <Routes>
        <Route path='/products' element={<div>product list page</div>} />
        <Route path='/products/:id/delete' element={<ProductDelete />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(axiosClientWithAuth.delete).mockResolvedValue({ data: {} } as never)
  })

  it('deletes the product and returns to the list when the user confirms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderAt('7')

    await userEvent.click(screen.getByRole('button', { name: 'Delete Product' }))
    await waitFor(() => expect(axiosClientWithAuth.delete).toHaveBeenCalledWith('/products/7'))
    expect(screen.getByText('product list page')).toBeInTheDocument()
  })

  it('does nothing when the user cancels the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderAt('8')

    await userEvent.click(screen.getByRole('button', { name: 'Delete Product' }))
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(axiosClientWithAuth.delete).not.toHaveBeenCalled()
  })
})