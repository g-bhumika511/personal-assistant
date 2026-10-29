import { loadLocalEnv } from './_lib/env.js'

const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it'
loadLocalEnv()

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Only POST requests are supported.' })
  }

  const apiKey = process.env.GEMMA_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'GEMMA_API_KEY is not configured on the server.' })
  }

  const { email, source = 'Gmail' } = request.body ?? {}
  if (typeof email !== 'string' || email.trim().length === 0) {
    return response.status(400).json({ error: 'Request must include a non-empty email string.' })
  }

  const prompt = `Extract actionable student items from this email. Return only a JSON array.
Each item must have: title, type (Event, Interview, Deadline, or Announcement), date (YYYY-MM-DD or null), time (HH:mm or null), location (string or null), cost (Free, Paid, or Unknown), and action.
Email:
${email.slice(0, 50000)}`

  const gemmaResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )

  if (!gemmaResponse.ok) {
    const detail = await gemmaResponse.text()
    console.error(`Gemma extraction failed with HTTP ${gemmaResponse.status}: ${detail.slice(0, 500)}`)
    return response.status(502).json({ error: 'Gemma extraction failed.', detail: detail.slice(0, 500) })
  }

  const payload = await gemmaResponse.json()
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    return response.status(502).json({ error: 'Gemma returned no extractable text.' })
  }

  const jsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const parsedItems = JSON.parse(jsonText)
    if (!Array.isArray(parsedItems)) throw new Error('Gemma response was not an array.')
    const items = parsedItems.map((item, index) => ({
      ...item,
      id: `${source}-${index}-${item.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      source: source.startsWith('Gmail:') ? source : `Local inbox: ${source}`,
    }))
    return response.status(200).json({ items })
  } catch {
    return response.status(502).json({ error: 'Gemma returned invalid JSON.' })
  }
}
