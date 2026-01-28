export interface Subscription {
  id: number
  channelId: string
  channelTitle: string
  channelDescription: string | null
  channelThumbnail: string | null
  subscriberCount: number | null
  videoCount: number | null
}

export interface LikedVideo {
  id: number
  videoId: string
  videoTitle: string
  videoThumbnail: string | null
  channelId: string
  channelTitle: string
}

export interface TasteCategory {
  name: string
  weight: number
  description: string
  subCategories?: string[]
}

export interface TasteProfile {
  id: number
  categories: TasteCategory[]
  analysisSummary: string
  analyzedAt: string
}

export interface YouTubeData {
  subscriptions: {
    data: Subscription[]
    count: number
  }
  likedVideos: {
    data: LikedVideo[]
    count: number
  }
  tasteProfile: TasteProfile | null
  hasSyncedData: boolean
}

export function useYouTube() {
  const data = useState<YouTubeData | null>('youtube-data', () => null)
  const isLoading = useState<boolean>('youtube-loading', () => false)
  const isSyncing = useState<boolean>('youtube-syncing', () => false)
  const isAnalyzing = useState<boolean>('youtube-analyzing', () => false)
  const error = useState<string | null>('youtube-error', () => null)

  async function fetchData(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<YouTubeData>('/api/youtube/data', {
        credentials: 'include',
      })
      data.value = response
    }
    catch (e) {
      console.error('Failed to fetch YouTube data:', e)
      error.value = 'Failed to load YouTube data'
    }
    finally {
      isLoading.value = false
    }
  }

  async function syncData(): Promise<{ success: boolean, message: string }> {
    isSyncing.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        subscriptions: number
        likedVideos: number
        message: string
      }>('/api/youtube/sync', {
        method: 'POST',
        credentials: 'include',
      })

      // Refresh data after sync
      await fetchData()

      return {
        success: true,
        message: response.message,
      }
    }
    catch (e) {
      console.error('Failed to sync YouTube data:', e)
      error.value = 'Failed to sync YouTube data'
      return {
        success: false,
        message: 'Failed to sync YouTube data. Please try again.',
      }
    }
    finally {
      isSyncing.value = false
    }
  }

  async function analyzeData(): Promise<{ success: boolean, message: string }> {
    isAnalyzing.value = true
    error.value = null

    try {
      const response = await $fetch<{
        success: boolean
        profile: TasteProfile
        message: string
      }>('/api/analyze', {
        method: 'POST',
        credentials: 'include',
      })

      // Refresh data after analysis
      await fetchData()

      return {
        success: true,
        message: response.message,
      }
    }
    catch (e) {
      console.error('Failed to analyze data:', e)
      error.value = 'Failed to analyze taste profile'
      return {
        success: false,
        message: 'Failed to analyze taste profile. Please try again.',
      }
    }
    finally {
      isAnalyzing.value = false
    }
  }

  return {
    data: readonly(data),
    isLoading: readonly(isLoading),
    isSyncing: readonly(isSyncing),
    isAnalyzing: readonly(isAnalyzing),
    error: readonly(error),
    fetchData,
    syncData,
    analyzeData,
  }
}
