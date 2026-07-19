import { Hono } from 'hono'
import { IndexPage } from './app'
import { skills } from './lib/skills'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q')

  const [rows, total] = await Promise.all([
    skills.list({ name: q }),
    skills.count(),
  ])

  return c.html(<IndexPage skills={rows} total={total} q={q} />)
})

export default app
