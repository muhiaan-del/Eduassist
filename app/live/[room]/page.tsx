import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LiveRoom from './LiveRoom'

export default async function LivePage(props: {
  params: Promise<{ room: string }>,
  searchParams: Promise<{ role?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*, classes(name)')
    .eq('room_name', params.room)
    .single()

  if (!session) return <div className="p-8">Session not found</div>

  const role = searchParams.role === 'host' ? 'host' : 'student'

  return <LiveRoom roomName={params.room} role={role} title={session.title} />
}