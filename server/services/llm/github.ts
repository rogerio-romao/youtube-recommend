/**
 * GitHub Models Provider
 *
 * Uses the GitHub Models API (https://models.github.ai) which is available
 * to GitHub Copilot subscribers. This is the recommended/default provider.
 *
 * Requires a GitHub Personal Access Token with `models:read` permission.
 */

import type {
  LLMCompletionOptions,
  LLMCompletionResponse,
  LLMMessage,
  LLMProviderInterface,
} from './types'
import { DEFAULT_MODELS } from './types'

const GITHUB_MODELS_API_URL = 'https://models.github.ai/inference/chat/completions'

interface GitHubModelsConfig {
  token: string
  model?: string
}

interface GitHubModelsMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GitHubModelsChoice {
  message: {
    role: string
    content: string
  }
  finish_reason?: string
}

interface GitHubModelsResponse {
  choices: GitHubModelsChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
}

export class GitHubModelsProvider implements LLMProviderInterface {
  readonly name = 'github' as const
  private token: string
  private model: string

  constructor(config: GitHubModelsConfig) {
    this.token = config.token
    this.model = config.model ?? DEFAULT_MODELS.github
  }

  isConfigured(): boolean {
    return Boolean(this.token)
  }

  getDefaultModel(): string {
    return this.model
  }

  async complete(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {},
  ): Promise<LLMCompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error('GitHub Models provider is not configured. Set GITHUB_TOKEN environment variable.')
    }

    const formattedMessages: GitHubModelsMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    const requestBody = {
      model: this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      top_p: options.topP ?? 1,
      stop: options.stop,
    }

    const response = await fetch(GITHUB_MODELS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub Models API error (${response.status}): ${errorText}`)
    }

    const data: GitHubModelsResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('GitHub Models API returned no choices')
    }

    const choice = data.choices[0]

    if (!choice) {
      throw new Error('GitHub Models API returned empty choice')
    }

    return {
      content: choice.message.content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: data.model ?? this.model,
      provider: 'github',
    }
  }
}

/**
 * Create a GitHub Models provider from environment variables
 */
export function createGitHubModelsProvider(): GitHubModelsProvider | null {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return null
  }

  return new GitHubModelsProvider({
    token,
    model: process.env.GITHUB_MODEL ?? DEFAULT_MODELS.github,
  })
}
