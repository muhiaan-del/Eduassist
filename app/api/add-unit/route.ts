import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { courseId, name, code } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ensure the user owns the course before adding a unit
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('owner_id', user.id)
      .single()

    if (!course) return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 })

    // Insert the new unit
    const { error } = await supabase
      .from('units')
      .insert({
        course_id: courseId,
        name: name,
        unit_code: code.toUpperCase()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}