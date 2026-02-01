/**
 * Smoke Test
 *
 * A simple test to verify the testing infrastructure works correctly.
 * This file can be removed once real tests are added.
 */

import { describe, it, expect } from 'vitest'
import {
  createMockChannel,
  createMockVideo,
  createMockSubscriptionList,
  createMockLikedVideosList,
} from '../mocks/youtube'
import {
  createMockLLMResponse,
  createMockTasteAnalysisResponse,
  createMockRecommendationsResponse,
  MOCK_TASTE_CATEGORIES,
} from '../mocks/llm'

describe('Test Infrastructure', () => {
  describe('YouTube Mocks', () => {
    it('creates a mock channel with default values', () => {
      const channel = createMockChannel()

      expect(channel).toHaveProperty('id')
      expect(channel).toHaveProperty('title')
      expect(channel).toHaveProperty('description')
      expect(channel).toHaveProperty('thumbnail')
      expect(channel.subscriberCount).toBe(100000)
      expect(channel.videoCount).toBe(250)
    })

    it('creates a mock channel with custom values', () => {
      const channel = createMockChannel({
        title: 'Custom Channel',
        subscriberCount: 500000,
      })

      expect(channel.title).toBe('Custom Channel')
      expect(channel.subscriberCount).toBe(500000)
    })

    it('creates a mock video with default values', () => {
      const video = createMockVideo()

      expect(video).toHaveProperty('id')
      expect(video).toHaveProperty('title')
      expect(video).toHaveProperty('channelId')
      expect(video).toHaveProperty('channelTitle')
    })

    it('creates a subscription list with specified count', () => {
      const subscriptions = createMockSubscriptionList(5)

      expect(subscriptions).toHaveLength(5)
      expect(subscriptions[0]).toHaveProperty('title')
    })

    it('creates a liked videos list with specified count', () => {
      const videos = createMockLikedVideosList(7)

      expect(videos).toHaveLength(7)
      expect(videos[0]).toHaveProperty('title')
    })
  })

  describe('LLM Mocks', () => {
    it('creates a mock LLM response', () => {
      const response = createMockLLMResponse('Test content')

      expect(response.content).toBe('Test content')
      expect(response.model).toBe('gpt-4o-test')
      expect(response.provider).toBe('github')
      expect(response.usage).toBeDefined()
      expect(response.usage?.totalTokens).toBe(300)
    })

    it('creates a mock taste analysis response', () => {
      const responseJson = createMockTasteAnalysisResponse()
      const response = JSON.parse(responseJson)

      expect(response.categories).toBeInstanceOf(Array)
      expect(response.categories.length).toBeGreaterThan(0)
      expect(response.analysisSummary).toBeDefined()
    })

    it('creates a mock recommendations response', () => {
      const responseJson = createMockRecommendationsResponse()
      const response = JSON.parse(responseJson)

      expect(response.recommendations).toBeInstanceOf(Array)
      expect(response.recommendations.length).toBeGreaterThan(0)

      const firstRec = response.recommendations[0]
      expect(firstRec).toHaveProperty('type')
      expect(firstRec).toHaveProperty('channelTitle')
      expect(firstRec).toHaveProperty('reason')
      expect(firstRec).toHaveProperty('confidenceScore')
    })

    it('has valid mock taste categories', () => {
      expect(MOCK_TASTE_CATEGORIES).toBeInstanceOf(Array)
      expect(MOCK_TASTE_CATEGORIES.length).toBe(4)

      const totalWeight = MOCK_TASTE_CATEGORIES.reduce((sum, cat) => sum + cat.weight, 0)
      expect(totalWeight).toBe(1)

      for (const category of MOCK_TASTE_CATEGORIES) {
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('weight')
        expect(category).toHaveProperty('description')
        expect(category.weight).toBeGreaterThan(0)
        expect(category.weight).toBeLessThanOrEqual(1)
      }
    })
  })
})
