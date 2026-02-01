/**
 * Recommender Service Tests
 *
 * Tests for the recommendation service including pure functions
 * and the main generateRecommendations function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatCategories,
  formatExclusions,
  buildRecommendationsPrompt,
  parseRecommendationsResponse,
  generateRecommendations,
} from '../../../server/services/recommender'
import type { RecommendationsInput } from '../../../server/services/recommender'
import {
  createMockRecommendationsResponse,
  MOCK_TASTE_CATEGORIES,
  MOCK_ANALYSIS_SUMMARY,
} from '../../mocks/llm'

// Mock the LLM module
vi.mock('../../../server/services/llm', () => ({
  complete: vi.fn(),
}))

describe('Recommender Service', () => {
  describe('formatCategories', () => {
    it('formats categories with weights as percentages', () => {
      const categories = [
        { name: 'Technology', weight: 0.35, description: 'Tech content' },
        { name: 'Gaming', weight: 0.25, description: 'Gaming content' },
      ]

      const result = formatCategories(categories)

      expect(result).toContain('Technology (35%)')
      expect(result).toContain('Gaming (25%)')
    })

    it('sorts categories by weight (highest first)', () => {
      const categories = [
        { name: 'Low', weight: 0.1, description: 'Low weight' },
        { name: 'High', weight: 0.5, description: 'High weight' },
        { name: 'Medium', weight: 0.3, description: 'Medium weight' },
      ]

      const result = formatCategories(categories)
      const lines = result.split('\n')

      expect(lines[0]).toContain('High')
      expect(lines[1]).toContain('Medium')
      expect(lines[2]).toContain('Low')
    })

    it('includes subcategories when present', () => {
      const categories = [
        {
          name: 'Technology',
          weight: 0.5,
          description: 'Tech content',
          subCategories: ['Web Dev', 'AI/ML'],
        },
      ]

      const result = formatCategories(categories)

      expect(result).toContain('(Web Dev, AI/ML)')
    })

    it('handles categories without subcategories', () => {
      const categories = [
        { name: 'Technology', weight: 0.5, description: 'Tech content' },
      ]

      const result = formatCategories(categories)

      expect(result).toContain('Technology (50%): Tech content')
      expect(result).not.toContain('undefined')
    })

    it('returns empty string for empty array', () => {
      const result = formatCategories([])

      expect(result).toBe('')
    })
  })

  describe('formatExclusions', () => {
    it('formats a list of subscriptions as comma-separated', () => {
      const subscriptions = ['Channel A', 'Channel B', 'Channel C']

      const result = formatExclusions(subscriptions)

      expect(result).toBe('Channel A, Channel B, Channel C')
    })

    it('returns "None" for empty array', () => {
      const result = formatExclusions([])

      expect(result).toBe('None')
    })

    it('limits to maxItems', () => {
      const subscriptions = Array.from({ length: 150 }, (_, i) => `Channel ${i}`)

      const result = formatExclusions(subscriptions, 100)
      const items = result.split(', ')

      expect(items).toHaveLength(100)
    })

    it('respects custom maxItems parameter', () => {
      const subscriptions = ['A', 'B', 'C', 'D', 'E']

      const result = formatExclusions(subscriptions, 3)

      expect(result).toBe('A, B, C')
    })
  })

  describe('buildRecommendationsPrompt', () => {
    it('includes the analysis summary', () => {
      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: 'User loves tech content',
        },
        existingSubscriptions: [],
      }

      const result = buildRecommendationsPrompt(input)

      expect(result).toContain('User loves tech content')
    })

    it('includes formatted categories', () => {
      const input: RecommendationsInput = {
        tasteProfile: {
          categories: [
            { name: 'Technology', weight: 0.6, description: 'Tech stuff' },
          ],
          analysisSummary: 'Summary',
        },
        existingSubscriptions: [],
      }

      const result = buildRecommendationsPrompt(input)

      expect(result).toContain('Technology (60%)')
      expect(result).toContain('Tech stuff')
    })

    it('includes exclusion list', () => {
      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: 'Summary',
        },
        existingSubscriptions: ['Fireship', 'ThePrimeagen'],
      }

      const result = buildRecommendationsPrompt(input)

      expect(result).toContain('Fireship, ThePrimeagen')
    })

    it('shows "None" when no exclusions', () => {
      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: 'Summary',
        },
        existingSubscriptions: [],
      }

      const result = buildRecommendationsPrompt(input)

      expect(result).toContain('None')
    })
  })

  describe('parseRecommendationsResponse', () => {
    it('parses a valid JSON response', () => {
      const responseJson = createMockRecommendationsResponse()

      const result = parseRecommendationsResponse(responseJson)

      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('handles markdown code blocks', () => {
      const responseJson = createMockRecommendationsResponse()
      const wrappedResponse = '```json\n' + responseJson + '\n```'

      const result = parseRecommendationsResponse(wrappedResponse)

      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('validates recommendation types', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'Test', reason: 'Test reason', category: 'Tech', confidenceScore: 0.8 },
          { type: 'hidden_gem', channelTitle: 'Test 2', reason: 'Test reason', category: 'Tech', confidenceScore: 0.7 },
          { type: 'content_gap', channelTitle: 'Test 3', reason: 'Test reason', category: 'Tech', confidenceScore: 0.6 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.type).toBe('channel')
      expect(result.recommendations[1]?.type).toBe('hidden_gem')
      expect(result.recommendations[2]?.type).toBe('content_gap')
    })

    it('defaults invalid type to "channel"', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'invalid_type', channelTitle: 'Test', reason: 'Test reason', category: 'Tech', confidenceScore: 0.8 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.type).toBe('channel')
    })

    it('defaults missing category to "General"', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'Test', reason: 'Test reason', confidenceScore: 0.8 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.category).toBe('General')
    })

    it('defaults missing confidenceScore to 0.7', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'Test', reason: 'Test reason', category: 'Tech' },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.confidenceScore).toBe(0.7)
    })

    it('clamps confidenceScore between 0 and 1', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'High', reason: 'Test', category: 'Tech', confidenceScore: 1.5 },
          { type: 'channel', channelTitle: 'Low', reason: 'Test', category: 'Tech', confidenceScore: -0.5 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.confidenceScore).toBe(1)
      expect(result.recommendations[1]?.confidenceScore).toBe(0)
    })

    it('skips recommendations missing channelTitle', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', reason: 'Test reason', category: 'Tech', confidenceScore: 0.8 },
          { type: 'channel', channelTitle: 'Valid', reason: 'Test reason', category: 'Tech', confidenceScore: 0.8 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0]?.channelTitle).toBe('Valid')
    })

    it('skips recommendations missing reason', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'No Reason', category: 'Tech', confidenceScore: 0.8 },
          { type: 'channel', channelTitle: 'Valid', reason: 'Has reason', category: 'Tech', confidenceScore: 0.8 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations).toHaveLength(1)
      expect(result.recommendations[0]?.channelTitle).toBe('Valid')
    })

    it('includes optional channelId when present', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'Test', channelId: 'UC12345', reason: 'Test', category: 'Tech', confidenceScore: 0.8 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.channelId).toBe('UC12345')
    })

    it('includes optional subscriberCount when present', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel', channelTitle: 'Test', reason: 'Test', category: 'Tech', confidenceScore: 0.8, subscriberCount: 1000000 },
        ],
      })

      const result = parseRecommendationsResponse(response)

      expect(result.recommendations[0]?.subscriberCount).toBe(1000000)
    })

    it('throws error for invalid JSON', () => {
      expect(() => parseRecommendationsResponse('not valid json {')).toThrow('Failed to parse LLM response as JSON')
    })

    it('throws error for missing recommendations array', () => {
      const response = JSON.stringify({ other: 'data' })

      expect(() => parseRecommendationsResponse(response)).toThrow('missing recommendations array')
    })

    it('throws error when all recommendations are invalid', () => {
      const response = JSON.stringify({
        recommendations: [
          { type: 'channel' }, // missing required fields
          { channelTitle: 'Test' }, // missing reason
        ],
      })

      expect(() => parseRecommendationsResponse(response)).toThrow('No valid recommendations')
    })

    it('throws error for non-object response', () => {
      expect(() => parseRecommendationsResponse('"just a string"')).toThrow('LLM response is not an object')
    })
  })

  describe('generateRecommendations', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('throws error when no taste profile categories', async () => {
      const input: RecommendationsInput = {
        tasteProfile: {
          categories: [],
          analysisSummary: 'Empty profile',
        },
        existingSubscriptions: [],
      }

      await expect(generateRecommendations(input)).rejects.toThrow(
        'No taste profile available',
      )
    })

    it('calls LLM complete with correct messages', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockRecommendationsResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: MOCK_ANALYSIS_SUMMARY,
        },
        existingSubscriptions: ['Fireship'],
      }

      await generateRecommendations(input)

      expect(mockComplete).toHaveBeenCalledTimes(1)
      const callArgs = mockComplete.mock.calls[0]
      expect(callArgs?.[0]).toHaveLength(2) // system + user messages
      expect(callArgs?.[0]?.[0]?.role).toBe('system')
      expect(callArgs?.[0]?.[1]?.role).toBe('user')
    })

    it('returns parsed recommendations result', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockRecommendationsResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: MOCK_ANALYSIS_SUMMARY,
        },
        existingSubscriptions: [],
      }

      const result = await generateRecommendations(input)

      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('passes temperature and maxTokens to LLM', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockRecommendationsResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: RecommendationsInput = {
        tasteProfile: {
          categories: MOCK_TASTE_CATEGORIES,
          analysisSummary: MOCK_ANALYSIS_SUMMARY,
        },
        existingSubscriptions: [],
      }

      await generateRecommendations(input)

      const callArgs = mockComplete.mock.calls[0]
      expect(callArgs?.[1]).toEqual({
        temperature: 0.8,
        maxTokens: 3000,
      })
    })
  })
})
