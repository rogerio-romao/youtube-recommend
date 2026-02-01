/**
 * Analyzer Service Tests
 *
 * Tests for the taste analyzer service including pure functions
 * and the main analyzeTaste function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatSubscriptions,
  formatLikedVideos,
  buildAnalysisPrompt,
  parseAnalysisResponse,
  analyzeTaste,
} from '../../../server/services/analyzer'
import type { ChannelData, VideoData, TasteAnalysisInput } from '../../../server/services/analyzer'
import {
  createMockChannelDataList,
  createMockVideoDataList,
} from '../../mocks/youtube'
import {
  createMockTasteAnalysisResponse,
  MOCK_TASTE_CATEGORIES,
  MOCK_ANALYSIS_SUMMARY,
} from '../../mocks/llm'

// Mock the LLM module
vi.mock('../../../server/services/llm', () => ({
  complete: vi.fn(),
}))

describe('Analyzer Service', () => {
  describe('formatSubscriptions', () => {
    it('formats a list of subscriptions correctly', () => {
      const subscriptions: ChannelData[] = [
        {
          channelTitle: 'Fireship',
          channelDescription: 'High-intensity code tutorials',
          subscriberCount: 2500000,
          videoCount: 500,
        },
        {
          channelTitle: 'ThePrimeagen',
          channelDescription: 'Netflix engineer talks programming',
          subscriberCount: 500000,
          videoCount: 400,
        },
      ]

      const result = formatSubscriptions(subscriptions)

      expect(result).toContain('- Fireship')
      expect(result).toContain('(High-intensity code tutorials)')
      expect(result).toContain('- ThePrimeagen')
      expect(result).toContain('(Netflix engineer talks programming)')
    })

    it('truncates long descriptions to 100 characters', () => {
      const longDescription = 'A'.repeat(150)
      const subscriptions: ChannelData[] = [
        {
          channelTitle: 'Test Channel',
          channelDescription: longDescription,
          subscriberCount: 1000,
          videoCount: 10,
        },
      ]

      const result = formatSubscriptions(subscriptions)

      expect(result).toContain('A'.repeat(100))
      expect(result).toContain('...')
      expect(result).not.toContain('A'.repeat(150))
    })

    it('handles channels without descriptions', () => {
      const subscriptions: ChannelData[] = [
        {
          channelTitle: 'No Description Channel',
          channelDescription: null,
          subscriberCount: 1000,
          videoCount: 10,
        },
      ]

      const result = formatSubscriptions(subscriptions)

      expect(result).toBe('- No Description Channel')
      expect(result).not.toContain('(')
    })

    it('limits results to maxItems', () => {
      const subscriptions = createMockChannelDataList(100)

      const result = formatSubscriptions(subscriptions, 5)
      const lines = result.split('\n')

      expect(lines).toHaveLength(5)
    })

    it('returns empty string for empty array', () => {
      const result = formatSubscriptions([])

      expect(result).toBe('')
    })
  })

  describe('formatLikedVideos', () => {
    it('formats a list of videos correctly', () => {
      const videos: VideoData[] = [
        { videoTitle: 'Learn React in 30 Minutes', channelTitle: 'freeCodeCamp' },
        { videoTitle: 'Vim Tutorial', channelTitle: 'ThePrimeagen' },
      ]

      const result = formatLikedVideos(videos)

      expect(result).toContain('- "Learn React in 30 Minutes" by freeCodeCamp')
      expect(result).toContain('- "Vim Tutorial" by ThePrimeagen')
    })

    it('limits results to maxItems', () => {
      const videos = createMockVideoDataList(50)

      const result = formatLikedVideos(videos, 10)
      const lines = result.split('\n')

      expect(lines).toHaveLength(10)
    })

    it('returns empty string for empty array', () => {
      const result = formatLikedVideos([])

      expect(result).toBe('')
    })
  })

  describe('buildAnalysisPrompt', () => {
    it('builds a prompt with subscription and video counts', () => {
      const input: TasteAnalysisInput = {
        subscriptions: createMockChannelDataList(25),
        likedVideos: createMockVideoDataList(15),
      }

      const result = buildAnalysisPrompt(input)

      expect(result).toContain('25 total')
      expect(result).toContain('15 total')
    })

    it('includes subscription and video content', () => {
      const input: TasteAnalysisInput = {
        subscriptions: [
          {
            channelTitle: 'Test Channel',
            channelDescription: 'Test description',
            subscriberCount: 1000,
            videoCount: 50,
          },
        ],
        likedVideos: [
          { videoTitle: 'Test Video', channelTitle: 'Test Channel' },
        ],
      }

      const result = buildAnalysisPrompt(input)

      expect(result).toContain('Test Channel')
      expect(result).toContain('Test description')
      expect(result).toContain('"Test Video" by Test Channel')
    })

    it('handles empty subscriptions gracefully', () => {
      const input: TasteAnalysisInput = {
        subscriptions: [],
        likedVideos: createMockVideoDataList(5),
      }

      const result = buildAnalysisPrompt(input)

      expect(result).toContain('No subscriptions available')
      expect(result).toContain('0 total')
    })

    it('handles empty liked videos gracefully', () => {
      const input: TasteAnalysisInput = {
        subscriptions: createMockChannelDataList(5),
        likedVideos: [],
      }

      const result = buildAnalysisPrompt(input)

      expect(result).toContain('No liked videos available')
    })
  })

  describe('parseAnalysisResponse', () => {
    it('parses a valid JSON response', () => {
      const responseJson = createMockTasteAnalysisResponse()

      const result = parseAnalysisResponse(responseJson)

      expect(result.categories).toHaveLength(MOCK_TASTE_CATEGORIES.length)
      expect(result.analysisSummary).toBe(MOCK_ANALYSIS_SUMMARY)
    })

    it('handles markdown code blocks', () => {
      const responseJson = createMockTasteAnalysisResponse()
      const wrappedResponse = '```json\n' + responseJson + '\n```'

      const result = parseAnalysisResponse(wrappedResponse)

      expect(result.categories).toHaveLength(MOCK_TASTE_CATEGORIES.length)
    })

    it('normalizes weights to sum to 1.0', () => {
      const response = JSON.stringify({
        categories: [
          { name: 'Tech', weight: 0.5, description: 'Technology content' },
          { name: 'Gaming', weight: 0.5, description: 'Gaming content' },
          { name: 'Music', weight: 0.5, description: 'Music content' },
        ],
        analysisSummary: 'Test summary',
      })

      const result = parseAnalysisResponse(response)

      const totalWeight = result.categories.reduce((sum, cat) => sum + cat.weight, 0)
      expect(totalWeight).toBeCloseTo(1.0)
    })

    it('clamps weights between 0 and 1', () => {
      const response = JSON.stringify({
        categories: [
          { name: 'Tech', weight: 1.5, description: 'Technology content' },
          { name: 'Gaming', weight: -0.5, description: 'Gaming content' },
        ],
        analysisSummary: 'Test summary',
      })

      const result = parseAnalysisResponse(response)

      for (const category of result.categories) {
        expect(category.weight).toBeGreaterThanOrEqual(0)
        expect(category.weight).toBeLessThanOrEqual(1)
      }
    })

    it('filters out non-string subcategories', () => {
      const response = JSON.stringify({
        categories: [
          {
            name: 'Tech',
            weight: 1.0,
            description: 'Technology content',
            subCategories: ['Valid', 123, null, 'Also Valid'],
          },
        ],
        analysisSummary: 'Test summary',
      })

      const result = parseAnalysisResponse(response)

      expect(result.categories[0]?.subCategories).toEqual(['Valid', 'Also Valid'])
    })

    it('throws error for invalid JSON', () => {
      expect(() => parseAnalysisResponse('not valid json {')).toThrow('Failed to parse LLM response as JSON')
    })

    it('throws error for missing categories', () => {
      const response = JSON.stringify({ analysisSummary: 'Test' })

      expect(() => parseAnalysisResponse(response)).toThrow('missing categories array')
    })

    it('throws error for missing analysisSummary', () => {
      const response = JSON.stringify({ categories: [] })

      expect(() => parseAnalysisResponse(response)).toThrow('missing analysisSummary string')
    })

    it('throws error for category missing name', () => {
      const response = JSON.stringify({
        categories: [{ weight: 0.5, description: 'Test' }],
        analysisSummary: 'Test',
      })

      expect(() => parseAnalysisResponse(response)).toThrow('Category 0 missing name')
    })

    it('throws error for category missing weight', () => {
      const response = JSON.stringify({
        categories: [{ name: 'Tech', description: 'Test' }],
        analysisSummary: 'Test',
      })

      expect(() => parseAnalysisResponse(response)).toThrow('Category 0 missing weight')
    })

    it('throws error for category missing description', () => {
      const response = JSON.stringify({
        categories: [{ name: 'Tech', weight: 0.5 }],
        analysisSummary: 'Test',
      })

      expect(() => parseAnalysisResponse(response)).toThrow('Category 0 missing description')
    })

    it('throws error for non-object response', () => {
      expect(() => parseAnalysisResponse('"just a string"')).toThrow('LLM response is not an object')
    })

    it('throws error for non-object category', () => {
      const response = JSON.stringify({
        categories: ['not an object'],
        analysisSummary: 'Test',
      })

      expect(() => parseAnalysisResponse(response)).toThrow('Category 0 is not an object')
    })
  })

  describe('analyzeTaste', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('throws error when no data is provided', async () => {
      const input: TasteAnalysisInput = {
        subscriptions: [],
        likedVideos: [],
      }

      await expect(analyzeTaste(input)).rejects.toThrow(
        'No YouTube data available to analyze',
      )
    })

    it('calls LLM complete with correct messages', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockTasteAnalysisResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: TasteAnalysisInput = {
        subscriptions: createMockChannelDataList(5),
        likedVideos: createMockVideoDataList(5),
      }

      await analyzeTaste(input)

      expect(mockComplete).toHaveBeenCalledTimes(1)
      const callArgs = mockComplete.mock.calls[0]
      expect(callArgs?.[0]).toHaveLength(2) // system + user messages
      expect(callArgs?.[0]?.[0]?.role).toBe('system')
      expect(callArgs?.[0]?.[1]?.role).toBe('user')
    })

    it('returns parsed taste analysis result', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockTasteAnalysisResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: TasteAnalysisInput = {
        subscriptions: createMockChannelDataList(5),
        likedVideos: createMockVideoDataList(5),
      }

      const result = await analyzeTaste(input)

      expect(result.categories).toHaveLength(MOCK_TASTE_CATEGORIES.length)
      expect(result.analysisSummary).toBe(MOCK_ANALYSIS_SUMMARY)
    })

    it('works with only subscriptions (no liked videos)', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockTasteAnalysisResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: TasteAnalysisInput = {
        subscriptions: createMockChannelDataList(5),
        likedVideos: [],
      }

      const result = await analyzeTaste(input)

      expect(result.categories).toBeDefined()
    })

    it('works with only liked videos (no subscriptions)', async () => {
      const { complete } = await import('../../../server/services/llm')
      const mockComplete = vi.mocked(complete)
      mockComplete.mockResolvedValue({
        content: createMockTasteAnalysisResponse(),
        model: 'gpt-4o',
        provider: 'github',
      })

      const input: TasteAnalysisInput = {
        subscriptions: [],
        likedVideos: createMockVideoDataList(5),
      }

      const result = await analyzeTaste(input)

      expect(result.categories).toBeDefined()
    })
  })
})
