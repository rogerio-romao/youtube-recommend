import { eq } from 'drizzle-orm'
import { getQuery, sendRedirect, createError } from 'h3'
import { db } from '../../database'
import { users } from '../../database/schema'
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
  setUserSession,
  type Session,
} from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  // Check for error from Google
  if (query.error) {
    throw createError({
      statusCode: 400,
      message: `OAuth error: ${query.error}`,
    })
  }

  // Get authorization code
  const code = query.code as string | undefined
  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Missing authorization code',
    })
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
    code,
  })

  // Get user info from Google
  const googleUser = await getGoogleUserInfo(tokens.access_token)

  // Find or create user in database
  let user = await db.query.users.findFirst({
    where: eq(users.googleId, googleUser.id),
  })

  if (!user) {
    // Create new user
    const [newUser] = await db.insert(users).values({
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    user = newUser
  }
  else {
    // Update existing user
    const [updatedUser] = await db.update(users)
      .set({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    user = updatedUser
  }

  if (!user) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create or update user',
    })
  }

  // Create session
  const session: Session = {
    userId: user.id,
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  }

  setUserSession(event, session)

  // Redirect to dashboard
  return sendRedirect(event, '/dashboard')
})
