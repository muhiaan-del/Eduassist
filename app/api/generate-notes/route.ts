import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/embeddings'
import { askGroq } from '@/lib/ai'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { courseId, topic, range } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Embed the topic to use as the search query
    const queryEmbedding = await generateEmbedding(topic)

    // 2. Determine how many chunks to fetch based on the selected range
    let matchCount = 6
    if (range === 'narrow') matchCount = 3
    if (range === 'broad') matchCount = 10

    // 3. Retrieve the most relevant chunks from pgvector
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.35, // Slightly lower to catch related concepts
      match_count: matchCount,
      filter_course_id: courseId
    })

    if (error || !chunks || chunks.length === 0) {
      return NextResponse.json({ 
        error: 'No relevant materials found for this topic. Try a different search term.' 
      }, { status: 404 })
    }

    // 4. Combine chunks into a single context string
    const contextText = chunks.map((c: any) => c.content).join('\n\n')

    const systemPrompt = `You are an expert tutor helping a student study.
Using ONLY the course materials provided below, write comprehensive study notes about "${topic}".

Structure the notes with these exact sections:
- **Introduction** (What it is)
- **Key Concepts** (Bullet points)
- **Examples** (From the text)
- **Summary** (1 paragraph)

If the topic is not covered in the provided text, say: "This topic is not covered in the uploaded materials."

COURSE MATERIALS:
${contextText}`

    const notes = await askGroq(systemPrompt, `Write notes on: ${topic}`)

    // 5. Save the generated notes to the database
    await supabaseAdmin.from('saved_notes').insert({
      student_id: user.id,
      course_id: courseId,
      topic,
      content: notes
    })

    return NextResponse.json({ notes })

  } catch (error: any) {
    console.error('[generate-notes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}