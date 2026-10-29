import fs from 'node:fs/promises'
import path from 'node:path'

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Only GET requests are supported.' })
  try {
    const inboxPath = path.join(process.cwd(), 'inbox')
    const names = (await fs.readdir(inboxPath)).filter((name) => name.endsWith('.eml'))
    const messages = await Promise.all(names.map(async (name) => ({
      id: name,
      source: name,
      body: await fs.readFile(path.join(inboxPath, name), 'utf8'),
    })))
    return response.status(200).json({ messages })
  } catch {
    return response.status(500).json({ error: 'Unable to read the local inbox directory.' })
  }
}
