import { getUserSession } from '../../utils/auth'

export default defineEventHandler((event) => {
  const session = getUserSession(event)

  if (!session) {
    return { user: null }
  }

  // Return user info (without sensitive tokens)
  return {
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      avatarUrl: session.avatarUrl,
    },
  }
})
