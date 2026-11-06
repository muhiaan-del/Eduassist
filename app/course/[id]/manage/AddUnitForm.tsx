'use client'
import { useState } from 'react'

export default function AddUnitForm({ courseId }: { courseId: string }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const res = await fetch('/api/add-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, name, code })
    })

    const data = await res.json()
    
    if (res.ok) {
      setName('')
      setCode('')
      setMsg('Unit added successfully!')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setMsg(`Error: ${data.error}`)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3">Add a New Unit</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          required
          type="text"
          placeholder="Unit Name (e.g. Data Structures)"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2 rounded w-full text-black text-sm"
        />
        <input
          required
          type="text"
          placeholder="Code (e.g. CSC201)"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="border p-2 rounded w-full sm:w-1/3 text-black uppercase text-sm"
          maxLength={10}
        />
        <button 
          type="submit" 
          disabled={loading || !name || !code}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
        >
          {loading ? 'Adding...' : 'Add Unit'}
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
    </form>
  )
}