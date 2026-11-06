'use client'
import { useState, useEffect } from 'react'

export default function AnnouncementsPanel({ classes, authorId }: { classes: any[], authorId: string }) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function loadList() {
    if (!selectedClassId) return
    const res = await fetch(`/api/announcements?classId=${selectedClassId}`)
    const data = await res.json()
    setList(data.announcements || [])
  }

  useEffect(() => { loadList() }, [selectedClassId])

  async function post(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selectedClassId, authorId, title, content })
    })

    setTitle('')
    setContent('')
    await loadList()
    setLoading(false)
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-lg text-gray-800 mb-4">Class Announcements</h3>

      <div className="mb-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Class</label>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="w-full border rounded p-2 text-sm mt-1"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.unit_code})</option>
          ))}
        </select>
      </div>

      <form onSubmit={post} className="space-y-3 mb-6">
        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border p-2 rounded text-sm"
        />
        <textarea
          required
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="Announcement content..."
          className="w-full border p-2 rounded text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Announcement'}
        </button>
      </form>

      <h4 className="font-bold text-sm text-gray-700 mb-2">Previous Announcements</h4>
      <ul className="space-y-2">
        {list.map(a => (
          <li key={a.id} className="bg-gray-50 p-3 rounded border">
            <p className="font-bold text-sm text-gray-900">{a.title}</p>
            <p className="text-sm text-gray-600">{a.content}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-sm text-gray-500 italic">No announcements yet.</li>
        )}
      </ul>
    </div>
  )
}