const modelUrl = (model, apiKey) => (
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
)

export const gemmaRequestBody = (prompt) => ({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    maxOutputTokens: 160,
    temperature: 0.4,
  },
})

let cachedModel
let cachedAt = 0

export const getAvailableGemmaModel = async (apiKey, preferredModel) => {
  if (cachedModel && Date.now() - cachedAt < 300000) return cachedModel
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) return preferredModel

    const payload = await response.json()
    const models = (payload.models ?? [])
      .filter((model) => model.name?.toLowerCase().includes('gemma'))
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
    const preferred = models.find((model) => model.name === `models/${preferredModel}`)
    cachedModel = (preferred?.name ?? models[0]?.name ?? `models/${preferredModel}`).replace(/^models\//, '')
    cachedAt = Date.now()
    return cachedModel
  } catch {
    return preferredModel
  }
}

export const gemmaUrl = modelUrl
