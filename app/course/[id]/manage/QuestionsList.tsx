'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import QuestionManager from './QuestionManager'
import GenerateQuizButton from './GenerateQuizButton'

export default function QuestionsList({ courseId, hasMaterials }: { courseId: string, hasMaterials: boolean }) {
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

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const drafts = questions.filter(q => !q.published)
  const published = questions.filter(q => q.published)

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="font-semibold mb-2 text-lg text-gray-800">Generate AI Quiz</h2>
        <p className="text-sm text-gray-500 mb-4">Enter a topic and the AI will generate draft questions.</p>
        <GenerateQuizButton courseId={courseId} hasMaterials={hasMaterials} onSuccess={fetchQuestions} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">Loading questions...</p>
      ) : (
        <>
          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Drafts to Review ({drafts.length})
            </h3>
            {drafts.length > 0 ? (
              <QuestionManager initialQuestions={drafts} onQuestionsChange={fetchQuestions} />
            ) : (
              <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No drafts yet.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Published Questions ({published.length})
            </h3>
            {published.length > 0 ? (
              <QuestionManager initialQuestions={published} onQuestionsChange={fetchQuestions} />
            ) : (
              <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border">No published questions yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}