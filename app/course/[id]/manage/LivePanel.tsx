'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LivePanel({ classes, lecturerId }: { classes: any[], lecturerId: string }) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [title, setTitle] = useState('')
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function createSession() {
    if (!selectedClass || !title.trim()) return
    setLoading(true)

    const res = await fetch('/api/livekit/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selectedClass, title })
    })
    const data = await res.json()
    if (res.ok) {
      setSession(data.session)
      router.push(`/live/${data.session.room_name}?role=host`)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Live Lecture</h3>

      <div className="space-y-3 mb-4">
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="w-full border p-2 rounded text-sm"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.unit_code})</option>
          ))}
        </select>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Lecture title (e.g. Week 5: Recursion)"
          className="w-full border p-2 rounded text-sm"
        />
        <button
          onClick={createSession}
          disabled={loading || !title.trim()}
          className="w-full bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Starting...' : '🔴 Go Live Now'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Students in the selected class will see a "Live Now" banner and can join.
      </p>
    </div>
  )
}