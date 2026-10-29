import { loadLocalEnv } from './_lib/env.js'

loadLocalEnv()

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Only POST requests are supported.' })
  const apiKey = process.env.GEMMA_API_KEY
  if (!apiKey) return response.status(500).json({ error: 'GEMMA_API_KEY is not configured on the server.' })
  const { question, items, history = [] } = request.body ?? {}
  if (typeof question !== 'string' || !Array.isArray(items)) {
    return response.status(400).json({ error: 'Request must include question and items.' })
  }
  const prompt = `You are Quiet Desk, a warm but honest personal student planning assistant. Answer the user question using only the supplied items and conversation history. If the user asks whether to attend an event, give a balanced recommendation using timing, location, cost, priority, evidence, and conflicts. Ask one clarifying question only when essential. Never claim an action was completed. Return concise plain text with practical next steps.
User question: ${question}
Conversation history:
${JSON.stringify(history).slice(-10000)}
Items:
${JSON.stringify(items).slice(0, 30000)}`
  const model = process.env.GEMMA_MODEL || 'gemma-4-31b-it'
  const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!result.ok) {
    const providerStatus = result.status
    const today = new Date().toISOString().slice(0, 10)
    const priorityRank = { High: 0, Medium: 1, Low: 2 }
    const dated = items.filter((item) => item.date && item.date >= today).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.time !== b.time) return (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
      return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1)
    })
    const conflicts = dated.filter((item, index) => dated.some((other, otherIndex) => (
      index !== otherIndex && item.date === other.date && item.time && item.time === other.time
    )))
    const lines = [
      `Gemma could not respond (Google AI Studio returned HTTP ${providerStatus}), so here is a local priority plan:`,
      ...dated.slice(0, 6).map((item, index) => `${index + 1}. ${item.title} — ${item.date}${item.time ? ` at ${item.time}` : ''}. ${item.action || 'Review this item.'}`),
    ]
    if (conflicts.length) lines.push(`Conflict: ${[...new Set(conflicts.map((item) => item.title))].join('; ')} overlap.`)
    return response.status(200).json({ answer: lines.join('\n') })
  }
  const payload = await result.json()
  const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!answer) return response.status(502).json({ error: 'Gemma returned no planning response.' })
  return response.status(200).json({ answer })
}
