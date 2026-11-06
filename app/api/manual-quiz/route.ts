import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { courseId, question, options, correctIndex, action, questionId } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // --- PUBLISH / UNPUBLISH ---
    if (action === 'publish' || action === 'unpublish') {
      const { error } = await supabaseAdmin
        .from('questions')
        .update({ published: action === 'publish' })
        .eq('id', questionId)
        .eq('course_id', courseId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // --- DELETE ---
    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('id', questionId)
        .eq('course_id', courseId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // --- CREATE NEW ---
    if (!question || !Array.isArray(options) || options.length !== 4) {
      return NextResponse.json({ error: 'Question and 4 options required' }, { status: 400 })
    }
    if (correctIndex < 0 || correctIndex > 3) {
      return NextResponse.json({ error: 'correctIndex must be 0-3' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        course_id: courseId,
        question: question.trim(),
        options: options.map((o: string) => o.trim()),
        correct_index: correctIndex,
        published: false,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, question: data })

  } catch (error: any) {
    console.error('[manual-quiz] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}