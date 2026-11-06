'use client'
import { useState, useEffect } from 'react'

export default function StudentAnnouncements({ classId }: { classId: string | null }) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!classId) { setLoading(false); return }
      const res = await fetch(`/api/announcements?classId=${classId}`)
      const data = await res.json()
      setAnnouncements(data.announcements || [])
      setLoading(false)
    }
    load()
  }, [classId])

  if (!classId) return <div className="p-8 text-center text-gray-500">You're not enrolled in a class.</div>
  if (loading) return <div className="p-8 text-center text-gray-500">Loading announcements...</div>

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Class Announcements</h2>

      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500 text-center mt-10">No announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-white border rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{a.title}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}