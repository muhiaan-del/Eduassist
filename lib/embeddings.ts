import { pipeline, env } from '@xenova/transformers'

// Force the WASM backend by disabling the native CPU backend
// This prevents the "libonnxruntime.so.1" error on Vercel
env.backends.onnx.cpu = false

let embedder: any = null

export async function generateEmbedding(text: string) {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Supabase/gte-small')
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}