/**
 * GitHub Models Provider Tests
 *
 * Tests for the GitHub Models LLM provider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitHubModelsProvider, createGitHubModelsProvider } from '../../../../server/services/llm/github'
import { DEFAULT_MODELS } from '../../../../server/services/llm/types'
import type { LLMMessage } from '../../../../server/services/llm/types'

describe('GitHubModelsProvider', () => {
  const mockToken = 'ghp_mock_token_12345'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('constructor', () => {
    it('creates provider with token', () => {
      const provider = new GitHubModelsProvider({ token: mockToken })

      expect(provider.name).toBe('github')
      expect(provider.isConfigured()).toBe(true)
    })

    it('uses default model when not specified', () => {
      const provider = new GitHubModelsProvider({ token: mockToken })

      expect(provider.getDefaultModel()).toBe(DEFAULT_MODELS.github)
    })

    it('uses custom model when specified', () => {
      const provider = new GitHubModelsProvider({
        token: mockToken,
        model: 'custom-model',
      })

      expect(provider.getDefaultModel()).toBe('custom-model')
    })
  })

  describe('isConfigured', () => {
    it('returns true when token is provided', () => {
      const provider = new GitHubModelsProvider({ token: mockToken })

      expect(provider.isConfigured()).toBe(true)
    })

    it('returns false when token is empty', () => {
      const provider = new GitHubModelsProvider({ token: '' })

      expect(provider.isConfigured()).toBe(false)
    })
  })

  describe('complete', () => {
    const mockMessages: LLMMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
    ]

    it('sends request to GitHub Models API', async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: 'assistant', content: 'Hello! How can I help?' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
        model: 'openai/gpt-4o',
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      const result = await provider.complete(mockMessages)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(result.content).toBe('Hello! How can I help?')
      expect(result.provider).toBe('github')
    })

    it('includes correct headers in request', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      await provider.complete(mockMessages)

      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs?.[1]?.headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${mockToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      })
    })

    it('sends messages in request body', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      await provider.complete(mockMessages)

      const callArgs = fetchMock.mock.calls[0]
      const body = JSON.parse(callArgs?.[1]?.body as string)

      expect(body.messages).toHaveLength(2)
      expect(body.messages[0].role).toBe('system')
      expect(body.messages[1].role).toBe('user')
    })

    it('applies default options', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      await provider.complete(mockMessages)

      const callArgs = fetchMock.mock.calls[0]
      const body = JSON.parse(callArgs?.[1]?.body as string)

      expect(body.temperature).toBe(0.7)
      expect(body.max_tokens).toBe(4000)
      expect(body.top_p).toBe(1)
    })

    it('applies custom options', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      await provider.complete(mockMessages, {
        temperature: 0.5,
        maxTokens: 2000,
        topP: 0.9,
        stop: ['STOP'],
      })

      const callArgs = fetchMock.mock.calls[0]
      const body = JSON.parse(callArgs?.[1]?.body as string)

      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(2000)
      expect(body.top_p).toBe(0.9)
      expect(body.stop).toEqual(['STOP'])
    })

    it('returns usage information when available', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      const result = await provider.complete(mockMessages)

      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      })
    })

    it('handles missing usage information', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      const result = await provider.complete(mockMessages)

      expect(result.usage).toBeUndefined()
    })

    it('uses response model when available', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
        model: 'returned-model-name',
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })
      const result = await provider.complete(mockMessages)

      expect(result.model).toBe('returned-model-name')
    })

    it('falls back to configured model when response model missing', async () => {
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Response' } }],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken, model: 'my-model' })
      const result = await provider.complete(mockMessages)

      expect(result.model).toBe('my-model')
    })

    it('throws error when not configured', async () => {
      const provider = new GitHubModelsProvider({ token: '' })

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        'GitHub Models provider is not configured',
      )
    })

    it('throws error on API failure', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        'GitHub Models API error (401): Unauthorized',
      )
    })

    it('throws error when no choices returned', async () => {
      const mockResponse = {
        choices: [],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        'GitHub Models API returned no choices',
      )
    })

    it('throws error when choices is undefined', async () => {
      const mockResponse = {}

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      vi.stubGlobal('fetch', fetchMock)

      const provider = new GitHubModelsProvider({ token: mockToken })

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        'GitHub Models API returned no choices',
      )
    })
  })
})

describe('createGitHubModelsProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns null when GITHUB_TOKEN is not set', () => {
    delete process.env.GITHUB_TOKEN

    const provider = createGitHubModelsProvider()

    expect(provider).toBeNull()
  })

  it('creates provider when GITHUB_TOKEN is set', () => {
    process.env.GITHUB_TOKEN = 'test-token'

    const provider = createGitHubModelsProvider()

    expect(provider).not.toBeNull()
    expect(provider?.isConfigured()).toBe(true)
  })

  it('uses GITHUB_MODEL env var for custom model', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    process.env.GITHUB_MODEL = 'custom-model'

    const provider = createGitHubModelsProvider()

    expect(provider?.getDefaultModel()).toBe('custom-model')
  })

  it('uses default model when GITHUB_MODEL is not set', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    delete process.env.GITHUB_MODEL

    const provider = createGitHubModelsProvider()

    expect(provider?.getDefaultModel()).toBe(DEFAULT_MODELS.github)
  })
})
