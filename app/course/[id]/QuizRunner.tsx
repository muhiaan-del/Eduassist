'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuizRunner({ courseId }: { courseId: string }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  
  // State machine for the quiz flow
  const [viewState, setViewState] = useState<'taking' | 'scored' | 'reviewing'>('taking')
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('course_id', courseId)
        .eq('published', true) // Only published questions
      
      if (data) setQuestions(data)
      setLoading(false)
    }
    fetchQuestions()
  }, [courseId, supabase])

  function handleSelect(questionId: string, optionIndex: number) {
    if (viewState !== 'taking') return
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  function calculateScore() {
    let score = 0
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_index) {
        score++
      }
    })
    return score
  }

  async function saveAttempts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const rows = questions.map(q => ({
      student_id: user.id,
      course_id: courseId,
      question_id: q.id,
      selected_index: selectedAnswers[q.id] ?? -1,
      correct: selectedAnswers[q.id] === q.correct_index
    }))

    const { error } = await supabase.from('quiz_attempts').insert(rows)
    if (error) console.error('Failed to save attempts:', error)
  }

  function handleSubmit() {
    saveAttempts()
    setViewState('scored')
  }

  function resetQuiz() {
    setSelectedAnswers({})
    setViewState('taking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading quiz...</div>
  if (questions.length === 0) return <div className="p-8 text-center text-gray-500">No quiz questions have been generated for this course yet.</div>

  const score = calculateScore()
  const percentage = Math.round((score / questions.length) * 100)

  return (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* SCORED STATE */}
        {viewState === 'scored' && (
          <div className="bg-white border-t-4 border-blue-600 p-8 rounded-lg shadow-lg mb-8 sticky top-0 z-10">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
              <p className="text-5xl font-extrabold text-blue-600 mb-2">
                {score} / {questions.length}
              </p>
              <p className="text-xl font-medium text-gray-700">You scored {percentage}%</p>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Summary of your answers:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {questions.map((q, i) => {
                  const isCorrect = selectedAnswers[q.id] === q.correct_index;
                  return (
                    <li key={q.id} className={`flex items-center text-sm p-2 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <span className="font-bold mr-2">Q{i + 1}:</span>
                      {isCorrect ? (
                        <><span className="mr-1">✔</span> Correct</>
                      ) : (
                        <><span className="mr-1">✘</span> Incorrect</>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetQuiz}
                className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => setViewState('reviewing')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                Reveal Marking Scheme
              </button>
            </div>
          </div>
        )}

        {/* REVIEWING STATE */}
        {viewState === 'reviewing' && (
          <div className="bg-white border-l-4 border-green-600 p-6 rounded-lg shadow-sm sticky top-0 z-10 mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Marking Scheme Unveiled</h2>
              <p className="text-gray-600">Your Score: {score} / {questions.length} ({percentage}%)</p>
            </div>
            <button
              onClick={resetQuiz}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 font-medium text-sm"
            >
              Retake Quiz
            </button>
          </div>
        )}

        {/* QUESTIONS LIST */}
        {questions.map((q, index) => {
          const selectedIndex = selectedAnswers[q.id];
          const isReviewing = viewState === 'reviewing';
          const isTaking = viewState === 'taking';
          const isScored = viewState === 'scored';
          
          return (
            <div key={q.id} className={`bg-white p-6 rounded-lg shadow-sm border ${isScored ? 'opacity-50' : ''}`}>
              <h3 className="font-semibold text-lg mb-4 text-gray-800">{index + 1}. {q.question}</h3>
              
              <div className="space-y-2">
                {q.options.map((opt: string, i: number) => {
                  const isThisSelected = selectedIndex === i;
                  const isThisCorrect = i === q.correct_index;
                  
                  let btnClass = "w-full text-left p-3 rounded border transition-all duration-200 ";
                  let inlineStyle = {};

                  if (isTaking) {
                    if (isThisSelected) {
                      btnClass += "border-blue-500 shadow-sm ring-1 ring-blue-500";
                      inlineStyle = { backgroundColor: '#eff6ff', color: '#1e3a8a' };
                    } else {
                      btnClass += "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
                    }
                  } else if (isScored) {
                    if (isThisSelected) {
                      btnClass += "border-blue-300 bg-blue-50 text-blue-800";
                    } else {
                      btnClass += "border-gray-200 bg-white text-gray-400";
                    }
                  } else if (isReviewing) {
                    if (isThisCorrect) {
                      btnClass += "border-green-500 shadow-sm";
                      inlineStyle = { backgroundColor: '#f0fdf4', color: '#14532d', fontWeight: '500' };
                    } else if (isThisSelected && !isThisCorrect) {
                      btnClass += "border-red-500";
                      inlineStyle = { backgroundColor: '#fef2f2', color: '#7f1d1d' };
                    } else {
                      btnClass += "border-gray-200 opacity-50 bg-white text-gray-500";
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(q.id, i)}
                      disabled={!isTaking}
                      className={btnClass}
                      style={inlineStyle}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </span>
                        {isReviewing && isThisCorrect && <span className="text-green-600 text-sm font-bold ml-2">Correct Answer</span>}
                        {isReviewing && isThisSelected && !isThisCorrect && <span className="text-red-600 text-sm font-bold ml-2">Your Answer</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {isReviewing && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-lg text-sm text-gray-700">
                  <p className="mb-1">
                    <strong>Correct Answer:</strong> {String.fromCharCode(65 + q.correct_index)}. {q.options[q.correct_index]}
                  </p>
                  <p className={selectedIndex === q.correct_index ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {selectedIndex === q.correct_index 
                      ? "✔ You got this right!" 
                      : `✘ You selected: ${selectedIndex !== undefined ? String.fromCharCode(65 + selectedIndex) : 'Nothing'}`}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {/* SUBMIT BUTTON */}
        {viewState === 'taking' && (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length !== questions.length}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            Submit Quiz
          </button>
        )}

      </div>
    </div>
  )
}