'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function JoinCourseForm() {
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setMsg('Joining...')

    // 1. Find the course by code
    const { data: course, error: findErr } = await supabase
      .from('courses')
      .select('id')
      .eq('join_code', code.trim().toUpperCase())
      .single()

    if (findErr || !course) return setMsg('Invalid course code.')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Not logged in.')

    // 2. Add to enrollments table
    const { error: joinErr } = await supabase
      .from('enrollments')
      .insert({ course_id: course.id, student_id: user.id })

    if (joinErr) {
      if (joinErr.code === '23505') setMsg('You are already enrolled in this course.')
      else setMsg(joinErr.message)
    } else {
      setMsg('')
      setCode('')
      window.location.reload()
    }
  }

  return (
    <div>
      <h2 className="font-semibold mb-2 text-gray-800">Join an Existing Class</h2>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          className="border p-2 rounded w-full text-black uppercase focus:outline-purple-500"
          placeholder="Enter 6-character Code"
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={6}
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap font-medium"
        >
          Join Class
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-red-600 font-bold">{msg}</p>}
    </div>
  )
}