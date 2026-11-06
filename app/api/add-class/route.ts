import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { unitId, name } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Generate a unique class code (e.g., CS101-X7Y)
    const classCode = `CLASS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const { error } = await supabase
      .from('classes')
      .insert({
        unit_id: unitId,
        lecturer_id: user.id,
        name: name,
        class_code: classCode
      })

    if (error) throw error

    return NextResponse.json({ success: true, code: classCode })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}