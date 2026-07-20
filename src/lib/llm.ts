import { env } from 'cloudflare:workers'

export const CHAT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

const ai = (env as unknown as { AI: Ai }).AI

export async function generate(
  system: string,
  user: string,
  model = CHAT_MODEL,
) {
  const res = (await ai.run(model as typeof CHAT_MODEL, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 900,
  })) as { response?: unknown }

  const text =
    typeof res.response === 'string'
      ? res.response
      : JSON.stringify(res.response ?? '')
  return text.trim()
}
