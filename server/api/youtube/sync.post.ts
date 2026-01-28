import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { fetchSubscriptions, fetchLikedVideos } from '../../services/youtube'
import { db } from '../../database'
import { subscriptions, likedVideos } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)

  try {
    // Fetch data from YouTube API in parallel
    const [youtubeSubscriptions, youtubeLikedVideos] = await Promise.all([
      fetchSubscriptions(session.accessToken),
      fetchLikedVideos(session.accessToken, 200),
    ])

    // Clear existing data for this user
    await db.delete(subscriptions).where(eq(subscriptions.userId, session.userId))
    await db.delete(likedVideos).where(eq(likedVideos.userId, session.userId))

    // Insert new subscriptions
    if (youtubeSubscriptions.length > 0) {
      await db.insert(subscriptions).values(
        youtubeSubscriptions.map(sub => ({
          userId: session.userId,
          channelId: sub.id,
          channelTitle: sub.title,
          channelDescription: sub.description,
          channelThumbnail: sub.thumbnail,
          subscriberCount: sub.subscriberCount || null,
          videoCount: sub.videoCount || null,
          fetchedAt: new Date(),
        })),
      )
    }

    // Insert new liked videos
    if (youtubeLikedVideos.length > 0) {
      await db.insert(likedVideos).values(
        youtubeLikedVideos.map(video => ({
          userId: session.userId,
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          fetchedAt: new Date(),
        })),
      )
    }

    return {
      success: true,
      subscriptions: youtubeSubscriptions.length,
      likedVideos: youtubeLikedVideos.length,
      message: `Synced ${youtubeSubscriptions.length} subscriptions and ${youtubeLikedVideos.length} liked videos`,
    }
  }
  catch (error) {
    console.error('Failed to sync YouTube data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to sync YouTube data',
    })
  }
})
