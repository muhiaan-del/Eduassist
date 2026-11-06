import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { askGroq } from '@/lib/ai'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { courseId, studentMessage } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: materials } = await supabase
      .from('materials').select('content').eq('course_id', courseId)
    if (!materials || materials.length === 0) throw new Error('No materials found')

    const contextText = materials.map(m => m.content).join('\n\n').substring(0, 3000)

    const systemPrompt = `You are helping a lecturer draft a reply to a student's question. Use ONLY the course materials below. Be concise, friendly, and educational. If the answer isn't in the materials, politely suggest the student rephrase the question or come to office hours.

STUDENT MESSAGE:
${studentMessage}

COURSE MATERIALS:
${contextText}`

    const draft = await askGroq(systemPrompt, 'Draft a helpful reply to the student.')
    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}