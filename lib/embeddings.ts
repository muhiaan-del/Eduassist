import { pipeline, env } from '@xenova/transformers'

// 1. CRITICAL FIX: Force the WASM backend to avoid missing .so file errors on Vercel
env.backends.setPriority(['wasm', 'cpu'])

let embedder: any = null

export async function generateEmbedding(text: string) {
  if (!embedder) {
    // This will download the model (~30MB) on the first call
    embedder = await pipeline('feature-extraction', 'Supabase/gte-small')
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}