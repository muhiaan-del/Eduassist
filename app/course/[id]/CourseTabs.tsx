'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import StudentChat from './StudentChat'
import QuizRunner from './QuizRunner'
import NotesGenerator from './NotesGenerator'
import FlashcardView from './FlashcardView'
import StudentMessages from './StudentMessages'
import StudentAnnouncements from './StudentAnnouncements'
import StudentProgress from './StudentProgress'

type Props = {
  courseId: string
  classId: string | null
  lecturerId: string | null
  lecturerName: string
}

function LiveBanner({ courseId }: { courseId: string }) {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Get the student's enrolled classes for this course
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', user.id)
      
      const myClassIds = enrollments?.map(e => e.class_id) || []
      if (myClassIds.length === 0) return

      // 2. Check if any of those classes have a live session right now
      const { data } = await supabase
        .from('live_sessions')
        .select('*')
        .in('class_id', myClassIds)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (isMounted) setSession(data)
    }

    check()
    const interval = setInterval(check, 10000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [courseId])

  if (!session) return null

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex justify-between items-center mb-2 rounded-t-lg shadow-sm">
      <div>
        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded mr-3">🔴 LIVE NOW</span>
        <span className="font-bold text-lg">{session.title}</span>
      </div>
      <a
        href={`/live/${session.room_name}?role=student`}
        target="_blank"
        className="bg-white text-red-600 px-4 py-1.5 rounded font-bold text-sm hover:bg-gray-100"
      >
        Join Audio
      </a>
    </div>
  )
}

export default function CourseTabs({ courseId, classId, lecturerId, lecturerName }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'notes' | 'flashcards' | 'messages' | 'announcements' | 'progress'>('chat')

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={null}>
        <LiveBanner courseId={courseId} />
      </Suspense>
      <div className="flex border-b bg-gray-100 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'chat' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Ask AI
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'notes' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Study Notes
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'flashcards' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'quiz' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Practice Quiz
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'progress' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          My Progress
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'messages' ? 'bg-white text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'announcements' ? 'bg-white text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          Announcements
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <StudentChat courseId={courseId} />}
        {activeTab === 'notes' && <NotesGenerator courseId={courseId} />}
        {activeTab === 'flashcards' && <FlashcardView courseId={courseId} />}
        {activeTab === 'quiz' && <QuizRunner courseId={courseId} />}
        {activeTab === 'progress' && <StudentProgress courseId={courseId} />}
        {activeTab === 'messages' && (
          <StudentMessages
            classId={classId}
            lecturerId={lecturerId}
            lecturerName={lecturerName}
          />
        )}
        {activeTab === 'announcements' && (
          <StudentAnnouncements classId={classId} />
        )}
      </div>
    </div>
  )
}