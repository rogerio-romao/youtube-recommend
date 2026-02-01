/**
 * YouTube Mock Utilities
 *
 * Provides mock factories for YouTube API responses used in testing.
 */

import { vi } from 'vitest'
import type { YouTubeChannel, YouTubeVideo } from '../../server/services/youtube'
import type { ChannelData, VideoData } from '../../server/services/analyzer'

/**
 * Create a mock YouTube channel
 */
export function createMockChannel(overrides?: Partial<YouTubeChannel>): YouTubeChannel {
  return {
    id: `UC${Math.random().toString(36).substring(2, 15)}`,
    title: 'Mock Channel',
    description: 'A mock channel for testing purposes',
    thumbnail: 'https://example.com/thumbnail.jpg',
    subscriberCount: 100000,
    videoCount: 250,
    ...overrides,
  }
}

/**
 * Create a mock YouTube video
 */
export function createMockVideo(overrides?: Partial<YouTubeVideo>): YouTubeVideo {
  return {
    id: Math.random().toString(36).substring(2, 15),
    title: 'Mock Video Title',
    thumbnail: 'https://example.com/video-thumbnail.jpg',
    channelId: `UC${Math.random().toString(36).substring(2, 15)}`,
    channelTitle: 'Mock Channel',
    ...overrides,
  }
}

/**
 * Create mock channel data for analyzer input
 */
export function createMockChannelData(overrides?: Partial<ChannelData>): ChannelData {
  return {
    channelTitle: 'Mock Channel',
    channelDescription: 'A mock channel for testing purposes',
    subscriberCount: 100000,
    videoCount: 250,
    ...overrides,
  }
}

/**
 * Create mock video data for analyzer input
 */
export function createMockVideoData(overrides?: Partial<VideoData>): VideoData {
  return {
    videoTitle: 'Mock Video Title',
    channelTitle: 'Mock Channel',
    ...overrides,
  }
}

/**
 * Create a list of mock channels representing typical subscriptions
 */
export function createMockSubscriptionList(count: number = 10): YouTubeChannel[] {
  const channels: YouTubeChannel[] = [
    createMockChannel({
      id: 'UCsBjURrPoezykLs9EqgamOA',
      title: 'Fireship',
      description: 'High-intensity code tutorials and tech news',
      subscriberCount: 2500000,
      videoCount: 500,
    }),
    createMockChannel({
      id: 'UC8butISFwT-Wl7EV0hUK0BQ',
      title: 'freeCodeCamp',
      description: 'Learn to code for free',
      subscriberCount: 8000000,
      videoCount: 1500,
    }),
    createMockChannel({
      id: 'UCvjgXvBlXQi3z5lvKaOadDw',
      title: 'The Coding Train',
      description: 'Creative coding tutorials',
      subscriberCount: 1600000,
      videoCount: 800,
    }),
    createMockChannel({
      id: 'UCW5OrnUV2stJjLUVIoS6n1Q',
      title: 'ThePrimeagen',
      description: 'Netflix engineer talks about programming',
      subscriberCount: 500000,
      videoCount: 400,
    }),
    createMockChannel({
      id: 'UC9-y-6csu5WGm29I7JiwpnA',
      title: 'Computerphile',
      description: 'Videos about computers and computer science',
      subscriberCount: 2300000,
      videoCount: 700,
    }),
    createMockChannel({
      id: 'UCR0BzK3YrJM7_8fF5nJLLnQ',
      title: 'GMTK - Game Maker\'s Toolkit',
      description: 'Videos about game design',
      subscriberCount: 1400000,
      videoCount: 200,
    }),
    createMockChannel({
      id: 'UCbmNph6atAoGfqLoCL_duAg',
      title: 'Veritasium',
      description: 'Science and engineering videos',
      subscriberCount: 14000000,
      videoCount: 350,
    }),
    createMockChannel({
      id: 'UCsXVk37bltHxD1rDPwtNM8Q',
      title: 'Kurzgesagt - In a Nutshell',
      description: 'Animated science explainers',
      subscriberCount: 21000000,
      videoCount: 180,
    }),
    createMockChannel({
      id: 'UCHnyfMqiRRG1u-2MsSQLbXA',
      title: 'Lofi Girl',
      description: 'Relaxing beats for studying',
      subscriberCount: 13000000,
      videoCount: 50,
    }),
    createMockChannel({
      id: 'UCoxcjq-8xIDTYp3uz647V5A',
      title: 'Numberphile',
      description: 'Videos about numbers and mathematics',
      subscriberCount: 4400000,
      videoCount: 500,
    }),
  ]

  // Return requested count, cycling through if needed
  const result: YouTubeChannel[] = []
  for (let i = 0; i < count; i++) {
    result.push(channels[i % channels.length] as YouTubeChannel)
  }
  return result
}

/**
 * Create a list of mock liked videos
 */
