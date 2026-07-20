import { chunk, keyBy, orderBy, take, uniqBy } from 'es-toolkit'
import { db } from './db'
import { generate } from './llm'
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

  async explain(q: string, skillId: number) {
    const vectors = await loadVectors()

    const target = vectors.find((v) => v.id === skillId)
    if (!target) return null

    const words = q.split(/\s+/).filter(Boolean).slice(0, 20)
    if (words.length === 0) return null

    const variants =
      words.length > 1
        ? words.map((_, i) => words.filter((_, j) => j !== i).join(' '))
        : []

    const [full, ...rest] = await embed([q, ...variants])
    const baseScore = cosine(full, target.vec)

    const contributions =
      words.length === 1
        ? [{ word: words[0], contribution: baseScore }]
        : orderBy(
            words.map((word, i) => ({
              word,
              contribution: baseScore - cosine(rest[i], target.vec),
            })),
            ['contribution'],
            ['desc'],
          )

    return { baseScore, contributions }
  },

  async ask(q: string) {
    const skills = await this.search(q, 15)
    
    const top = take(
      uniqBy(skills, (s) => s.name).filter((s) => s.score >= 0.6),
      5,
    )

    if (top.length === 0) return null

    const docs = await db
      .selectFrom('skills')
      .select(['id', 'content'])
      .where(
        'id',
        'in',
        top.map((s) => s.id),
      )
      .execute()
    const contentById = keyBy(docs, (d) => d.id)

    const context = top
      .map(
        (s) =>
          `## ${s.name} (by ${s.source})\n${(contentById[s.id]?.content ?? '').slice(0, 2500)}`,
      )
      .join('\n\n')

    const answer = await generate(
      'You help developers pick agent skills from the skillbase directory. ' +
        'The candidate skills for this question are documented below. ' +
        'Recommend the skill or skills that best fit the question, and for ' +
        'each one explain concretely what it does and how it approaches the ' +
        'task, drawing on its documentation — not just its name. Compare ' +
        'briefly when several fit. If none of them actually fit, say so ' +
        'plainly instead of stretching. ' +
        'Answer in plain text without markdown formatting.\n\n' +
        context,
      q,
    )

    return { answer, sources: top }
  },

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
