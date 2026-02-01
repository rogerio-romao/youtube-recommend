/**
 * Global Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 */

import { vi, beforeEach, afterEach } from 'vitest'

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
}

// Mock console methods to reduce noise in test output
// Tests can still assert on console calls via vi.spyOn
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// Restore mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})

// Utility to restore console for debugging
export function enableConsole(): void {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
}

// Global fetch mock helper
// Usage: mockFetch({ json: () => Promise.resolve(data), ok: true })
export function mockFetch(response: Partial<Response>): void {
  const mockResponse: Response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => mockResponse,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    bytes: () => Promise.resolve(new Uint8Array()),
    ...response,
  }

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))
}

// Helper to create a mock fetch that returns different responses for different URLs
export function mockFetchMultiple(
  handlers: Record<string, Partial<Response> | (() => Partial<Response>)>,
): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const urlString = url.toString()

      for (const [pattern, handler] of Object.entries(handlers)) {
        if (urlString.includes(pattern)) {
          const response = typeof handler === 'function' ? handler() : handler
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
            ...response,
          })
        }
      }

      // Default: return 404 for unhandled URLs
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not Found' }),
        text: () => Promise.resolve('Not Found'),
      })
    }),
  )
}

// Reset fetch mock
export function resetFetchMock(): void {
  vi.unstubAllGlobals()
}
