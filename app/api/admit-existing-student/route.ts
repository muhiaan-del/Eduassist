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
    const { studentId, classIds, courseId } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!studentId || !classIds || classIds.length === 0 || !courseId) {
      return NextResponse.json({ error: 'Missing studentId, classIds, or courseId' }, { status: 400 })
    }

    // 1. Verify student exists
    const { data: student } = await supabaseAdmin
      .from('profiles').select('id, role').eq('id', studentId).single()
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 2. Check what's already enrolled
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('class_id')
      .eq('student_id', studentId)
      .in('class_id', classIds)

    const alreadyEnrolled = new Set((existing || []).map(e => e.class_id))
    const newClassIds = classIds.filter((id: string) => !alreadyEnrolled.has(id))

    if (newClassIds.length === 0) {
      return NextResponse.json({
        success: true,
        added: 0,
        skipped: alreadyEnrolled.size,
        message: 'Student is already enrolled in all selected classes.'
      })
    }

    // 3. Insert each new class
    let added = 0
    const errors: string[] = []

    for (const classId of newClassIds) {
      const payload = {
        student_id: studentId,
        class_id: classId,
        course_id: courseId
      }
      console.log('[enroll] Attempting insert:', payload)

      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .insert(payload)
        .select()

      if (error) {
        console.error('[enroll] Insert failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        // Unique violation (already enrolled in this class or course)
        if (error.code === '23505') {
          console.log(`[enroll] Skipping ${classId} — already exists`)
          continue
        }

        // Foreign key violation (class or course doesn't exist)
        if (error.code === '23503') {
          errors.push(`${classId}: class or course not found`)
          continue
        }

        // Any other error
        errors.push(`${classId}: ${error.message}`)
      } else {
        console.log(`[enroll] Successfully added to class ${classId}`, data)
        added++
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      added,
      skipped: alreadyEnrolled.size,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (err: any) {
    console.error('[enroll] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}