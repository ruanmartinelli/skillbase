import type { skills } from '../lib/skills'
import { Layout } from './components'

type AskResult = NonNullable<Awaited<ReturnType<typeof skills.ask>>>

export const AskPage = ({
  q,
  result,
  limited,
}: {
  q?: string
  result?: AskResult | null
  limited?: boolean
}) => (
  <Layout>
    <header>
      <h1>
        <a href="/">skillbase</a> · ask
      </h1>
      <p class="muted">
        ask a question, get an answer grounded in the skill directory
      </p>
    </header>
    <form method="get" action="/ask">
      <input
        type="search"
        name="q"
        placeholder="What are you trying to do?"
        value={q ?? ''}
        autocomplete="off"
      />
    </form>
    {limited ? (
      <p class="muted">Daily question limit reached — come back tomorrow.</p>
    ) : q && !result ? (
      <p>No skills in the directory are a good match for that question.</p>
    ) : null}
    {result ? (
      <>
        <article class="answer">{result.answer}</article>
        <p class="muted">
          based on:{' '}
          {result.sources.map((s, i) => (
            <>
              {i > 0 ? ', ' : ''}
              <a href={`https://www.skills.sh/${s.source}/${s.skillId}`}>
                {s.name}
              </a>
            </>
          ))}
        </p>
      </>
    ) : null}
  </Layout>
)
