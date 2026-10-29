import { loadLocalEnv } from './_lib/env.js'
import { gemmaRequestBody, gemmaUrl, getAvailableGemmaModel } from './_lib/gemma.js'

loadLocalEnv()

const priorityRank = { High: 0, Medium: 1, Low: 2 }

const getUpcomingItems = (items) => {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentTime = now.toTimeString().slice(0, 5)
  return items
    .filter((item) => item.date && (item.date > today || (item.date === today && (!item.time || item.time >= currentTime))))
    .sort((a, b) => `${a.date}${a.time || '99:99'}`.localeCompare(`${b.date}${b.time || '99:99'}`)
      || (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1))
}

const localAnswer = (question, items) => {
  const text = question.toLowerCase()
  const upcoming = getUpcomingItems(items)
  const events = upcoming.filter((item) => item.type === 'Event')
  const match = items.find((item) => {
    const titleWords = item.title.toLowerCase().split(/\s+/).filter((word) => word.length > 4)
    return titleWords.some((word) => text.includes(word))
  })

  if (/\b(attend|go to|should i go|worth going)\b/.test(text) && match) {
    const details = [match.time && `starts at ${match.time}`, match.location && `at ${match.location}`, match.cost === 'Free' && 'free entry'].filter(Boolean).join(', ')
    return `${match.title} is optional${details ? ` (${details})` : ''}. Go if it sounds enjoyable and fits your evening; otherwise, it is fine to skip.`
  }
  if (/\b(first|next|priorit|start)\b/.test(text)) {
    const first = upcoming[0]
    return first
      ? `Start with ${first.title}${first.time ? ` at ${first.time}` : ''}. ${first.action || 'Give it your attention first.'}`
      : 'You have no upcoming dated items. Pick one small inbox task to clear next.'
  }
  if (/\b(deadline|due|application|fees)\b/.test(text)) {
    const deadlines = upcoming.filter((item) => item.type === 'Deadline').slice(0, 3)
    return deadlines.length
      ? `Your next deadlines are: ${deadlines.map((item) => `${item.title}${item.date ? ` (${item.date})` : ''}`).join('; ')}. Start with the soonest one.`
      : 'You do not have any upcoming deadlines in your desk.'
  }
  if (/\b(free|event|tonight|social)\b/.test(text)) {
    const freeEvents = events.filter((item) => item.cost === 'Free').slice(0, 3)
    return freeEvents.length
      ? `Free upcoming events: ${freeEvents.map((item) => `${item.title}${item.time ? ` at ${item.time}` : ''}`).join('; ')}.`
      : 'There are no upcoming free events in your desk.'
  }
  if (/\b(tired|stress|stressed|easy|low energy)\b/.test(text)) {
    const gentle = upcoming.filter((item) => item.priority !== 'High').slice(0, 2)
    return gentle.length
      ? `Let’s keep it light: start with ${gentle[0].title}. ${gentle[1] ? `Then try ${gentle[1].title}.` : ''}`
      : 'Take one small step: review your next upcoming item and prepare only what you need.'
  }
  return upcoming.length
    ? `You have ${upcoming.length} upcoming items. Start with ${upcoming[0].title}${upcoming[0].time ? ` at ${upcoming[0].time}` : ''}.`
    : 'Your desk is clear of upcoming dated items.'
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Only POST requests are supported.' })
  const apiKey = process.env.GEMMA_API_KEY
  if (!apiKey) return response.status(500).json({ error: 'GEMMA_API_KEY is not configured on the server.' })
  const { question, items, history = [] } = request.body ?? {}
  if (typeof question !== 'string' || !Array.isArray(items)) {
    return response.status(400).json({ error: 'Request must include question and items.' })
  }
  const prompt = `You are Quiet Desk, a warm, friendly personal student planning assistant. Reply with only the final answer to the user's question. Do not show your reasoning, drafts, self-corrections, constraint checks, word counts, or analysis. Use only the supplied items and conversation history. Keep it natural, concise, and under 80 words. Use at most 3 short bullets only when helpful, followed by one clear next step. If the user asks whether to attend an event, give a brief balanced recommendation using timing, location, cost, priority, evidence, and conflicts. Ask a clarifying question only when essential. Never claim an action was completed. Avoid repeating the full item list or formal disclaimers. Use a supportive tone.
User question: ${question}
Conversation history:
${JSON.stringify(history).slice(-10000)}
Items:
${JSON.stringify(items).slice(0, 30000)}`
  const configuredModel = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it'
  const model = await getAvailableGemmaModel(apiKey, configuredModel)
  let result
  try {
    const request = async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 7000)
      try {
        return await fetch(gemmaUrl(model, apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gemmaRequestBody(prompt)),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }
    }
    result = await request()
    if (result.status === 429 || result.status === 503) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      result = await request()
    }
  } catch {
  }
  if (!result || !result.ok) {
    return response.status(200).json({ answer: localAnswer(question, items) })
  }
  const payload = await result.json()
  const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!answer) return response.status(502).json({ error: 'Gemma returned no planning response.' })
  return response.status(200).json({ answer })
}
