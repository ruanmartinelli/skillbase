import type { Child } from 'hono/jsx'
import type { Skill } from '../lib/skills'

export const Layout = ({ children }: { children: Child }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>skillbase</title>
      <link rel="stylesheet" href="https://unpkg.com/axist@latest/dist/axist.min.css" />
      <link rel="stylesheet" href="/style.css" />
      <script src="/script.js" defer></script>
    </head>
    <body>{children}</body>
  </html>
)

export const SearchForm = ({ q }: { q?: string }) => (
  <form method="get" action="/">
    <input
      type="search"
      name="q"
      placeholder="Search skills… (press / to focus)"
      value={q ?? ''}
      autocomplete="off"
    />
  </form>
)

export const SkillTable = ({ skills, q }: { skills: Skill[]; q?: string }) => (
  <table>
    <thead>
      <tr>
        <th>Skill</th>
        <th>Source</th>
        <th class="num">Installs</th>
        {q ? <th /> : null}
      </tr>
    </thead>
    <tbody>
      {skills.map((skill) => (
        <tr>
          <td>
            <a href={`https://www.skills.sh/${skill.source}/${skill.skillId}`}>{skill.name}</a>
          </td>
          <td class="muted">{skill.source}</td>
          <td class="num">{skill.installs.toLocaleString('en-US')}</td>
          {q ? (
            <td>
              <button type="button" class="why" data-id={skill.id}>
                why?
              </button>
            </td>
          ) : null}
        </tr>
      ))}
    </tbody>
  </table>
)

export const ExplainDialog = () => (
  <dialog id="explain">
    <h3 id="explain-name"></h3>
    <div id="explain-chips"></div>
    <p class="muted" id="explain-score"></p>
    <form method="dialog">
      <button>Close</button>
    </form>
  </dialog>
)
