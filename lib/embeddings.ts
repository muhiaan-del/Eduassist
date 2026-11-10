import { pipeline, env } from '@huggingface/transformers'

// CRITICAL: Force WASM backend priority before pipeline initialization
// This prevents the library from attempting to load the native onnxruntime-node binary
env.backends.setPriority(['wasm', 'cpu'])

env.allowLocalModels = false

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