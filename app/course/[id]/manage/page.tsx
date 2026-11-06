export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UploadForm from './UploadForm'
import QuestionsPanel from './QuestionsPanel'
import MessagesPanel from './MessagesPanel'
import AnnouncementsPanel from './AnnouncementsPanel'
import MaterialsList from './MaterialsList'
import AnalyticsPanel from './AnalyticsPanel'
import LivePanel from './LivePanel'

export default async function ManageCourse(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
  if (!course) return <div className="p-8">Course not found</div>

  const { data: units } = await supabase
    .from('units')
    .select('*, classes(*)')
    .eq('course_id', id)
    .order('name')

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('course_id', id)
    .order('created_at', { ascending: false })

  let allStudents: any[] = []
  if (units && units.length > 0) {
    const classIds = units.flatMap((u: any) => u.classes?.map((c: any) => c.id) || [])
    
    if (classIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, class_id')
        .in('class_id', classIds)
      
      if (enrollments && enrollments.length > 0) {
        const studentIds = [...new Set(enrollments.map((e: any) => e.student_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
        
        allStudents = (profiles || []).map((p: any) => {
          const enrollment = enrollments.find((e: any) => e.student_id === p.id)
          return { ...p, class_id: enrollment?.class_id }
        })
      }
    }
  }

  const allClasses = units?.flatMap((u: any) => 
    u.classes?.map((c: any) => ({ 
      ...c, 
      unit_name: u.name, 
      unit_code: u.unit_code 
    })) || []
  ) || []

  const totalUnits = units?.length || 0
  const totalClasses = allClasses.length
  const totalMaterials = materials?.length || 0

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <Link 
        href="/dashboard" 
        className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{course.title}</h1>
        <p className="text-sm text-gray-600">
          Manage materials, quizzes, messaging, and announcements for your course.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Units</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalUnits}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Classes</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalClasses}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Materials Uploaded</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalMaterials}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Course Structure</h2>

          {units && units.length > 0 ? (
            <div className="space-y-4">
              {units.map((unit: any) => {
                return (
                  <div key={unit.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                    
                    <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{unit.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono font-bold mt-1 inline-block">
                          {unit.unit_code}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wide">
                        Assigned Classes
                      </h4>
                      {unit.classes && unit.classes.length > 0 ? (
                        <ul className="space-y-2">
                          {unit.classes.map((cls: any) => (
                            <li key={cls.id} className="bg-white p-3 rounded border border-blue-100 flex justify-between items-center">
                              <span className="font-medium text-gray-800">{cls.name}</span>
                              <span className="text-sm font-mono font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {cls.class_code}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-blue-700 italic">No classes assigned to you for this unit.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                        Materials for {unit.unit_code}
                      </h4>
                      <MaterialsList courseId={id} unitId={unit.id} />

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-3">
                        <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                          Upload New Material
                        </p>
                        <UploadForm courseId={id} unitId={unit.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center shadow-sm">
              <p className="text-gray-500">No units have been created for this course by the admin yet.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Assessment</h2>
          <QuestionsPanel courseId={id} />

          <div className="mt-8">
            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-4">Class Analytics</h3>
            <AnalyticsPanel courseId={id} />
          </div>

          <div className="mt-8">
            <LivePanel classes={allClasses} lecturerId={user.id} />
          </div>
        </div>

      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 mb-6">Communication</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MessagesPanel 
            courseId={id} 
            students={allStudents} 
            classes={allClasses}
          />
          <AnnouncementsPanel 
            classes={allClasses}
            authorId={user.id}
          />
        </div>
      </div>

    </div>
  )
}