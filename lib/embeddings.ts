import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false

// Ensure WASM is used
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1
}

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