import { pipeline, env } from '@xenova/transformers'

// Force the library to use the WASM backend and skip native binary loading
env.allowLocalModels = false
env.backends.onnx.wasm.numThreads = 1

let embedder: any = null

export async function generateEmbedding(text: string) {
  if (!embedder) {
    // The 'cpu' device combined with allowLocalModels=false forces WASM
    embedder = await pipeline('feature-extraction', 'Supabase/gte-small', {
      device: 'cpu',
    })
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data) as number[]
}