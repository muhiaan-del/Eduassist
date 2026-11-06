'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CreateCourseForm() {
  const [title, setTitle] = useState('')
  const [unitName, setUnitName] = useState('')
  const [unitCode, setUnitCode] = useState('')
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !unitName.trim() || !unitCode.trim()) return
    
    setMsg('Creating...')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setMsg('Not logged in.')

    // 1. Get the Faculty's institution_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.institution_id) {
      return setMsg("Error: Your faculty account is not linked to an institution. Contact Admin.")
    }
    
    // 2. Create the Course (linked to institution)
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: newCourse, error: courseError } = await supabase
      .from('courses')
      .insert({ 
        title: title.trim(), 
        owner_id: user.id, 
        join_code: joinCode,
        institution_id: profile.institution_id // <--- CRITICAL FIX
      })
      .select()
      .single()
      
    if (courseError) return setMsg("Course DB Error: " + courseError.message)

    // 3. Create the first Unit
    const { error: unitError } = await supabase
      .from('units')
      .insert({
        course_id: newCourse.id,
        name: unitName.trim(),
        unit_code: unitCode.trim().toUpperCase()
      })

    if (unitError) return setMsg("Unit DB Error: " + unitError.message)

    setTitle('')
    setUnitName('')
    setUnitCode('')
    setMsg('')
    window.location.reload()
  }

  return (
    <div>
      <h2 className="font-semibold mb-2 text-gray-800">Create a Course & Unit</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded w-full text-black"
          placeholder="Course Title, e.g. BSc Computer Science"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="border p-2 rounded w-full text-black"
            placeholder="Unit Name, e.g. Intro to Programming"
            value={unitName}
            onChange={e => setUnitName(e.target.value)}
            required
          />
          <input
            className="border p-2 rounded w-full sm:w-1/3 text-black uppercase"
            placeholder="Unit Code, e.g. CSC101"
            value={unitCode}
            onChange={e => setUnitCode(e.target.value)}
            maxLength={10}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !unitName.trim() || !unitCode.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          Create Course & Unit
        </button>
      </form>
      {msg && <p className="mt-2 text-sm text-red-600 font-bold">{msg}</p>}
    </div>
  )
}