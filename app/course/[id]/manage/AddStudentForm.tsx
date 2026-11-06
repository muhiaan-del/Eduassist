'use client'
import { useState } from 'react'

export default function AddStudentForm({ courseId, classId }: { courseId: string, classId: string }) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Visual only - API appends the real domain
  const DOMAIN_SUFFIX = '@techuniversity.ac.ke'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('Enrolling student...')

    const res = await fetch('/api/invite-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        fullName: name, 
        classId, 
        courseId 
      })
    })

    const data = await res.json()
    
    if (res.ok) {
      setMsg(`✅ Student Enrolled! Email: ${data.fullEmail} | Password: ${data.password}`)
      setName('')
      setUsername('')
    } else {
      setMsg(`❌ Error: ${data.error}`)
    }
    setLoading(false)
  }

  return (
    <div className="mt-4 pt-4 border-t border-blue-200">
      <h5 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Admit Student to this Class</h5>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded w-full text-sm" placeholder="Student Full Name" />
        
        {/* SMART EMAIL INPUT */}
        <div className="flex rounded-md w-full border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
          <input 
            required 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))} 
            className="p-2 w-full text-sm outline-none" 
            placeholder="username" 
          />
          <span className="bg-gray-100 text-gray-500 text-sm px-2 py-2 border-l flex items-center whitespace-nowrap">
            {DOMAIN_SUFFIX}
          </span>
        </div>

        <button disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap">
          {loading ? '...' : 'Add Student'}
        </button>
      </form>
      {msg && (
        <p className={`text-xs font-bold mt-2 p-2 rounded ${msg.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}