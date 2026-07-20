import type { Skill } from '../lib/skills'
import { ExplainDialog, Layout, SearchForm, SkillTable } from './components'

export const IndexPage = ({ skills, total, q }: { skills: Skill[]; total: number; q?: string }) => (
  <Layout>
    <header>
      <h1>skillbase</h1>
      <p class="muted">
        {total.toLocaleString('en-US')} open agent skills · <a href="/ask">ask a question</a>
      </p>
    </header>
    <SearchForm q={q} />
    {skills.length === 0 ? <p>No skills found.</p> : <SkillTable skills={skills} q={q} />}
    {q ? <ExplainDialog /> : null}
  </Layout>
)
