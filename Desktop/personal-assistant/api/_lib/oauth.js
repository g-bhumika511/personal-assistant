import crypto from 'node:crypto'
import { loadLocalEnv } from './env.js'

const cookieName = 'quiet_desk_session'
const cookieSecurity = () => process.env.NODE_ENV === 'production' ? '; Secure' : ''
loadLocalEnv()

const getConfig = () => {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'SESSION_SECRET']
  const missing = required.filter((name) => !process.env[name])
  if (missing.length) throw new Error(`Missing server configuration: ${missing.join(', ')}`)
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    sessionSecret: process.env.SESSION_SECRET,
  }
}

const sign = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('base64url')

export const getSession = (request) => {
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))
  if (!cookie) return null
  const encoded = cookie.slice(cookieName.length + 1)
  const [value, signature] = encoded.split('.')
  const config = getConfig()
  if (!value || !signature || sign(value, config.sessionSecret) !== signature) return null
  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    return session.exp > Date.now() ? session : null
  } catch {
    return null
  }
}

export const setSession = (response, session) => {
  const config = getConfig()
  const value = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString('base64url')
  response.setHeader('Set-Cookie', `${cookieName}=${value}.${sign(value, config.sessionSecret)}; HttpOnly${cookieSecurity()}; SameSite=Lax; Path=/; Max-Age=2592000`)
}

export const clearSession = (response) => {
  response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly${cookieSecurity()}; SameSite=Lax; Path=/; Max-Age=0`)
}

export const getGoogleConfig = getConfig
