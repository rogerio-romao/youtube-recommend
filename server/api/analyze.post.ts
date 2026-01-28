/**
 * POST /api/analyze
 *
 * Analyzes the user's YouTube data and generates a taste profile
 */
import { eq } from 'drizzle-orm'
import { requireAuth } from '../utils/auth'
import { db } from '../database'
import { subscriptions, likedVideos, tasteProfiles } from '../database/schema'
import { analyzeTaste } from '../services/analyzer'
import { isLLMConfigured } from '../services/llm'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)

  // Check if LLM is configured
  if (!isLLMConfigured()) {
    throw createError({
      statusCode: 503,
      message: 'LLM service is not configured. Please set GITHUB_TOKEN environment variable.',
    })
  }

  try {
    // Fetch user's YouTube data from database
    const [userSubscriptions, userLikedVideos] = await Promise.all([
      db.select().from(subscriptions).where(eq(subscriptions.userId, session.userId)),
      db.select().from(likedVideos).where(eq(likedVideos.userId, session.userId)),
    ])

    if (userSubscriptions.length === 0 && userLikedVideos.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No YouTube data found. Please sync your YouTube data first.',
      })
    }

    // Prepare data for analysis
    const analysisInput = {
      subscriptions: userSubscriptions.map(sub => ({
        channelTitle: sub.channelTitle,
        channelDescription: sub.channelDescription,
        subscriberCount: sub.subscriberCount,
        videoCount: sub.videoCount,
      })),
      likedVideos: userLikedVideos.map(video => ({
        videoTitle: video.videoTitle,
        channelTitle: video.channelTitle,
      })),
    }

    // Run taste analysis
    const result = await analyzeTaste(analysisInput)

    // Delete existing taste profile for this user
    await db.delete(tasteProfiles).where(eq(tasteProfiles.userId, session.userId))

    // Insert new taste profile
    const [newProfile] = await db.insert(tasteProfiles).values({
      userId: session.userId,
      categories: result.categories,
      analysisSummary: result.analysisSummary,
      analyzedAt: new Date(),
    }).returning()

    if (!newProfile) {
      throw new Error('Failed to save taste profile')
    }

    return {
      success: true,
      profile: {
        id: newProfile.id,
        categories: newProfile.categories,
        analysisSummary: newProfile.analysisSummary,
        analyzedAt: newProfile.analyzedAt?.toISOString(),
      },
      message: `Analyzed ${userSubscriptions.length} subscriptions and ${userLikedVideos.length} liked videos`,
    }
  }
  catch (error) {
    console.error('Failed to analyze taste:', error)

    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to analyze taste profile',
    })
  }
})
