const decodeXml = (value) => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')

const readTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, '').trim()) : ''
}

const readImage = (xml) => {
  const media = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i)
    || xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
  return media?.[1] || null
}

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Only GET requests are supported.' })
  const category = request.query?.category === 'ai' ? 'ai' : 'galway'

  try {
    const queries = category === 'ai'
      ? [
        ['Research', 'artificial intelligence research OR AI research OR machine learning research'],
        ['Companies', 'AI companies OR artificial intelligence companies'],
        ['Products', 'AI product launch OR AI tools launch OR generative AI product'],
        ['Updates', 'artificial intelligence news OR generative AI news'],
      ]
      : [['Galway', 'Galway']]
    const feeds = await Promise.all(queries.map(async ([label, query]) => {
      const feedResponse = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IE&gl=IE&ceid=IE:en`, {
        headers: { 'User-Agent': 'Quiet Desk/1.0' },
        signal: AbortSignal.timeout(6000),
      })
      if (!feedResponse.ok) throw new Error(`News feed returned HTTP ${feedResponse.status}`)
      const xml = await feedResponse.text()
      return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
        .slice(0, category === 'ai' ? 4 : 8)
        .map((match) => {
          const item = match[1]
          return {
            title: readTag(item, 'title'),
            link: readTag(item, 'link'),
            source: readTag(item, 'source') || 'Google News',
            published: readTag(item, 'pubDate'),
            image: readImage(item),
            category: label,
          }
        })
        .filter((item) => item.title && item.link)
    }))
    const items = [...new Map(feeds.flat().map((item) => [item.link, item])).values()]
      .sort((a, b) => new Date(b.published) - new Date(a.published))
    return response.status(200).json({ items })
  } catch {
    return response.status(502).json({ error: category === 'ai' ? 'AI news is temporarily unavailable.' : 'Galway news is temporarily unavailable.' })
  }
}
