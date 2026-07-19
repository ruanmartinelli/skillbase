import { db } from './db'

export interface SkillFilter {
  name?: string
}

export const skills = {
  list(filter: SkillFilter = {}) {
    let query = db.selectFrom('skills').selectAll()
    if (filter.name) query = query.where('name', 'like', `%${filter.name}%`)
    return query.execute()
  },
}
