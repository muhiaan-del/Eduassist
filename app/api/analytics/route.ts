import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const scope = searchParams.get('scope') || 'faculty'

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ============================================
    // STUDENT SCOPE — only their own attempts
    // ============================================
    if (scope === 'student') {
      const { data: attempts, error } = await supabaseAdmin
        .from('quiz_attempts')
        .select('id, question_id, correct, created_at')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const byDate: Record<string, { total: number; correct: number }> = {}
      for (const a of attempts || []) {
        const day = new Date(a.created_at).toISOString().slice(0, 10)
        if (!byDate[day]) byDate[day] = { total: 0, correct: 0 }
        byDate[day].total++
        if (a.correct) byDate[day].correct++
      }

      const history = Object.entries(byDate)
        .map(([date, s]) => ({ date, ...s, percentage: Math.round((s.correct / s.total) * 100) }))
        .sort((a, b) => b.date.localeCompare(a.date))

      return NextResponse.json({ scope: 'student', history })
    }

    // ============================================
    // FACULTY SCOPE — aggregate per-question stats
    // ============================================
    
    // 1. Fetch the course to get the institution
    const { data: course } = await supabaseAdmin
      .from('courses').select('institution_id').eq('id', courseId).single()
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    // 2. Verify the user is EITHER the Admin of the institution OR a Faculty assigned to a class in this course
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role, institution_id').eq('id', user.id).single()
      
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

    const isAdmin = profile.role === 'admin' && profile.institution_id === course.institution_id
    
    // Check if the user is assigned as a lecturer to any class in this course
    let isFaculty = false
    if (profile.role === 'faculty') {
      const { data: assignedClass } = await supabaseAdmin
        .from('classes')
        .select(`
          id,
          units!inner(course_id)
        `)
        .eq('lecturer_id', user.id)
        .eq('units.course_id', courseId)
        .limit(1)
        .maybeSingle()
      
      if (assignedClass) isFaculty = true
    }

    if (!isAdmin && !isFaculty) {
      return NextResponse.json({ error: 'Forbidden: You do not teach this course.' }, { status: 403 })
    }

    // 3. Fetch published questions
    const { data: questions } = await supabaseAdmin
      .from('questions').select('id, question, options, correct_index, published')
      .eq('course_id', courseId)
      .eq('published', true)
      .order('created_at')

    // 4. Fetch all attempts
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts').select('question_id, correct, student_id')
      .eq('course_id', courseId)

    // 5. Aggregate per question
    const perQuestion = (questions || []).map(q => {
      const qAttempts = (attempts || []).filter(a => a.question_id === q.id)
      const correctCount = qAttempts.filter(a => a.correct).length
      const total = qAttempts.length
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        totalAttempts: total,
        correctCount,
        percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0
      }
    })

    const totalAttempts = (attempts || []).length
    const totalCorrect = (attempts || []).filter(a => a.correct).length
    const classAverage = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
    const uniqueStudents = new Set((attempts || []).map(a => a.student_id)).size

    return NextResponse.json({
      scope: 'faculty',
      perQuestion,
      classAverage,
      totalAttempts,
      totalCorrect,
      uniqueStudents
    })
  } catch (error: any) {
    console.error('[analytics] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}