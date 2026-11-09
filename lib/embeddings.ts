import { pipeline, env } from '@huggingface/transformers'

// Critical for Vercel: prevent loading local model files from read-only filesystem
env.allowLocalModels = false

// Force WASM backend by prioritizing it over native CPU bindings
// This must be done before pipeline initialization
;(env as any).backends.setPriority?.(['wasm', 'cpu'])

let embedder: any = null

export async function generateEmbedding(text: string) {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Supabase/gte-small', {
      dtype: 'q8',
    })
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}