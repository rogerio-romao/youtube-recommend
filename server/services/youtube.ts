/**
 * YouTube Data API v3 Service
 * Handles fetching subscriptions and liked videos
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount?: number
  videoCount?: number
}

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelId: string
  channelTitle: string
}

interface YouTubeSubscriptionItem {
  snippet: {
    resourceId: {
      channelId: string
    }
    title: string
    description: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
}

interface _YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string
    }
    title: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
    videoOwnerChannelId: string
    videoOwnerChannelTitle: string
  }
}

interface YouTubeChannelItem {
  id: string
  statistics?: {
    subscriberCount?: string
    videoCount?: string
  }
}

interface YouTubeListResponse<T> {
  items: T[]
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

/**
 * Fetch all subscriptions for the authenticated user
 */
export async function fetchSubscriptions(accessToken: string): Promise<YouTubeChannel[]> {
  const channels: YouTubeChannel[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(`${YOUTUBE_API_BASE}/subscriptions?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch subscriptions: ${error}`)
    }

    const data: YouTubeListResponse<YouTubeSubscriptionItem> = await response.json()

    for (const item of data.items) {
      channels.push({
        id: item.snippet.resourceId.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url
          || item.snippet.thumbnails.default?.url || '',
      })
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  // Fetch additional channel statistics in batches
  const channelsWithStats = await enrichChannelsWithStats(accessToken, channels)

  return channelsWithStats
}

/**
 * Enrich channels with subscriber and video counts
 */
async function enrichChannelsWithStats(
  accessToken: string,
  channels: YouTubeChannel[],
): Promise<YouTubeChannel[]> {
  const enrichedChannels: YouTubeChannel[] = []

  // Process in batches of 50 (API limit)
  for (let i = 0; i < channels.length; i += 50) {
    const batch = channels.slice(i, i + 50)
    const channelIds = batch.map(c => c.id).join(',')

    const params = new URLSearchParams({
      part: 'statistics',
      id: channelIds,
    })

    const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      // If stats fetch fails, return channels without stats
      console.error('Failed to fetch channel statistics')
      return channels
    }

    const data: YouTubeListResponse<YouTubeChannelItem> = await response.json()

    // Create a map of channel stats
    const statsMap = new Map<string, { subscriberCount?: number, videoCount?: number }>()
    for (const item of data.items) {
      statsMap.set(item.id, {
        subscriberCount: item.statistics?.subscriberCount
          ? parseInt(item.statistics.subscriberCount, 10)
          : undefined,
        videoCount: item.statistics?.videoCount
          ? parseInt(item.statistics.videoCount, 10)
          : undefined,
      })
    }

    // Merge stats with channels
    for (const channel of batch) {
      const stats = statsMap.get(channel.id)
      enrichedChannels.push({
        ...channel,
        subscriberCount: stats?.subscriberCount,
        videoCount: stats?.videoCount,
      })
    }
  }

  return enrichedChannels
}

/**
 * Fetch liked videos for the authenticated user
 */
export async function fetchLikedVideos(
  accessToken: string,
  maxResults: number = 200,
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = []
  let pageToken: string | undefined
  let fetched = 0

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      myRating: 'like',
      maxResults: '50',
    })

    if (pageToken) {
      params.set('pageToken', pageToken)
    }

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch liked videos: ${error}`)
    }

    const data: YouTubeListResponse<{
      id: string
      snippet: {
        title: string
        thumbnails: {
          default?: { url: string }
          medium?: { url: string }
        }
        channelId: string
        channelTitle: string
      }
    }> = await response.json()

    for (const item of data.items) {
      videos.push({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url
          || item.snippet.thumbnails.default?.url || '',
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
      })
      fetched++

      if (fetched >= maxResults) {
        return videos
      }
    }

    pageToken = data.nextPageToken
  } while (pageToken && fetched < maxResults)

  return videos
}
