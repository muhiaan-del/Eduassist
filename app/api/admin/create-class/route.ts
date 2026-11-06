import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { className, unitId, lecturerId } = await req.json()

    if (!className || !unitId || !lecturerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const classCode = `CLS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const { error } = await supabaseAdmin
      .from('classes')
      .insert({
        name: className,
        class_code: classCode,
        unit_id: unitId,
        lecturer_id: lecturerId
      })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}