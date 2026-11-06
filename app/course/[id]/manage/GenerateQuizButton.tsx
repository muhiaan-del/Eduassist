'use client'
import { useState } from 'react'

type Props = {
  courseId: string
  hasMaterials: boolean
  onSuccess: () => void
}

export default function GenerateQuizButton({ courseId, hasMaterials, onSuccess }: Props) {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setMsg('Generating quiz... (10-20 seconds)')

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, topic })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz')

      setMsg(`✅ ${data.count} questions generated! Reloading...`)

      setTimeout(() => {
        window.location.reload()
      }, 800)

    } catch (err: any) {
      setMsg(`❌ ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={generate} className="space-y-3">
      <input
        required
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Topic (e.g. Recursion)"
        className="w-full border p-2 rounded text-sm"
        disabled={!hasMaterials || loading}
      />
      <button
        type="submit"
        disabled={!hasMaterials || loading || !topic.trim()}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 font-medium w-full text-sm"
      >
        {loading ? 'Generating...' : 'Generate 5 Quiz Questions'}
      </button>
      {msg && (
        <p className={`mt-2 text-sm ${msg.includes('Error') || msg.includes('❌') ? 'text-red-600' : 'text-green-600 font-medium'}`}>
          {msg}
        </p>
      )}
    </form>
  )
}