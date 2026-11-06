import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: fetch all messages between current user and a specific peer in a class
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const peerId = searchParams.get('peerId')
    const classId = searchParams.get('classId')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('class_id', classId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ messages: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: send a message
export async function POST(req: Request) {
  try {
    const { receiverId, classId, content } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      class_id: classId,
      content
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}