import { describe, it, expect } from 'vitest'
import { act, screen } from '@testing-library/react'

describe('main', () => {
  it('renders the App into the root element', async () => {
    document.body.innerHTML = '<div id="root"></div>'
    // React 18 createRoot().render() is asynchronous, so flush it inside act().
    await act(async () => {
      await import('../main')
    })
    // main.tsx mounts <App />, whose catch-all route is the Home page.
    expect(screen.getByRole('heading', { name: 'Welcome to AmazeZone' })).toBeInTheDocument()
  })
})