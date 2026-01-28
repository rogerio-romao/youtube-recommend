import { buildGoogleAuthUrl } from '../../utils/auth'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  if (!config.googleClientId) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment.',
    })
  }

  const authUrl = buildGoogleAuthUrl({
    clientId: config.googleClientId,
    redirectUri: config.googleRedirectUri,
  })

  return sendRedirect(event, authUrl)
})
