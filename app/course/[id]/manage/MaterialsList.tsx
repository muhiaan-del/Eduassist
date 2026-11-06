'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MaterialsList({ courseId, unitId, onRefresh }: { courseId: string, unitId: string, onRefresh?: () => void }) {
  const [materials, setMaterials] = useState<any[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
    setMaterials(data || [])
  }

  useEffect(() => { load() }, [courseId, unitId])

  async function deleteMaterial(id: string) {
    if (!confirm('Delete this material? This cannot be undone.')) return
    setDeleting(id)

    const res = await fetch('/api/materials/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId: id })
    })

    if (res.ok) {
      setMaterials(prev => prev.filter(m => m.id !== id))
      if (onRefresh) onRefresh()
    } else {
      const data = await res.json()
      alert(`Failed to delete: ${data.error}`)
    }
    setDeleting(null)
  }

  return (
    <ul className="mb-4 space-y-2">
      {materials.map((m: any) => (
        <li key={m.id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 flex items-center gap-2">
          <span>📄</span>
          <span className="flex-1">{m.title}</span>
          <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
          <button
            onClick={() => deleteMaterial(m.id)}
            disabled={deleting === m.id}
            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50 font-bold"
            title="Delete material"
          >
            {deleting === m.id ? '...' : '×'}
          </button>
        </li>
      ))}
      {materials.length === 0 && (
        <li className="text-sm text-gray-500 italic">No materials uploaded yet.</li>
      )}
    </ul>
  )
}