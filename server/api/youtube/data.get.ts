import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../database'
import { subscriptions, likedVideos, tasteProfiles } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)

  // Fetch stored data from database
  const [userSubscriptions, userLikedVideos, userTasteProfile] = await Promise.all([
    db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, session.userId),
      orderBy: [desc(subscriptions.subscriberCount)],
    }),
    db.query.likedVideos.findMany({
      where: eq(likedVideos.userId, session.userId),
      orderBy: [desc(likedVideos.fetchedAt)],
      limit: 100,
    }),
    db.query.tasteProfiles.findFirst({
      where: eq(tasteProfiles.userId, session.userId),
      orderBy: [desc(tasteProfiles.analyzedAt)],
    }),
  ])

  return {
    subscriptions: {
      data: userSubscriptions,
      count: userSubscriptions.length,
    },
    likedVideos: {
      data: userLikedVideos,
      count: userLikedVideos.length,
    },
    tasteProfile: userTasteProfile || null,
    hasSyncedData: userSubscriptions.length > 0 || userLikedVideos.length > 0,
  }
})
