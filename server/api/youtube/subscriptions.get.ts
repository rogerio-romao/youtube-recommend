import { requireAuth } from '../../utils/auth'
import { fetchSubscriptions } from '../../services/youtube'

export default defineEventHandler(async (event) => {
  const session = requireAuth(event)

  try {
    const subscriptions = await fetchSubscriptions(session.accessToken)

    return {
      data: subscriptions,
      count: subscriptions.length,
    }
  }
  catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscriptions from YouTube',
    })
  }
})
