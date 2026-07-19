import type { SkillsTable } from '../lib/db'

export const IndexPage = ({ skills }: { skills: SkillsTable[] }) => (
  <html>
    <body>
      <h1>Skills</h1>
      {skills.length === 0 ? (
        <p>No skills yet.</p>
      ) : (
        <ul>
          {skills.map((skill) => (
            <li>{skill.name}</li>
          ))}
        </ul>
      )}
    </body>
  </html>
)
