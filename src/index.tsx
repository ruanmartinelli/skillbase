import { Hono } from 'hono'
import { IndexPage } from './app'
import { skills } from './lib/skills'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q')

  const [rows, total] = await Promise.all([
    q ? skills.search(q, 50) : skills.list(),
    skills.count(),
  ])

  return c.html(<IndexPage skills={rows} total={total} q={q} />)
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

app.post('/admin/embed', async (c) => {
  const limit = Number(c.req.query('limit') ?? 100)
  return c.json(await skills.embedMissing(limit))
})

export default app
