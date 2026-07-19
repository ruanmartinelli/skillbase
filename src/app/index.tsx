import type { Skill } from '../lib/skills'
import { Layout, SearchForm, SkillTable } from './components'

export const IndexPage = ({ skills, total, q }: { skills: Skill[]; total: number; q?: string }) => (
  <Layout>
    <header>
      <h1>skillbase</h1>
      <p class="muted">
        {total.toLocaleString('en-US')} open agent skills
      </p>
    </header>
    <SearchForm q={q} />
    {skills.length === 0 ? <p>No skills found.</p> : <SkillTable skills={skills} />}
  </Layout>
)
