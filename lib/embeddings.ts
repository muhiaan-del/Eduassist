import { pipeline, env } from '@huggingface/transformers'

// CRITICAL FIX for Vercel:
// 1. Prevent it from looking for local model files (Vercel has a read-only filesystem)
env.allowLocalModels = false

// 2. Safely set WASM thread count (if the backend exists)
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1
}

let embedder: any = null

export async function generateEmbedding(text: string) {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Supabase/gte-small', {
      dtype: 'q8', // Use quantized 8-bit for speed and size
    })
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}