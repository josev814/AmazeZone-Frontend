import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'

// The axios interceptor manager exposes its registered handlers as an internal
// (but stable) `handlers` array; the tests invoke the first request
// interceptor directly instead of performing a network request.
type InterceptorConfig = { url?: string; headers?: Record<string, unknown> }
type InterceptorHandlers = Array<{
  fulfilled: (config: InterceptorConfig) => InterceptorConfig
}>
type InterceptorClient = {
  defaults: { baseURL?: string; timeout?: number }
  interceptors: unknown
}
const requestInterceptors = (client: InterceptorClient) =>
  (client.interceptors as unknown as { request: { handlers: InterceptorHandlers } })
    .request.handlers

// AxiosClient reads VITE_RUBY_API_URL once, at module-evaluation time, so this
// file re-evaluates the module (after clearing any cached instance) with the
// env var undefined and asserts the fallback URL. The companion spec
// (AxiosClientBaseUrl.test.tsx) covers the env-defined side.
describe('AxiosClient (VITE_RUBY_API_URL undefined)', () => {
  let axiosClient: InterceptorClient
  let axiosClientWithAuth: InterceptorClient

  beforeAll(async () => {
    delete import.meta.env.VITE_RUBY_API_URL
    vi.resetModules()
    const mod = await import('../AxiosClient')
    axiosClient = mod.axiosClient as InterceptorClient
    axiosClientWithAuth = mod.axiosClientWithAuth as InterceptorClient
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('falls back to the default base URL when the env var is not set', () => {
    expect(axiosClient.defaults.baseURL).toBe('http://localhost:3005')
    expect(axiosClientWithAuth.defaults.baseURL).toBe(axiosClient.defaults.baseURL)
    expect(axiosClient.defaults.timeout).toBe(10000)
    expect(axiosClientWithAuth.defaults.timeout).toBe(10000)
  })

  it('does not attach an Authorization header when no token is stored', () => {
    const config = requestInterceptors(axiosClientWithAuth)[0].fulfilled({
      url: '/',
      headers: {},
    })
    expect((config.headers as Record<string, unknown>).Authorization).toBeUndefined()
  })

  it('attaches a Bearer Authorization header when a token is stored', () => {
    window.localStorage.setItem('auth_token', 'abc123')
    const config = requestInterceptors(axiosClientWithAuth)[0].fulfilled({
      url: '/',
      headers: {},
    })
    expect((config.headers as Record<string, unknown>).Authorization).toBe('Bearer abc123')
  })
})