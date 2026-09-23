import { describe, it, expect, vi, beforeAll } from 'vitest'

// This spec covers the "VITE_RUBY_API_URL defined" side of the fallback in
// AxiosClient.tsx. The module reads the env var once at evaluation time, and
// vitest may serve a cached evaluation to test files running in the same
// worker, so the env var is set and the module registry is reset before the
// dynamic import. (AxiosClient.test.tsx covers the fallback side.)
describe('AxiosClient base URL with VITE_RUBY_API_URL defined', () => {
  let axiosClient: { defaults: { baseURL?: string } }
  let axiosClientWithAuth: { defaults: { baseURL?: string } }

  beforeAll(async () => {
    import.meta.env.VITE_RUBY_API_URL = 'http://env-defined.example'
    vi.resetModules()
    const mod = await import('../AxiosClient')
    axiosClient = mod.axiosClient
    axiosClientWithAuth = mod.axiosClientWithAuth
    delete import.meta.env.VITE_RUBY_API_URL
  })

  it('uses VITE_RUBY_API_URL as the base URL when the env var is defined', () => {
    expect(axiosClient.defaults.baseURL).toBe('http://env-defined.example')
    expect(axiosClientWithAuth.defaults.baseURL).toBe('http://env-defined.example')
  })
})