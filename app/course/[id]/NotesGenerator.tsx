'use client'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'

export default function NotesGenerator({ courseId }: { courseId: string }) {
  const [topic, setTopic] = useState('')
  const [range, setRange] = useState('standard')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const supabase = createClient()
  const notesRef = useRef<HTMLDivElement>(null)

  const fetchSavedNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('saved_notes')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    if (data) setSavedNotes(data)
  }

  useEffect(() => {
    fetchSavedNotes()
  }, [courseId])

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setNotes('')

    const res = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, topic, range })
    })
    const data = await res.json()
    
    if (res.ok) {
      setNotes(data.notes)
      fetchSavedNotes()
      // Scroll to the generated notes
      setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  function viewSavedNote(content: string) {
    setNotes(content)
    // Scroll up to view the notes
    setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Study Notes</h2>

        <form onSubmit={generate} className="flex flex-col sm:flex-row gap-2 mb-8">
          <input required type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g. Recursion)" className="flex-1 border p-3 rounded-lg" />
          <select value={range} onChange={e => setRange(e.target.value)} className="border p-3 rounded-lg bg-white font-medium">
            <option value="narrow">Narrow Focus</option>
            <option value="broad">Broad Context</option>
            <option value="standard">Standard</option>
          </select>
          <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold">
            {loading ? '...' : 'Generate'}
          </button>
        </form>

        {/* The Notes Ref is attached here for scrolling */}
        <div ref={notesRef}>
          {notes && (
            <div className="bg-white p-8 rounded-xl shadow-sm border prose prose-sm max-w-none mb-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-3 border-t pt-6">Your Saved Notes</h3>
        <ul className="space-y-2">
          {savedNotes.map(n => (
            <li key={n.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-800">{n.topic}</span>
                <span className="text-xs text-gray-500 block">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <button onClick={() => viewSavedNote(n.content)} className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded font-bold hover:bg-blue-100">
                View
              </button>
            </li>
          ))}
          {savedNotes.length === 0 && <p className="text-sm text-gray-500">No saved notes yet.</p>}
        </ul>
      </div>
    </div>
  )
}