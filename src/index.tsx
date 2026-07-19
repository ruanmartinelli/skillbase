import { Hono } from 'hono'
import { IndexPage } from './app'
import { skills } from './lib/skills'

const app = new Hono()

app.get('/', async (c) => {
  const rows = await skills.list()
  return c.html(<IndexPage skills={rows} />)
})

export default app
