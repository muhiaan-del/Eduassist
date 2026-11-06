'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FlashcardView({ courseId }: { courseId: string }) {
  const [topic, setTopic] = useState('')
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [savedSets, setSavedSets] = useState<any[]>([])
  
  const supabase = createClient()

  const fetchSavedSets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('saved_flashcards')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    if (data) setSavedSets(data)
  }

  useEffect(() => {
    fetchSavedSets()
  }, [courseId])

  async function generateCards(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    const res = await fetch('/api/generate-flashcards', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ courseId, topic }) 
    })
    const data = await res.json()
    
    if (res.ok) {
      setCards(data.flashcards || [])
      setCurrentIndex(0)
      setIsFlipped(false)
      fetchSavedSets()
    } else {
      alert(data.error)
    }
    setLoading(false)
  }

  function loadSavedSet(savedCards: any[]) {
    setCards(savedCards)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-100">
      <div className="max-w-4xl mx-auto">
        
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Flashcards</h2>
        
        {/* Generate Form */}
        <form onSubmit={generateCards} className="flex gap-2 mb-8 max-w-xl mx-auto">
          <input 
            required
            type="text"
            placeholder="Topic (e.g. Data Structures)"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="flex-1 border p-3 rounded-lg shadow-sm"
          />
          <button type="submit" disabled={loading} className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 shadow-md">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {/* Card Viewer */}
        {cards.length > 0 && (
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="text-sm font-bold text-gray-500 mb-6 tracking-wide uppercase">Card {currentIndex + 1} of {cards.length}</div>
            
            <div className="w-full max-w-lg h-72 cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front */}
                <div className="absolute inset-0 bg-white border-4 border-blue-600 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center backface-hidden">
                  <p className="text-2xl font-bold text-gray-900">{cards[currentIndex].front}</p>
                  <span className="text-xs text-blue-500 font-bold mt-4">Click to flip →</span>
                </div>

                {/* Back */}
                <div className="absolute inset-0 bg-blue-600 border-4 border-blue-700 rounded-2xl shadow-xl flex items-center justify-center p-8 text-center backface-hidden rotate-y-180">
                  <p className="text-xl text-white font-medium">{cards[currentIndex].back}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button disabled={currentIndex === 0} onClick={() => { setCurrentIndex(i => i - 1); setIsFlipped(false) }} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-bold shadow-sm hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button disabled={currentIndex === cards.length - 1} onClick={() => { setCurrentIndex(i => i + 1); setIsFlipped(false) }} className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-bold shadow-sm hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {/* Saved Sets List */}
        <div className="border-t pt-8 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Your Saved Flashcard Sets</h3>
          <ul className="space-y-2">
            {savedSets.map(s => (
              <li key={s.id} className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-800">{s.topic}</span>
                  <span className="text-xs text-gray-500 block">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <button onClick={() => loadSavedSet(s.cards)} className="text-sm bg-orange-50 text-orange-600 px-4 py-1.5 rounded font-bold hover:bg-orange-100">
                  Load Deck
                </button>
              </li>
            ))}
            {savedSets.length === 0 && <p className="text-sm text-gray-500">No saved flashcards yet.</p>}
          </ul>
        </div>

      </div>
    </div>
  )
}