import { env } from 'cloudflare:workers'
import { chunk } from 'es-toolkit'

export const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5'

const ai = (env as unknown as { AI: Ai }).AI

export async function embed(texts: string[]): Promise<Float32Array[]> {
  const out: Float32Array[] = []

  type V = { data: number[][] }

  for (const batch of chunk(texts, 50)) {
    const res = (await ai.run(EMBEDDING_MODEL, { text: batch })) as V

    for (const v of res.data) out.push(Float32Array.from(v))
  }

  return out
}

export const toBytes = (v: Float32Array): ArrayBuffer => v.buffer as ArrayBuffer

export function fromBytes(
  raw: ArrayBuffer | Uint8Array | number[],
): Float32Array {
  if (raw instanceof ArrayBuffer) return new Float32Array(raw)

  const bytes = raw instanceof Uint8Array ? raw : Uint8Array.from(raw)

  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0
  let na = 0
  let nb = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}
