import { getGoogleConfig, getSession } from '../_lib/oauth.js'

const textFromPart = (part) => {
  if (part.mimeType === 'text/plain' && part.body?.data) return Buffer.from(part.body.data, 'base64url').toString('utf8')
  return (part.parts ?? []).map(textFromPart).filter(Boolean).join('\n')
}

const header = (message, name) => message.payload?.headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? ''

const getAccessToken = async (refreshToken) => {
  const config = getGoogleConfig()
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  if (!tokenResponse.ok) throw new Error('Unable to refresh the Gmail access token.')
  return (await tokenResponse.json()).access_token
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Only GET requests are supported.' })
  try {
    const session = getSession(request)
    if (!session) return response.status(401).json({ error: 'Connect Gmail first.' })
    const accessToken = await getAccessToken(session.refreshToken)
    const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!listResponse.ok) return response.status(502).json({ error: 'Unable to list Gmail messages.' })
    const list = await listResponse.json()
    const messages = await Promise.all((list.messages ?? []).map(async ({ id }) => {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!messageResponse.ok) return null
      const message = await messageResponse.json()
      return {
        id,
        subject: header(message, 'subject'),
        date: header(message, 'date'),
        body: textFromPart(message.payload ?? {}),
      }
    }))
    return response.status(200).json({ messages: messages.filter(Boolean) })
  } catch (error) {
    return response.status(502).json({ error: error.message })
  }
}
