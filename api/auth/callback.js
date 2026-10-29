import { getGoogleConfig, setSession } from '../_lib/oauth.js'

const getCookie = (request, name) => request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)

export default async function handler(request, response) {
  const { code, state, error } = request.query
  if (error) return response.redirect(`/?authError=${encodeURIComponent(error)}`)
  if (!code || !state || state !== getCookie(request, 'quiet_desk_oauth_state')) return response.status(400).send('Invalid OAuth state.')

  try {
    const config = getGoogleConfig()
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenResponse.ok) return response.status(502).send('Google token exchange failed.')
    const tokens = await tokenResponse.json()
    if (!tokens.refresh_token) return response.status(502).send('Google did not return a refresh token. Try connecting again.')
    setSession(response, { refreshToken: tokens.refresh_token })
    return response.redirect('/?connected=1')
  } catch {
    return response.status(500).send('Unable to complete Google sign-in.')
  }
}
