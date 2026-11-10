import { pipeline, env } from '@huggingface/transformers'

// Prevent looking for local models on Vercel
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