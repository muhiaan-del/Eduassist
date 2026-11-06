'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function InstitutionAdmin() {
  const supabase = createClient()
  const [institution, setInstitution] = useState<any>(null)
  const [faculty, setFaculty] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'faculty' | 'courses' | 'units' | 'classes' | 'students'>('faculty')
  const [showDangerZone, setShowDangerZone] = useState(false)

  const [msg, setMsg] = useState('')
  
  // Forms state
  const [facName, setFacName] = useState('')
  const [facUser, setFacUser] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [unitName, setUnitName] = useState('')
  const [unitCode, setUnitCode] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [className, setClassName] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedLecturer, setSelectedLecturer] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentUsername, setStudentUsername] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // Existing student mode
  const [studentMode, setStudentMode] = useState<'new' | 'existing'>('new')
  const [existingStudentId, setExistingStudentId] = useState('')

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: inst } = await supabase.from('institutions').select('*').eq('admin_id', user.id).single()
    if (!inst) { setLoading(false); return }
    setInstitution(inst)

    const { data: f } = await supabase.from('profiles').select('*').eq('institution_id', inst.id).eq('role', 'faculty').order('full_name')
    const { data: s } = await supabase.from('profiles').select('*').eq('institution_id', inst.id).eq('role', 'student').order('full_name')
    const { data: c } = await supabase.from('courses').select('*').eq('institution_id', inst.id).order('title')
    
    const courseIds = c?.map(course => course.id) || []
    let fetchedUnits: any[] = []
    if (courseIds.length > 0) {
      const { data: u } = await supabase.from('units').select('*, courses(title)').in('course_id', courseIds).order('name')
      fetchedUnits = u || []
    }
    
    const unitIds = fetchedUnits.map(unit => unit.id)
    let fetchedClasses: any[] = []
    if (unitIds.length > 0) {
      const { data: cls } = await supabase
        .from('classes')
        .select('*, units(name, unit_code, course_id)')
        .in('unit_id', unitIds)
        .order('name')
      fetchedClasses = cls || []
    }
    
    setFaculty(f || [])
    setStudents(s || [])
    setCourses(c || [])
    setUnits(fetchedUnits)
    setClasses(fetchedClasses)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [supabase])

  const handleAction = async (action: string, id: string, data: any = {}) => {
    if (action.startsWith('delete') && !confirm('Are you sure you want to delete this? This cannot be undone.')) return
    setMsg('Processing...')
    
    const res = await fetch('/api/admin/housekeeping', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id, data })
    })
    
    const resData = await res.json()
    if (res.ok) { 
      setMsg('✅ Action successful')
      loadData() 
    } else { 
      setMsg(`❌ ${resData.error}`) 
    }
  }

  // Edit Handlers
  const handleEditFaculty = (id: string, currentName: string) => {
    const newName = prompt('Enter new Faculty Name:', currentName)
    if (newName) handleAction('edit-faculty', id, { full_name: newName })
  }

  const handleEditCourse = (id: string, currentTitle: string) => {
    const newTitle = prompt('Enter new Course Title:', currentTitle)
    if (newTitle) handleAction('edit-course', id, { title: newTitle })
  }

  const handleEditUnit = (id: string, currentName: string, currentCode: string) => {
    const newName = prompt('Enter new Unit Name:', currentName)
    if (newName) {
      const newCode = prompt('Enter new Unit Code:', currentCode)
      if (newCode) handleAction('edit-unit', id, { name: newName, unit_code: newCode })
    }
  }

  const handleEditClass = (id: string, currentName: string) => {
    const newName = prompt('Enter new Class Name:', currentName)
    if (newName) handleAction('edit-class', id, { name: newName })
  }

  const handleEditStudent = (id: string, currentName: string) => {
    const newName = prompt('Enter new Student Name:', currentName)
    if (newName) handleAction('edit-student', id, { full_name: newName })
  }

  async function deleteInstitution() {
    if (!confirm('WARNING: This will delete the entire institution, all faculty, students, courses, and data. This cannot be undone. Are you absolutely sure?')) return
    if (!confirm('FINAL WARNING: Click OK to permanently delete everything.')) return

    setMsg('Deleting entire institution...')

    const res = await fetch('/api/admin/delete-institution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionId: institution.id })
    })

    const data = await res.json()
    if (res.ok) {
      alert('Institution deleted. Redirecting to setup.')
      window.location.href = '/setup'
    } else {
      setMsg(`❌ ${data.error}`)
    }
  }

  // Form Submit Handlers
  async function handleCreateFaculty(e: React.FormEvent) {
    e.preventDefault(); setMsg('Creating...')
    const res = await fetch('/api/provision-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: facUser, fullName: facName, role: 'faculty', institutionId: institution.id }) })
    const data = await res.json()
    if (res.ok) { setMsg(`✅ Created! Email: ${data.fullEmail} | Pass: ${data.password}`); setFacName(''); setFacUser(''); loadData() } 
    else setMsg(`❌ ${data.error}`)
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault(); setMsg('Creating...')
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/admin/create-course', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        title: courseTitle, 
        joinCode: courseCode,
        institutionId: institution.id, 
        adminId: user?.id 
      }) 
    })
    if (res.ok) { setMsg('✅ Course Created!'); setCourseTitle(''); setCourseCode(''); loadData() } else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault(); setMsg('Creating...')
    const res = await fetch('/api/admin/create-unit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: unitName, unitCode, courseId: selectedCourse }) })
    if (res.ok) { setMsg('✅ Unit Created!'); setUnitName(''); setUnitCode(''); loadData() } else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault(); setMsg('Creating...')
    const res = await fetch('/api/admin/create-class', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ className, unitId: selectedUnit, lecturerId: selectedLecturer }) })
    if (res.ok) { setMsg('✅ Class Created!'); setClassName(''); loadData() } else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function handleAdmitStudent(e: React.FormEvent) {
    e.preventDefault(); setMsg('Admitting new student...')
    const res = await fetch('/api/admit-student', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ username: studentUsername, fullName: studentName, classIds: selectedClasses, institutionId: institution.id }) 
    })
    const data = await res.json()
    if (res.ok) { 
      setMsg(`✅ Student Admitted! Email: ${data.fullEmail} | Pass: ${data.password}`)
      setStudentName(''); setStudentUsername(''); setSelectedClasses([])
      loadData() 
    } else setMsg(`❌ ${data.error}`)
  }

  async function handleEnrollExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!existingStudentId) return setMsg('❌ Select an existing student first.')
    setMsg('Enrolling existing student...')

    const firstClass = classes.find(c => c.id === selectedClasses[0])
    const courseId = (firstClass as any)?.units?.course_id
    if (!courseId) return setMsg('❌ Could not determine course for selected classes.')

    const res = await fetch('/api/admit-existing-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: existingStudentId, classIds: selectedClasses, courseId })
    })
    const data = await res.json()

    if (res.ok) {
      const added = data.added ?? 0
      const skipped = data.skipped ?? 0
      setMsg(
        added > 0
          ? `✅ Enrolled in ${added} new class${added > 1 ? 'es' : ''}${skipped > 0 ? ` (${skipped} skipped — already enrolled)` : ''}.`
          : `✅ ${data.message || 'Student already enrolled in all selected classes.'}`
      )
      setExistingStudentId('')
      setSelectedClasses([])
      loadData()
    } else {
      setMsg(`❌ ${data.error}`)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!institution) return <div className="p-8 text-center">Access Denied</div>

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <nav className="bg-blue-950 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{institution.name} Admin</h1>
            <span className="bg-blue-800 text-xs px-2 py-1 rounded text-blue-200 uppercase font-bold">Institution Level</span>
          </div>
          <Link href="/dashboard" className="text-sm font-medium bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-md">My Workspace</Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
          {['faculty', 'courses', 'units', 'classes', 'students'].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab as any); setMsg('') }} className={`px-6 py-3 font-medium capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}>
              {tab === 'faculty' ? 'Faculty' : tab === 'courses' ? 'Courses' : tab === 'units' ? 'Units' : tab === 'classes' ? 'Classes' : 'Admit Students'}
            </button>
          ))}
        </div>

        {/* FORMS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-10">
          {activeTab === 'faculty' && (
            <form onSubmit={handleCreateFaculty} className="flex gap-4">
              <input required type="text" placeholder="Full Name" value={facName} onChange={e => setFacName(e.target.value)} className="border p-2.5 rounded-md w-full" />
              <div className="flex rounded-md border bg-white w-full">
                <input required type="text" placeholder="username" value={facUser} onChange={e => setFacUser(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))} className="p-2.5 w-full outline-none" />
                <span className="bg-gray-100 text-gray-500 text-sm px-3 py-2.5 border-l flex items-center">@{institution.domain}</span>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-bold">Create</button>
            </form>
          )}
          {activeTab === 'courses' && (
            <form onSubmit={handleCreateCourse} className="flex gap-4">
              <input required type="text" placeholder="Course Title" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="border p-2.5 rounded-md w-full" />
              <input required type="text" placeholder="Code (e.g. CS101)" value={courseCode} onChange={e => setCourseCode(e.target.value)} maxLength={10} className="border p-2.5 rounded-md w-1/4 uppercase" />
              <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-md font-bold">Create</button>
            </form>
          )}
          {activeTab === 'units' && (
            <form onSubmit={handleCreateUnit} className="flex gap-4">
              <select required value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="border p-2.5 rounded-md w-1/3">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input required type="text" placeholder="Unit Name" value={unitName} onChange={e => setUnitName(e.target.value)} className="border p-2.5 rounded-md w-full" />
              <input required type="text" placeholder="Code (e.g. CSC101)" value={unitCode} onChange={e => setUnitCode(e.target.value)} className="border p-2.5 rounded-md w-1/4 uppercase" />
              <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-md font-bold">Create</button>
            </form>
          )}
          {activeTab === 'classes' && (
            <form onSubmit={handleCreateClass} className="flex gap-4">
              <select required value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="border p-2.5 rounded-md w-1/3">
                <option value="">Select Unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.courses?.title} — {u.name}</option>)}
              </select>
              <input required type="text" placeholder="Class Name (e.g. Sem 1)" value={className} onChange={e => setClassName(e.target.value)} className="border p-2.5 rounded-md w-full" />
              <select required value={selectedLecturer} onChange={e => setSelectedLecturer(e.target.value)} className="border p-2.5 rounded-md w-1/3">
                <option value="">Assign Faculty</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
              </select>
              <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-md font-bold">Create</button>
            </form>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                <button type="button" onClick={() => { setStudentMode('new'); setMsg('') }} className={`px-4 py-1.5 text-sm font-bold rounded-md ${studentMode === 'new' ? 'bg-white shadow text-purple-900' : 'text-gray-500'}`}>Admit New</button>
                <button type="button" onClick={() => { setStudentMode('existing'); setMsg('') }} className={`px-4 py-1.5 text-sm font-bold rounded-md ${studentMode === 'existing' ? 'bg-white shadow text-purple-900' : 'text-gray-500'}`}>Enroll Existing</button>
              </div>

              <form onSubmit={studentMode === 'new' ? handleAdmitStudent : handleEnrollExisting}>
                {studentMode === 'new' && (
                  <div className="flex gap-4 mb-4">
                    <input required type="text" placeholder="Full Name" value={studentName} onChange={e => setStudentName(e.target.value)} className="border p-2.5 rounded-md w-full" />
                    <div className="flex rounded-md border bg-white w-full">
                      <input required type="text" placeholder="username" value={studentUsername} onChange={e => setStudentUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))} className="p-2.5 w-full outline-none" />
                      <span className="bg-gray-100 text-gray-500 text-sm px-3 py-2.5 border-l flex items-center">@{institution.domain}</span>
                    </div>
                  </div>
                )}

                {studentMode === 'existing' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Student</label>
                    <select required value={existingStudentId} onChange={e => setExistingStudentId(e.target.value)} className="w-full border p-2.5 rounded-md text-black">
                      <option value="">-- Choose a student --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                    </select>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Classes (select one or more)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-md bg-gray-50">
                    {classes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-gray-800 bg-white p-2 rounded border">
                        <input type="checkbox" checked={selectedClasses.includes(c.id)} onChange={() => setSelectedClasses(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])} />
                        {c.name} ({c.class_code})
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={selectedClasses.length === 0 || (studentMode === 'existing' && !existingStudentId)} className="bg-purple-600 text-white px-6 py-2.5 rounded-md font-bold disabled:opacity-50">
                  {studentMode === 'new' ? 'Admit & Enroll' : 'Enroll Existing Student'}
                </button>
              </form>
            </div>
          )}
          {msg && <div className={`mt-4 p-3 rounded text-sm font-bold ${msg.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
        </div>

        {/* HOUSEKEEPING LISTS */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 capitalize">Manage {activeTab}</h2>
          
          {activeTab === 'faculty' && (
            <ul className="space-y-2">
              {faculty.map(f => {
                const assignedClasses = classes.filter(c => c.lecturer_id === f.id)
                return (
                  <li key={f.id} className="flex flex-col md:flex-row justify-between md:items-center bg-gray-50 p-3 rounded gap-2">
                    <div>
                      <span className="font-medium">{f.full_name}</span> 
                      <span className="text-xs text-gray-500 ml-2">({f.email})</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {assignedClasses.length > 0 ? (
                          assignedClasses.map(c => <span key={c.id} className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">{c.name}</span>)
                        ) : (
                          <span className="text-[10px] text-gray-400">No classes assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditFaculty(f.id, f.full_name)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold">Edit</button>
                      <button onClick={() => handleAction('delete-user', f.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Delete</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {activeTab === 'courses' && (
            <ul className="space-y-2">
              {courses.map(c => (
                <li key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <span className="font-medium">{c.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCourse(c.id, c.title)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold">Edit</button>
                    <button onClick={() => handleAction('delete-course', c.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'units' && (
            <ul className="space-y-2">
              {units.map(u => (
                <li key={u.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <div><span className="font-medium">{u.name}</span> <span className="text-xs text-gray-500">({u.courses?.title})</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditUnit(u.id, u.name, u.unit_code)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold">Edit</button>
                    <button onClick={() => handleAction('delete-unit', u.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'classes' && (
            <ul className="space-y-2">
              {classes.map(c => {
                const assignedLecturer = faculty.find(f => f.id === c.lecturer_id)
                return (
                  <li key={c.id} className="flex flex-col md:flex-row justify-between md:items-center bg-gray-50 p-3 rounded gap-2">
                    <div>
                      <span className="font-medium">{c.name}</span> 
                      <span className="text-xs text-gray-500 ml-1">({c.units?.name || 'No Unit'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Lecturer: {assignedLecturer?.full_name || 'Unassigned'}</span>
                      <select onChange={(e) => handleAction('edit-class', c.id, { name: c.name, lecturer_id: e.target.value })} className="text-xs border p-1 rounded">
                        <option value="">Reassign...</option>
                        {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                      </select>
                      <button onClick={() => handleEditClass(c.id, c.name)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold">Rename</button>
                      <button onClick={() => handleAction('delete-class', c.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Delete</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {activeTab === 'students' && (
            <ul className="space-y-2">
              {students.map(s => (
                <li key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <div><span className="font-medium">{s.full_name}</span> <span className="text-xs text-gray-500">({s.email})</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditStudent(s.id, s.full_name)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 font-bold">Edit</button>
                    <button onClick={() => handleAction('delete-user', s.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-20 border-t border-gray-200 pt-8 text-center">
          {!showDangerZone ? (
            <button onClick={() => setShowDangerZone(true)} className="text-sm text-gray-400 hover:text-red-500 underline">Show Danger Zone</button>
          ) : (
            <div className="border border-red-200 p-6 rounded-xl bg-red-50 text-left max-w-xl mx-auto">
              <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-600 mb-4">Once you delete an institution, there is no going back.</p>
              <button onClick={deleteInstitution} className="bg-red-600 text-white px-6 py-2.5 rounded-md font-bold hover:bg-red-700 w-full">Delete Institution & All Data</button>
              <button onClick={() => setShowDangerZone(false)} className="text-sm text-gray-500 hover:text-gray-800 w-full mt-3">Cancel</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}