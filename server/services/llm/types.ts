/**
 * LLM Provider Types and Interfaces
 */

export type LLMProvider = 'github' | 'openai' | 'anthropic' | 'ollama'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
}

export interface LLMCompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: LLMProvider
}

export interface LLMProviderInterface {
  /**
   * The provider name
   */
  readonly name: LLMProvider

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean

  /**
   * Send a chat completion request
   */
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResponse>

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string
}

export interface LLMConfig {
  provider: LLMProvider
  github?: {
    token: string
    model?: string
  }
  openai?: {
    apiKey: string
    model?: string
  }
  anthropic?: {
    apiKey: string
    model?: string
  }
  ollama?: {
    baseUrl: string
    model?: string
  }
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  github: 'openai/gpt-4o',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-latest',
  ollama: 'llama3.2',
}
