import { clearSession } from '../_lib/oauth.js'

export default function handler(request, response) {
  clearSession(response)
  return response.redirect('/')
}
