import crypto from 'node:crypto'
import { getGoogleConfig } from '../_lib/oauth.js'

export default function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Only GET requests are supported.' })
  try {
    const config = getGoogleConfig()
    const state = crypto.randomBytes(24).toString('base64url')
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    response.setHeader('Set-Cookie', `quiet_desk_oauth_state=${state}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=600`)
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (error) {
    return response.status(500).json({ error: error.message })
  }
}
