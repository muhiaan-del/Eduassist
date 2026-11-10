import { pipeline, env } from '@huggingface/transformers'

// 1. Tell Transformers.js to run in a browser-like environment
// This forces it to use the WASM (WebAssembly) backend and skips the native onnxruntime-node binary
;(env as any).backends.onnx.wasm.proxy = false;
(env as any).allowLocalModels = false;

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