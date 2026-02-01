/**
 * LLM Mock Utilities
 *
 * Provides mock factories for LLM responses used in testing.
 */

import { vi } from 'vitest'
import type { LLMCompletionResponse, LLMProvider } from '../../server/services/llm/types'
import type { TasteCategory } from '../../server/database/schema'

/**
 * Default mock taste categories for testing
 */
export const MOCK_TASTE_CATEGORIES: TasteCategory[] = [
  {
    name: 'Technology',
    weight: 0.35,
    description: 'Programming tutorials, tech reviews, and software development content',
    subCategories: ['Web Development', 'AI/ML', 'DevOps'],
  },
  {
    name: 'Gaming',
    weight: 0.25,
    description: 'Indie games, game development, and esports coverage',
    subCategories: ['Indie Games', 'Game Dev'],
  },
  {
    name: 'Science & Education',
    weight: 0.20,
    description: 'Educational content covering physics, mathematics, and general science',
    subCategories: ['Physics', 'Mathematics'],
  },
  {
    name: 'Music',
    weight: 0.20,
    description: 'Music production, electronic music, and lo-fi beats',
    subCategories: ['Electronic', 'Lo-Fi'],
  },
]

/**
 * Default mock analysis summary
 */
export const MOCK_ANALYSIS_SUMMARY =
  'This user has a strong affinity for technology and programming content, ' +
  'balanced with gaming interests focused on indie titles. They also enjoy ' +
  'educational science content and ambient music for focus.'

/**
 * Create a mock LLM completion response
 */
export function createMockLLMResponse(
  content: string,
  options?: Partial<LLMCompletionResponse>,
): LLMCompletionResponse {
  return {
    content,
    model: 'gpt-4o-test',
    provider: 'github' as LLMProvider,
    usage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
    },
    ...options,
  }
}

/**
 * Create a mock taste analysis response (JSON string as LLM would return)
 */
export function createMockTasteAnalysisResponse(
  categories: TasteCategory[] = MOCK_TASTE_CATEGORIES,
  analysisSummary: string = MOCK_ANALYSIS_SUMMARY,
): string {
  return JSON.stringify({
    categories,
    analysisSummary,
  })
}

/**
 * Create a mock recommendations response (JSON string as LLM would return)
 */
export function createMockRecommendationsResponse(
  recommendations?: Array<{
    type: 'channel' | 'hidden_gem' | 'content_gap'
    channelTitle: string
    reason: string
    category: string
    confidenceScore: number
  }>,
): string {
  const defaultRecommendations = [
    {
      type: 'channel' as const,
      channelTitle: 'Fireship',
      reason: 'Matches your interest in web development with quick, informative videos',
      category: 'Technology',
      confidenceScore: 0.92,
    },
    {
      type: 'channel' as const,
      channelTitle: 'ThePrimeagen',
      reason: 'Aligns with your programming interests and tech opinions',
      category: 'Technology',
      confidenceScore: 0.88,
    },
    {
      type: 'hidden_gem' as const,
      channelTitle: 'Low Level Learning',
      reason: 'Smaller channel with deep dives into systems programming',
      category: 'Technology',
      confidenceScore: 0.78,
    },
    {
      type: 'hidden_gem' as const,
      channelTitle: 'Code Aesthetic',
      reason: 'Underrated channel covering code quality and design patterns',
      category: 'Technology',
      confidenceScore: 0.75,
    },
    {
      type: 'content_gap' as const,
      channelTitle: 'Sebastian Lague',
      reason: 'Combines your interests in programming and gaming through creative coding projects',
      category: 'Creative Coding',
      confidenceScore: 0.82,
    },
    {
      type: 'content_gap' as const,
      channelTitle: 'Two Minute Papers',
      reason: 'Would expand your AI/ML interests into cutting-edge research',
      category: 'AI Research',
      confidenceScore: 0.72,
    },
  ]

  return JSON.stringify({
    recommendations: recommendations ?? defaultRecommendations,
  })
}

/**
 * Create a mock for the LLM complete function
 *
 * @param responseContent - The content to return from the mock
 * @returns A mock function that can be used with vi.mock
 */
export function createMockComplete(responseContent: string): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue(createMockLLMResponse(responseContent))
}

/**
 * Create a mock complete function that returns taste analysis
 */
export function createMockTasteAnalysisComplete(): ReturnType<typeof vi.fn> {
  return createMockComplete(createMockTasteAnalysisResponse())
}

/**
 * Create a mock complete function that returns recommendations
 */
export function createMockRecommendationsComplete(): ReturnType<typeof vi.fn> {
  return createMockComplete(createMockRecommendationsResponse())
}

/**
 * Create a mock complete function that fails with an error
 */
export function createMockFailingComplete(errorMessage: string): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error(errorMessage))
}

/**
 * Create a mock complete function that returns invalid JSON
 */
export function createMockInvalidJsonComplete(): ReturnType<typeof vi.fn> {
  return createMockComplete('This is not valid JSON { broken')
}

/**
 * Mock the entire LLM module
 *
 * Usage:
 * ```ts
 * vi.mock('../../server/services/llm', () => mockLLMModule())
 * ```
 */
export function mockLLMModule(
  completeImpl?: ReturnType<typeof vi.fn>,
): Record<string, unknown> {
  return {
    complete: completeImpl ?? createMockTasteAnalysisComplete(),
    ask: vi.fn().mockResolvedValue('Mock response'),
    getLLMProvider: vi.fn().mockReturnValue({
      name: 'github',
      isConfigured: () => true,
      complete: completeImpl ?? createMockTasteAnalysisComplete(),
      getDefaultModel: () => 'gpt-4o-test',
    }),
    isLLMConfigured: vi.fn().mockReturnValue(true),
  }
}
