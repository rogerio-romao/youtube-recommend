/**
 * PATCH /api/recommendations/:id
 *
 * Toggles the favorited status of a recommendation
 */
import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../database'
import { recommendations } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Invalid recommendation ID' })
  }

  const body = await readBody(event)
  const favorited = Boolean(body.favorited)

  const [updated] = await db
    .update(recommendations)
    .set({ favorited })
    .where(and(eq(recommendations.id, id), eq(recommendations.userId, session.userId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Recommendation not found' })
  }

  return { success: true, favorited: updated.favorited }
})
