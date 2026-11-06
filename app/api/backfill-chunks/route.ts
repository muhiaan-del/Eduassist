import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/embeddings'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
  try {
    // 1. Fetch all materials that don't yet have chunks
    const { data: materials, error } = await supabaseAdmin
      .from('materials')
      .select('id, course_id, content')
    
    if (error) throw error
    if (!materials || materials.length === 0) {
      return NextResponse.json({ message: 'No materials found.' })
    }

    let totalChunks = 0

    for (const mat of materials) {
      // Check if already backfilled
      const { count } = await supabaseAdmin
        .from('material_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('material_id', mat.id)
      
      if ((count || 0) > 0) continue // Skip already chunked

      console.log(`Chunking material ${mat.id}...`)
      const sentences = mat.content.match(/[^.!?]+[.!?]+/g) || [mat.content]
      const chunks: string[] = []
      let currentChunk = ''

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > 500) {
          if (currentChunk) chunks.push(currentChunk.trim())
          currentChunk = sentence
        } else {
          currentChunk += ' ' + sentence
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim())

      const validChunks = chunks.filter(c => c.length >= 20)
      for (const chunk of validChunks) {
        try {
          const embedding = await generateEmbedding(chunk)
          await supabaseAdmin.from('material_chunks').insert({
            material_id: mat.id,
            course_id: mat.course_id,
            content: chunk,
            embedding
          })
          totalChunks++
          await new Promise(r => setTimeout(r, 200))
        } catch (embErr) {
          console.error('Embedding error:', embErr)
        }
      }
    }

    return NextResponse.json({ success: true, chunksCreated: totalChunks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}