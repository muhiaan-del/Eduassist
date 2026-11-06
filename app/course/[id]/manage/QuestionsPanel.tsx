'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ManualQuizBuilder from './ManualQuizBuilder'

export default function QuestionsPanel({ courseId }: { courseId: string }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }, [courseId, supabase])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  async function action(type: 'publish' | 'unpublish' | 'delete', questionId: string) {
    if (type === 'delete' && !confirm('Delete this question permanently?')) return

    const res = await fetch('/api/manual-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, action: type, questionId })
    })
    if (res.ok) fetchQuestions()
    else alert('Action failed')
  }

  const drafts = questions.filter(q => !q.published)
  const published = questions.filter(q => q.published)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="font-semibold mb-2 text-lg text-gray-800">Create Quiz Question</h2>
        <p className="text-sm text-gray-500 mb-4">Build a question manually and save it as a draft.</p>
        <ManualQuizBuilder courseId={courseId} onSuccess={fetchQuestions} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">Loading...</p>
      ) : (
        <>
          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Drafts ({drafts.length})</h3>
            {drafts.length > 0 ? (
              <QuestionList questions={drafts} onAction={action} />
            ) : (
              <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No drafts.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Published ({published.length})</h3>
            {published.length > 0 ? (
              <QuestionList questions={published} onAction={action} />
            ) : (
              <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No published questions.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function QuestionList({ questions, onAction }: { questions: any[], onAction: (t: any, id: string) => void }) {
  return (
    <ul className="space-y-2">
      {questions.map((q, i) => (
        <li key={q.id} className={`p-4 rounded-lg border ${q.published ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-800 flex-1 text-sm">
              {i + 1}. {q.question}
            </h4>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onAction(q.published ? 'unpublish' : 'publish', q.id)}
                className={`px-3 py-1 text-xs rounded font-bold ${
                  q.published 
                    ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {q.published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => onAction('delete', q.id)}
                className="px-3 py-1 text-xs rounded font-bold bg-red-100 text-red-600 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
          <ul className="space-y-1 mt-2">
            {q.options.map((opt: string, idx: number) => (
              <li key={idx} className={`text-sm p-1.5 rounded ${idx === q.correct_index ? 'text-green-700 font-bold bg-white border border-green-200' : 'text-gray-600'}`}>
                {String.fromCharCode(65 + idx)}. {opt} {idx === q.correct_index && '✔'}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}