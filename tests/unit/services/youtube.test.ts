/**
 * YouTube Service Tests
 *
 * Tests for the YouTube API service including fetch functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchSubscriptions, fetchLikedVideos } from '../../../server/services/youtube'
import {
  createMockSubscriptionsApiResponse,
  createMockChannelsApiResponse,
  createMockLikedVideosApiResponse,
  createMockSubscriptionList,
  createMockLikedVideosList,
} from '../../mocks/youtube'

describe('YouTube Service', () => {
  const mockAccessToken = 'mock-access-token'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchSubscriptions', () => {
    it('fetches subscriptions from YouTube API', async () => {
      const mockChannels = createMockSubscriptionList(5)

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/subscriptions')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels)),
            })
          }
          if (url.includes('/channels')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockChannelsApiResponse(mockChannels)),
            })
          }
          return Promise.resolve({ ok: false, text: () => Promise.resolve('Not found') })
        }),
      )

      const result = await fetchSubscriptions(mockAccessToken)

      expect(result).toHaveLength(5)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('thumbnail')
    })

    it('includes subscriber and video counts from stats', async () => {
      const mockChannels = createMockSubscriptionList(3)

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/subscriptions')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels)),
            })
          }
          if (url.includes('/channels')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockChannelsApiResponse(mockChannels)),
            })
          }
          return Promise.resolve({ ok: false, text: () => Promise.resolve('Not found') })
        }),
      )

      const result = await fetchSubscriptions(mockAccessToken)

      expect(result[0]?.subscriberCount).toBeDefined()
      expect(result[0]?.videoCount).toBeDefined()
    })

    it('passes access token in Authorization header', async () => {
      const mockChannels = createMockSubscriptionList(1)
      const fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/subscriptions')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels)),
          })
        }
        if (url.includes('/channels')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockChannelsApiResponse(mockChannels)),
          })
        }
        return Promise.resolve({ ok: false, text: () => Promise.resolve('Not found') })
      })

      vi.stubGlobal('fetch', fetchMock)

      await fetchSubscriptions(mockAccessToken)

      expect(fetchMock).toHaveBeenCalled()
      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall?.[1]?.headers?.Authorization).toBe(`Bearer ${mockAccessToken}`)
    })

    it('handles pagination with nextPageToken', async () => {
      const mockChannels1 = createMockSubscriptionList(3)
      const mockChannels2 = createMockSubscriptionList(2)
      let callCount = 0

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/subscriptions')) {
            callCount++
            if (callCount === 1) {
              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels1, 'page2token')),
              })
            }
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels2)),
            })
          }
          if (url.includes('/channels')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockChannelsApiResponse([...mockChannels1, ...mockChannels2])),
            })
          }
          return Promise.resolve({ ok: false, text: () => Promise.resolve('Not found') })
        }),
      )

      const result = await fetchSubscriptions(mockAccessToken)

      expect(result).toHaveLength(5) // 3 + 2
    })

    it('throws error when API returns error response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          text: () => Promise.resolve('Unauthorized: Invalid token'),
        }),
      )

      await expect(fetchSubscriptions(mockAccessToken)).rejects.toThrow('Failed to fetch subscriptions')
    })

    it('returns channels without stats if stats fetch fails', async () => {
      const mockChannels = createMockSubscriptionList(3)

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/subscriptions')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockSubscriptionsApiResponse(mockChannels)),
            })
          }
          if (url.includes('/channels')) {
            return Promise.resolve({
              ok: false,
              text: () => Promise.resolve('Stats API error'),
            })
          }
          return Promise.resolve({ ok: false, text: () => Promise.resolve('Not found') })
        }),
      )

      const result = await fetchSubscriptions(mockAccessToken)

      // Should return channels even if stats fail
      expect(result).toHaveLength(3)
    })
  })

  describe('fetchLikedVideos', () => {
    it('fetches liked videos from YouTube API', async () => {
      const mockVideos = createMockLikedVideosList(5)

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(createMockLikedVideosApiResponse(mockVideos)),
        }),
      )

      const result = await fetchLikedVideos(mockAccessToken)

      expect(result).toHaveLength(5)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('channelId')
      expect(result[0]).toHaveProperty('channelTitle')
    })

    it('passes access token in Authorization header', async () => {
      const mockVideos = createMockLikedVideosList(1)
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockLikedVideosApiResponse(mockVideos)),
      })

      vi.stubGlobal('fetch', fetchMock)

      await fetchLikedVideos(mockAccessToken)

      expect(fetchMock).toHaveBeenCalled()
      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall?.[1]?.headers?.Authorization).toBe(`Bearer ${mockAccessToken}`)
    })

    it('respects maxResults parameter', async () => {
      const mockVideos = createMockLikedVideosList(10)

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(createMockLikedVideosApiResponse(mockVideos)),
        }),
      )

      const result = await fetchLikedVideos(mockAccessToken, 5)

      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('handles pagination until maxResults is reached', async () => {
      const mockVideos1 = createMockLikedVideosList(50)
      const mockVideos2 = createMockLikedVideosList(50)
      let callCount = 0

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(createMockLikedVideosApiResponse(mockVideos1, 'page2token')),
            })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(createMockLikedVideosApiResponse(mockVideos2)),
          })
        }),
      )

      const result = await fetchLikedVideos(mockAccessToken, 75)

      // Should stop at maxResults
      expect(result.length).toBeLessThanOrEqual(75)
    })

    it('throws error when API returns error response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          text: () => Promise.resolve('Unauthorized: Invalid token'),
        }),
      )

      await expect(fetchLikedVideos(mockAccessToken)).rejects.toThrow('Failed to fetch liked videos')
    })

    it('returns empty array when no liked videos', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            items: [],
            pageInfo: { totalResults: 0, resultsPerPage: 50 },
          }),
        }),
      )

      const result = await fetchLikedVideos(mockAccessToken)

      expect(result).toEqual([])
    })

    it('uses default maxResults of 200', async () => {
      // Create more than 200 videos across pages
      const mockVideos = createMockLikedVideosList(50)
      let totalFetched = 0

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          totalFetched += 50
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(
              createMockLikedVideosApiResponse(
                mockVideos,
                totalFetched < 250 ? 'nextPage' : undefined,
              ),
            ),
          })
        }),
      )

      const result = await fetchLikedVideos(mockAccessToken)

      // Should stop at 200 (default maxResults)
      expect(result.length).toBeLessThanOrEqual(200)
    })
  })
})
