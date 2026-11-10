// Import from the browser-specific build to force WASM backend
// @ts-ignore - The browser entry point doesn't have types
import { pipeline, env } from '@huggingface/transformers/dist/transformers.web.js'

env.allowLocalModels = false

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