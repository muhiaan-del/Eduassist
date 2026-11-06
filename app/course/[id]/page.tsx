import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CourseTabs from './CourseTabs'

export default async function StudentCourseView(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const courseId = params.id
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single()
  if (!course) return <div className="p-8">Course not found</div>

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      class_id,
      classes!inner(
        id,
        name,
        lecturer_id,
        unit_id,
        units!inner(id, name, unit_code)
      )
    `)
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single()

  const enrolledClass: any = enrollment?.classes
  const enrolledUnit: any = enrolledClass?.units

  let lecturerName = 'Lecturer'
  if (enrolledClass?.lecturer_id) {
    const { data: lecturerProfile } = await supabase
      .from('profiles').select('full_name').eq('id', enrolledClass.lecturer_id).single()
    if (lecturerProfile) lecturerName = lecturerProfile.full_name
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-blue-200 hover:text-white transition-colors">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold">{course.title}</h1>
          </div>
          <span className="bg-purple-800 text-xs px-2 py-1 rounded text-purple-200 uppercase tracking-wider font-bold">
            Student Portal
          </span>
        </div>
      </nav>

      {enrolledClass && enrolledUnit && (
        <div className="bg-purple-100 border-b border-purple-200 py-3">
          <div className="max-w-4xl mx-auto px-8 flex justify-between text-sm text-purple-900 font-medium">
            <span>Unit: <strong>{enrolledUnit.name} ({enrolledUnit.unit_code})</strong></span>
            <span>Class: <strong>{enrolledClass.name}</strong></span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-[75vh]">
          <CourseTabs
            courseId={courseId}
            classId={enrolledClass?.id || null}
            lecturerId={enrolledClass?.lecturer_id || null}
            lecturerName={lecturerName}
          />
        </div>
      </main>
    </div>
  )
}