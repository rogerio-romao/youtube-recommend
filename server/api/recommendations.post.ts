/**
 * POST /api/recommendations
 *
 * Generates personalized recommendations based on user's taste profile
 */
import { and, eq } from 'drizzle-orm'
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

    // Fetch favorited recommendations to exclude from new generation
    const favoritedRecommendations = await db
      .select({ channelTitle: recommendations.channelTitle })
      .from(recommendations)
      .where(and(eq(recommendations.userId, session.userId), eq(recommendations.favorited, true)))

    const existingChannels = [
      ...userSubscriptions.map(s => s.channelTitle),
      ...favoritedRecommendations.map(r => r.channelTitle),
    ]

    // Generate recommendations
    const result = await generateRecommendations({
      tasteProfile: {
        categories: tasteProfile.categories,
        analysisSummary: tasteProfile.analysisSummary,
      },
      existingSubscriptions: existingChannels,
    })

    // Delete only non-favorited recommendations for this user
    await db.delete(recommendations).where(
      and(eq(recommendations.userId, session.userId), eq(recommendations.favorited, false)),
    )

    // Insert new recommendations
    await db.insert(recommendations).values(
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
        favorited: false,
        createdAt: new Date(),
      })),
    )

    // Re-query all recommendations (favorites + new) to return complete list
    const allRecommendations = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, session.userId))

    return {
      success: true,
      recommendations: allRecommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        channelTitle: rec.channelTitle,
        channelId: rec.channelId,
        reason: rec.reason,
        category: rec.category,
        confidenceScore: rec.confidenceScore,
        favorited: rec.favorited,
      })),
      counts: {
        channel: allRecommendations.filter(r => r.type === 'channel').length,
        hidden_gem: allRecommendations.filter(r => r.type === 'hidden_gem').length,
        content_gap: allRecommendations.filter(r => r.type === 'content_gap').length,
      },
      message: `Generated ${result.recommendations.length} new personalized recommendations`,
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
