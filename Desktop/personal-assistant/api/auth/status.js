import { getSession } from '../_lib/oauth.js'

export default function handler(request, response) {
  try {
    return response.status(200).json({ connected: Boolean(getSession(request)) })
  } catch {
    return response.status(200).json({ connected: false })
  }
}
