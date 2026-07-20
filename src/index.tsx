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

app.post('/admin/embed', async (c) => {
  const limit = Number(c.req.query('limit') ?? 100)
  return c.json(await skills.embedMissing(limit))
})

export default app
