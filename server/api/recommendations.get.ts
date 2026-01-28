/**
 * GET /api/recommendations
 *
 * Retrieves user's saved recommendations
 */
import { eq } from 'drizzle-orm'
import { requireAuth } from '../utils/auth'
import { db } from '../database'
import { recommendations } from '../database/schema'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)

  try {
    const userRecommendations = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, session.userId))

    // Group by type
    const grouped = {
      channel: userRecommendations.filter(r => r.type === 'channel'),
      hidden_gem: userRecommendations.filter(r => r.type === 'hidden_gem'),
      content_gap: userRecommendations.filter(r => r.type === 'content_gap'),
    }

    return {
      recommendations: userRecommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        channelTitle: rec.channelTitle,
        channelId: rec.channelId,
        reason: rec.reason,
        category: rec.category,
        confidenceScore: rec.confidenceScore,
        createdAt: rec.createdAt?.toISOString(),
      })),
      grouped,
      counts: {
        channel: grouped.channel.length,
        hidden_gem: grouped.hidden_gem.length,
        content_gap: grouped.content_gap.length,
        total: userRecommendations.length,
      },
      hasRecommendations: userRecommendations.length > 0,
    }
  }
  catch (error) {
    console.error('Failed to fetch recommendations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch recommendations',
    })
  }
})
