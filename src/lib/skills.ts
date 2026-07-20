import { chunk, keyBy, orderBy, take } from 'es-toolkit'
import { db } from './db'
import { cosine, embed, fromBytes, toBytes } from './vectors'

let cached: { id: number; vec: Float32Array }[] | null = null

async function loadVectors() {
  if (cached) return cached

  const vectors: { id: number; vec: Float32Array }[] = []

  for (let lastId = 0; ; ) {
    const page = await db
      .selectFrom('skills')
      .select(['id', 'embedding'])
      .where('embedding', 'is not', null)
      .where('id', '>', lastId)
      .orderBy('id')
      .limit(1000)
      .execute()

    if (page.length === 0) break

    for (const row of page) {
      vectors.push({
        id: row.id,
        vec: fromBytes(row.embedding!),
      })
    }

    lastId = page[page.length - 1].id
  }

  cached = vectors

  return vectors
}

export const skills = {
  list(filter: { name?: string } = {}) {
    let query = db
      .selectFrom('skills')
      .select(['id', 'name', 'source', 'skillId', 'installs'])
      .orderBy('installs', 'desc')
      .limit(200)

    if (filter.name) query = query.where('name', 'like', `%${filter.name}%`)

    return query.execute()
  },

  async count() {
    const row = await db
      .selectFrom('skills')
      .select((eb) => eb.fn.countAll().as('n'))
      .executeTakeFirst()

    return Number(row?.n ?? 0)
  },

  async search(q: string, limit = 20) {
    const [qVector] = await embed([q])

    const vectors = await loadVectors()

    const scored = vectors.map(({ id, vec }) => ({
      id,
      score: cosine(qVector, vec),
    }))

    const top = take(orderBy(scored, ['score'], ['desc']), limit)

    if (top.length === 0) return []

    const ids = top.map((t) => t.id)
    const rows = await db
      .selectFrom('skills')
      .select(['id', 'name', 'source', 'skillId', 'installs'])
      .where('id', 'in', ids)
      .execute()

    const byId = keyBy(rows, (r) => r.id)

    return top.flatMap((t) => {
      const row = byId[t.id]
      return row ? [{ ...row, score: t.score }] : []
    })
  },

  // @todo: remove after running
  async embedMissing(limit = 100) {
    const embeddingText = (name: string, content: string | null) =>
      `${name}\n\n${(content ?? '').slice(0, 1500)}`

    const rows = await db
      .selectFrom('skills')
      .select(['id', 'name', 'content'])
      .where('embedding', 'is', null)
      .orderBy('id')
      .limit(limit)
      .execute()

    if (rows.length > 0) {
      const texts = rows.map((r) => embeddingText(r.name, r.content))

      const vecs = await embed(texts)

      const updates = rows.map((row, i) => ({ id: row.id, vec: vecs[i] }))
      for (const batch of chunk(updates, 20)) {
        await Promise.all(
          batch.map((u) =>
            db
              .updateTable('skills')
              .set({ embedding: toBytes(u.vec) })
              .where('id', '=', u.id)
              .execute(),
          ),
        )
      }
      cached = null
    }

    const remaining = await db
      .selectFrom('skills')
      .select((eb) => eb.fn.countAll().as('n'))
      .where('embedding', 'is', null)
      .executeTakeFirst()

    return { embedded: rows.length, remaining: Number(remaining?.n ?? 0) }
  },
}

export type Skill = Awaited<ReturnType<typeof skills.list>>[number]
