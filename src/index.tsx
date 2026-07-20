import { env } from 'cloudflare:workers'
import { Hono } from 'hono'
import { IndexPage } from './app'
import { AskPage } from './app/ask'
import { generate } from './lib/llm'
import { skills } from './lib/skills'

const rate = (env as unknown as { RATE: KVNamespace }).RATE
const ASK_DAILY_LIMIT = 25

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q')

  const [rows, total] = await Promise.all([
    q ? skills.search(q, 50) : skills.list(),
    skills.count(),
  ])

  return c.html(<IndexPage skills={rows} total={total} q={q} />)
})

app.get('/ask', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q) return c.html(<AskPage />)

  // Generation is ~1000x the cost of a search, so cap questions per IP/day.
  const ip = c.req.header('cf-connecting-ip') ?? 'local'
  const key = `ask:${ip}:${new Date().toISOString().slice(0, 10)}`
  const used = Number((await rate.get(key)) ?? 0)

  if (used >= ASK_DAILY_LIMIT) return c.html(<AskPage q={q} limited />, 429)

  await rate.put(key, String(used + 1), { expirationTtl: 172800 })

  return c.html(<AskPage q={q} result={await skills.ask(q)} />)
})

app.get('/api/explain', async (c) => {
  const q = c.req.query('q')
  const id = Number(c.req.query('id'))

  if (!q || !Number.isInteger(id)) {
    return c.json({ error: 'q and id are required' }, 400)
  }

  const result = await skills.explain(q, id)
  return result ? c.json(result) : c.json({ error: 'skill not found' }, 404)
})

// Eval-only helpers, never available on the deployed host: JSON access to
// ask() and to the bare LLM, so scripts/eval.mjs can compare RAG vs raw.
const isLocal = (url: string) =>
  ['localhost', '127.0.0.1'].includes(new URL(url).hostname)

app.get('/admin/ask', async (c) => {
  if (!isLocal(c.req.url)) return c.notFound()
  const q = c.req.query('q')?.trim()
  if (!q) return c.json({ error: 'q is required' }, 400)
  return c.json(await skills.ask(q))
})

app.post('/admin/llm', async (c) => {
  if (!isLocal(c.req.url)) return c.notFound()
  const { system, user, model } = await c.req.json<{
    system: string
    user: string
    model?: string
  }>()
  try {
    return c.json({ text: await generate(system, user, model) })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

app.post('/admin/embed', async (c) => {
  const limit = Number(c.req.query('limit') ?? 100)
  return c.json(await skills.embedMissing(limit))
})

export default app
