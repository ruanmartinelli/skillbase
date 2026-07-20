import { env } from 'cloudflare:workers'
import type { ColumnType } from 'kysely'
import { CamelCasePlugin, Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'

export interface SkillsTable {
  id: number
  name: string
  source: string | null
  skillId: string | null
  installs: number
  weeklyInstalls: string | null
  content: string | null
  embedding: ColumnType<number[] | ArrayBuffer | null, ArrayBuffer | null, ArrayBuffer | null>
}

export interface Database {
  skills: SkillsTable
}

export const db = new Kysely<Database>({
  dialect: new D1Dialect({ database: (env as { DB: D1Database }).DB }),
  plugins: [new CamelCasePlugin()],
})
