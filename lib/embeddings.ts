import { pipeline, env } from '@huggingface/transformers'

// CRITICAL FIX FOR VERCEL:
// Trick the library into thinking it's running in a browser.
// This forces it to use the WebAssembly (WASM) backend and completely
// ignores the native 'onnxruntime-node' binary that crashes on Vercel.
if (typeof window === 'undefined') {
  env.useBrowserCache = false;
  (env.backends as any).onnx.wasm.proxy = false;
  // Force the environment to act like a web environment
  (env as any).__isWebEnvironment = true; 
}

env.allowLocalModels = false;

if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
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