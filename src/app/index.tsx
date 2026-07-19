import type { Skill } from '../lib/skills'

export const IndexPage = ({ skills }: { skills: Skill[] }) => (
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
