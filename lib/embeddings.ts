import { pipeline, env } from '@huggingface/transformers'

// CRITICAL FIX for Vercel:
// Force the library to prioritize the WASM backend.
// This prevents it from trying to load the native 'onnxruntime-node' binary,
// which is missing on Vercel and causes a crash.
env.backends.setPriority(['wasm', 'cpu'])

// Optional: Prevent it from looking for local model files
env.allowLocalModels = false

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