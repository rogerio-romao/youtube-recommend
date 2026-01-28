/**
 * LLM Service
 *
 * Provides a unified interface for LLM interactions.
 * Currently supports GitHub Models (recommended for Copilot subscribers).
 *
 * Future providers (OpenAI, Anthropic, Ollama) can be added later.
 */

import { createGitHubModelsProvider } from './github'
import type {
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMMessage,
  LLMProviderInterface,
} from './types'

export * from './types'
export { GitHubModelsProvider } from './github'

let cachedProvider: LLMProviderInterface | null = null

/**
 * Get the configured LLM provider
 *
 * Currently only GitHub Models is supported.
 * The provider is cached for the lifetime of the server.
 */
export function getLLMProvider(): LLMProviderInterface {
  if (cachedProvider) {
    return cachedProvider
  }

  // Try GitHub Models first (recommended/default)
  const githubProvider = createGitHubModelsProvider()
  if (githubProvider?.isConfigured()) {
    cachedProvider = githubProvider
    console.log('[LLM] Using GitHub Models provider')
    return cachedProvider
  }

  // No provider configured
  throw new Error(
    'No LLM provider configured. Please set GITHUB_TOKEN environment variable with a token that has models:read permission.',
  )
}

/**
 * Check if an LLM provider is available
 */
export function isLLMConfigured(): boolean {
  try {
    getLLMProvider()
    return true
  }
  catch {
    return false
  }
}

/**
 * Convenience function to complete a chat
 */
export async function complete(
  messages: LLMMessage[],
  options?: LLMCompletionOptions,
): Promise<LLMCompletionResponse> {
  const provider = getLLMProvider()
  return provider.complete(messages, options)
}

/**
 * Convenience function to complete with a single user message
 */
export async function ask(
  prompt: string,
  systemPrompt?: string,
  options?: LLMCompletionOptions,
): Promise<string> {
  const messages: LLMMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await complete(messages, options)
  return response.content
}
