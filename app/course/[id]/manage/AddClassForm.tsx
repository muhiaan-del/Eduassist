'use client'
import { useState } from 'react'

export default function AddClassForm({ unitId }: { unitId: string }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const res = await fetch('/api/add-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId, name })
    })

    const data = await res.json()
    
    if (res.ok) {
      setMsg(`Class created! Code: ${data.code}`)
      setName('')
      setTimeout(() => window.location.reload(), 2000)
    } else {
      setMsg(`Error: ${data.error}`)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <input
        required
        type="text"
        placeholder="Class Name (e.g. Sem 1 - Group A)"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border p-2 rounded w-full text-black text-sm"
      />
      <button 
        type="submit" 
        disabled={loading || !name}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
      >
        {loading ? 'Creating...' : 'Create Class'}
      </button>
      {msg && <p className="text-xs text-blue-700 font-bold mt-1">{msg}</p>}
    </form>
  )
}