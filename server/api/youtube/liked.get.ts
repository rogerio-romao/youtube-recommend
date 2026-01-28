import { requireAuth } from '../../utils/auth'
import { fetchLikedVideos } from '../../services/youtube'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)
  const query = getQuery(event)

  // Allow limiting results via query param (default 200)
  const maxResults = Math.min(
    parseInt(query.limit as string, 10) || 200,
    500, // Hard cap
  )

  try {
    const likedVideos = await fetchLikedVideos(session.accessToken, maxResults)

    return {
      data: likedVideos,
      count: likedVideos.length,
    }
  }
  catch (error) {
    console.error('Failed to fetch liked videos:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch liked videos from YouTube',
    })
  }
})
