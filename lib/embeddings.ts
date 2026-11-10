import { pipeline, env } from '@huggingface/transformers'
import Module from 'module'

// 1. Intercept the native module require and redirect to WebAssembly
// This prevents Vercel from crashing due to missing native binaries.
try {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function (id: string) {
    if (id === 'onnxruntime-node') {
      // Silently return the web/wasm version instead of crashing
      return originalRequire.apply(this, ['onnxruntime-web']);
    }
    return originalRequire.apply(this, arguments as any);
  };
} catch (e) {
  console.warn('Could not patch require for onnxruntime-node', e);
}

// 2. Prevent local model downloads on Vercel
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