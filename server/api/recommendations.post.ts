/**
 * POST /api/recommendations
 *
 * Generates personalized recommendations based on user's taste profile
 */
import { eq } from 'drizzle-orm'
import { requireAuth } from '../utils/auth'
import { db } from '../database'
import { subscriptions, tasteProfiles, recommendations } from '../database/schema'
import { generateRecommendations } from '../services/recommender'
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
    // Fetch user's taste profile
    const [tasteProfile] = await db
      .select()
      .from(tasteProfiles)
      .where(eq(tasteProfiles.userId, session.userId))
      .limit(1)

    if (!tasteProfile) {
      throw createError({
        statusCode: 400,
        message: 'No taste profile found. Please analyze your tastes first.',
      })
    }

    // Fetch existing subscriptions to exclude from recommendations
    const userSubscriptions = await db
      .select({ channelTitle: subscriptions.channelTitle })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.userId))

    const existingChannels = userSubscriptions.map(s => s.channelTitle)

    // Generate recommendations
    const result = await generateRecommendations({
      tasteProfile: {
        categories: tasteProfile.categories,
        analysisSummary: tasteProfile.analysisSummary,
      },
      existingSubscriptions: existingChannels,
    })

    // Delete existing recommendations for this user
    await db.delete(recommendations).where(eq(recommendations.userId, session.userId))

    // Insert new recommendations
    const newRecommendations = await db.insert(recommendations).values(
      result.recommendations.map(rec => ({
        userId: session.userId,
        type: rec.type,
        channelId: rec.channelId ?? null,
        channelTitle: rec.channelTitle,
        channelThumbnail: null,
        subscriberCount: rec.subscriberCount ?? null,
        reason: rec.reason,
        category: rec.category,
        confidenceScore: rec.confidenceScore,
        createdAt: new Date(),
      })),
    ).returning()

    return {
      success: true,
      recommendations: newRecommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        channelTitle: rec.channelTitle,
        channelId: rec.channelId,
        reason: rec.reason,
        category: rec.category,
        confidenceScore: rec.confidenceScore,
      })),
      counts: {
        channel: result.recommendations.filter(r => r.type === 'channel').length,
        hidden_gem: result.recommendations.filter(r => r.type === 'hidden_gem').length,
        content_gap: result.recommendations.filter(r => r.type === 'content_gap').length,
      },
      message: `Generated ${result.recommendations.length} personalized recommendations`,
    }
  }
  catch (error) {
    console.error('Failed to generate recommendations:', error)

    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to generate recommendations',
    })
  }
})
