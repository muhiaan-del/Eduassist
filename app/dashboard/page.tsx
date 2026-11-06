import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Safety Check: Fetch profile and handle errors
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-2">Profile Error</h2>
          <p className="text-gray-600 mb-4">
            We could not find a profile for <strong>{user.email}</strong>.
          </p>
          <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mb-6">
            {profileError?.message || 'No profile row exists for this user.'}
          </p>
          <form action="/auth/signout" method="post">
            <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Log out</button>
          </form>
        </div>
      </div>
    )
  }

  const role = profile.role || 'student'
  const fullName = profile.full_name || user.email

  // ==========================================
  // ADMIN VIEW
  // ==========================================
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <nav className="bg-blue-900 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight">EduAssist</h1>
              <span className="text-xs px-2 py-1 rounded uppercase tracking-wider font-bold bg-red-800 text-red-200">
                Admin Workspace
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-blue-200 hidden sm:block">{fullName}</span>
              <form action="/auth/signout" method="post">
                <button className="text-sm font-medium bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">Log out</button>
              </form>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-8 py-10">
          <div className="bg-white p-10 rounded-xl shadow-sm border text-center max-w-2xl mx-auto mt-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome, Administrator</h2>
            <p className="text-gray-600 mb-8 text-lg">
              You are logged in as the institution admin.
            </p>
            <Link 
              href="/dashboard/institution" 
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Open Admin Panel
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ==========================================
  // FACULTY & STUDENT LOGIC
  // ==========================================
  let facultyClasses: any[] = []
  let studentClasses: any[] = []

  if (role === 'faculty') {
    const { data: assignedClasses } = await supabase
      .from('classes')
      .select(`
        id, name, class_code,
        units!inner(
          id, name, unit_code,
          courses!inner(id, title)
        )
      `)
      .eq('lecturer_id', user.id)
      .order('name')

    if (assignedClasses) {
      facultyClasses = await Promise.all(assignedClasses.map(async (cls: any) => {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', cls.id)

        let students: any[] = []
        if (enrollments && enrollments.length > 0) {
          for (const e of enrollments) {
            const { data: studentProfile } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', e.student_id)
              .single()
            
            if (studentProfile) students.push(studentProfile)
          }
        }
        
        return {
          ...cls,
          students
        }
      }))
    }
  }

  if (role === 'student') {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', user.id)

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id)
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          id, name, 
          units!inner(
            id, name, unit_code,
            courses!inner(id, title)
          )
        `)
        .in('id', classIds)
      
      studentClasses = classesData || []
    }
  }

  // ==========================================
  // FACULTY & STUDENT RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">EduAssist</h1>
            <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider font-bold ${
              role === 'faculty' ? 'bg-blue-800 text-blue-200' : 'bg-purple-800 text-purple-200'
            }`}>
              {role} Workspace
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-blue-200 hidden sm:block">{fullName}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">Log out</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {role === 'faculty' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900">My Teaching Portal</h2>
            </div>
            {facultyClasses.length > 0 ? (
              <div className="space-y-6">
                {facultyClasses.map((cls) => (
                  <div key={cls.id} className="bg-white border rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4 gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cls.units.courses.title}</span>
                        <h3 className="text-xl font-bold text-gray-900">{cls.units.name} ({cls.units.unit_code})</h3>
                        <p className="text-sm text-gray-600 mt-1">Class Group: <strong>{cls.name}</strong></p>
                      </div>
                      <Link href={`/course/${cls.units.courses.id}/manage`} className="bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm">
                        Manage Materials & Quizzes
                      </Link>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Enrolled Students ({cls.students.length})</h4>
                      {cls.students.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {cls.students.map((student: any) => (
                            <li key={student.id} className="bg-gray-50 p-2.5 rounded border text-sm text-gray-800">
                              {student.full_name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No students admitted yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border rounded-xl p-10 text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Classes Assigned</h3>
              </div>
            )}
          </div>
        )}

        {role === 'student' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900">My Classes</h2>
            </div>
            {studentClasses.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {studentClasses.map((cls: any) => (
                  <li key={cls.id} className="bg-white border-t-4 border-purple-600 rounded-xl p-6 shadow-sm flex flex-col">
                    <span className="font-bold text-gray-900 text-xl block mb-1">{cls.units.name}</span>
                    <span className="text-sm text-gray-500 mb-4">{cls.units.courses.title}</span>
                    <Link href={`/course/${cls.units.courses.id}`} className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 w-full text-center mt-auto">
                      Enter Classroom
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-white border rounded-xl p-10 text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Classes Yet</h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}