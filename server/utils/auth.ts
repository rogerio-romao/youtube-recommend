import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'

const SESSION_COOKIE_NAME = 'youtube-recommend-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export interface Session {
  userId: number
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

/**
 * Get the current session from cookies
 */
export function getUserSession(event: H3Event): Session | null {
  const sessionData = getCookie(event, SESSION_COOKIE_NAME)
  if (!sessionData) return null

  try {
    const session = JSON.parse(Buffer.from(sessionData, 'base64').toString('utf-8')) as Session

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      deleteUserSession(event)
      return null
    }

    return session
  }
  catch {
    deleteUserSession(event)
    return null
  }
}

/**
 * Set a session cookie
 */
export function setUserSession(event: H3Event, session: Session): void {
  const sessionData = Buffer.from(JSON.stringify(session)).toString('base64')

  setCookie(event, SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Delete the session cookie
 */
export function deleteUserSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/',
  })
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(event: H3Event): Session {
  const session = getUserSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }

  return session
}

/**
 * Build Google OAuth authorization URL
 */
export function buildGoogleAuthUrl(config: {
  clientId: string
  redirectUri: string
  state?: string
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })

  if (config.state) {
    params.set('state', config.state)
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(config: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  id_token: string
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code: config.code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw createError({
      statusCode: 400,
      message: `Failed to exchange code for tokens: ${error}`,
    })
  }

  return response.json()
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string
  email: string
  name: string
  picture: string
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw createError({
      statusCode: 400,
      message: 'Failed to get user info from Google',
    })
  }

  return response.json()
}
