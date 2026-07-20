import { sampleSize } from 'es-toolkit'
import type { skills } from '../lib/skills'
import { Layout } from './components'

type AskResult = NonNullable<Awaited<ReturnType<typeof skills.ask>>>

const QUESTIONS = [
  'how can my agent test a web app in the browser',
  'help my agent design better looking frontends',
  'I want to make a product launch video',
  'help me resolve gnarly merge conflicts',
  'I need to extract a design system from an existing site',
  'how do I build an MCP server',
  'help my agent do security reviews of my code',
  'generate documentation for my codebase',
  'I want to create marketing copy that converts',
  'help me do deep research on a topic',
  'turn a webpage into a video',
]


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

    {q ? null : (
      <nav class="suggestions">
        {sampleSize(QUESTIONS, 3).map((s) => (
          <a href={`/ask?q=${encodeURIComponent(s)}`}>{s}</a>
        ))}
      </nav>
    )}

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