export function createMockLikedVideosList(count: number = 10): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [
    createMockVideo({
      id: 'dQw4w9WgXcQ',
      title: '100+ JavaScript Concepts you Need to Know',
      channelId: 'UCsBjURrPoezykLs9EqgamOA',
      channelTitle: 'Fireship',
    }),
    createMockVideo({
      id: 'abc123',
      title: 'Learn React in 30 Minutes',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      channelTitle: 'freeCodeCamp',
    }),
    createMockVideo({
      id: 'def456',
      title: 'Coding Challenge: Maze Generator',
      channelId: 'UCvjgXvBlXQi3z5lvKaOadDw',
      channelTitle: 'The Coding Train',
    }),
    createMockVideo({
      id: 'ghi789',
      title: 'Vim is the Best Editor',
      channelId: 'UCW5OrnUV2stJjLUVIoS6n1Q',
      channelTitle: 'ThePrimeagen',
    }),
    createMockVideo({
      id: 'jkl012',
      title: 'How Computers Work',
      channelId: 'UC9-y-6csu5WGm29I7JiwpnA',
      channelTitle: 'Computerphile',
    }),
    createMockVideo({
      id: 'mno345',
      title: 'What Makes a Good Puzzle Game?',
      channelId: 'UCR0BzK3YrJM7_8fF5nJLLnQ',
      channelTitle: 'GMTK',
    }),
    createMockVideo({
      id: 'pqr678',
      title: 'The Surprising Truth About Black Holes',
      channelId: 'UCbmNph6atAoGfqLoCL_duAg',
      channelTitle: 'Veritasium',
    }),
    createMockVideo({
      id: 'stu901',
      title: 'The Immune System Explained',
      channelId: 'UCsXVk37bltHxD1rDPwtNM8Q',
      channelTitle: 'Kurzgesagt',
    }),
    createMockVideo({
      id: 'vwx234',
      title: '1 AM Study Session - Lofi Hip Hop Mix',
      channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
      channelTitle: 'Lofi Girl',
    }),
    createMockVideo({
      id: 'yza567',
      title: 'The Riemann Hypothesis',
      channelId: 'UCoxcjq-8xIDTYp3uz647V5A',
      channelTitle: 'Numberphile',
    }),
  ]

  // Return requested count, cycling through if needed
  const result: YouTubeVideo[] = []
  for (let i = 0; i < count; i++) {
    result.push(videos[i % videos.length] as YouTubeVideo)
  }
  return result
}

/**
 * Create mock channel data for analyzer (from subscriptions)
 */
export function createMockChannelDataList(count: number = 10): ChannelData[] {
  return createMockSubscriptionList(count).map(channel => ({
    channelTitle: channel.title,
    channelDescription: channel.description,
    subscriberCount: channel.subscriberCount ?? null,
    videoCount: channel.videoCount ?? null,
  }))
}

/**
 * Create mock video data for analyzer (from liked videos)
 */
export function createMockVideoDataList(count: number = 10): VideoData[] {
  return createMockLikedVideosList(count).map(video => ({
    videoTitle: video.title,
    channelTitle: video.channelTitle,
  }))
}

/**
 * Create a mock YouTube API subscription list response
 */
export function createMockSubscriptionsApiResponse(
  channels: YouTubeChannel[] = createMockSubscriptionList(5),
  nextPageToken?: string,
): Record<string, unknown> {
  return {
    items: channels.map(channel => ({
      snippet: {
        resourceId: {
          channelId: channel.id,
        },
        title: channel.title,
        description: channel.description,
        thumbnails: {
          default: { url: channel.thumbnail },
          medium: { url: channel.thumbnail },
          high: { url: channel.thumbnail },
        },
      },
    })),
    nextPageToken,
    pageInfo: {
      totalResults: channels.length,
      resultsPerPage: channels.length,
    },
  }
}

/**
 * Create a mock YouTube API channels response (for stats)
 */
export function createMockChannelsApiResponse(
  channels: YouTubeChannel[] = createMockSubscriptionList(5),
): Record<string, unknown> {
  return {
    items: channels.map(channel => ({
      id: channel.id,
      statistics: {
        subscriberCount: String(channel.subscriberCount ?? 0),
        videoCount: String(channel.videoCount ?? 0),
      },
    })),
    pageInfo: {
      totalResults: channels.length,
      resultsPerPage: channels.length,
    },
  }
}

/**
 * Create a mock YouTube API liked videos response
 */
export function createMockLikedVideosApiResponse(
  videos: YouTubeVideo[] = createMockLikedVideosList(5),
  nextPageToken?: string,
): Record<string, unknown> {
  return {
    items: videos.map(video => ({
      id: video.id,
      snippet: {
        title: video.title,
        thumbnails: {
          default: { url: video.thumbnail },
          medium: { url: video.thumbnail },
        },
        channelId: video.channelId,
        channelTitle: video.channelTitle,
      },
    })),
    nextPageToken,
    pageInfo: {
      totalResults: videos.length,
      resultsPerPage: videos.length,
    },
  }
}

/**
 * Create a mock fetch function for YouTube API calls
 */
export function createMockYouTubeFetch(options?: {
  subscriptions?: YouTubeChannel[]
  likedVideos?: YouTubeVideo[]
  shouldFail?: boolean
  failureMessage?: string
}): ReturnType<typeof vi.fn> {
  const { subscriptions, likedVideos, shouldFail, failureMessage } = options ?? {}

  return vi.fn().mockImplementation((url: string) => {
    if (shouldFail) {
      return Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve(failureMessage ?? 'Unauthorized'),
      })
    }

    const urlString = url.toString()

    if (urlString.includes('/subscriptions')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(createMockSubscriptionsApiResponse(subscriptions)),
      })
    }

    if (urlString.includes('/channels')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(createMockChannelsApiResponse(subscriptions)),
      })
    }

    if (urlString.includes('/videos')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(createMockLikedVideosApiResponse(likedVideos)),
      })
    }

    return Promise.resolve({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    })
  })
}
