import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { roomName } = await req.json()
    console.log('[mark-live] Request for room:', roomName)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('[mark-live] No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[mark-live] User:', user.id)

    const { data: existing } = await admin
      .from('live_sessions').select('*').eq('room_name', roomName).single()

    console.log('[mark-live] Existing session:', existing)

    if (!existing) {
      console.error('[mark-live] No session found for room:', roomName)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('live_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('room_name', roomName)
      .select()

    if (error) {
      console.error('[mark-live] Update error:', error)
      throw error
    }

    console.log('[mark-live] Updated rows:', data?.length, 'data:', data)

    return NextResponse.json({ success: true, updated: data?.length || 0 })
  } catch (error: any) {
    console.error('[mark-live] Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}