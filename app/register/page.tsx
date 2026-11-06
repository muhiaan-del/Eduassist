'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('Clearing old session...')

    try {
      // 1. Clear old session
      await supabase.auth.signOut()

      setMsg('Step 1: Creating user account...')
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      
      if (authError) throw new Error(`Auth Error: ${authError.message}`)
      if (!authData.user) throw new Error("No user returned. Check Supabase email settings.")

      setMsg('Step 2: Creating your institution...')
      const domain = email.split('@')[1] || null;
      
      const { data: newInst, error: instError } = await supabase
        .from('institutions')
        .insert({ 
          name: institutionName, 
          domain: domain, 
          admin_id: authData.user.id 
        })
        .select()
        .single()
      
      if (instError) throw new Error(`Institution DB Error: ${instError.message}`)

      setMsg('Step 3: Creating admin profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: authData.user.id, 
          role: 'admin', // <--- Hardcoded to admin
          full_name: fullName, 
          institution_id: newInst.id 
        })
      
      if (profileError) throw new Error(`Profile DB Error: ${profileError.message}`)

      setMsg(`✅ SUCCESS! Welcome to ${institutionName}. Redirecting...`)
      
      setTimeout(() => {
        window.location.href = '/dashboard/institution'
      }, 1500)

    } catch (error: any) {
      setMsg(`❌ FAILED: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Institution Onboarding</h2>
        
        <form onSubmit={submit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
            <input type="text" required value={institutionName} onChange={e => setInstitutionName(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="e.g. University of Nairobi" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="admin@university.ac.ke" />
            <p className="text-xs text-gray-500 mt-1">The domain will be your institution's login domain.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="Min 6 characters" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50 mt-4 transition-colors">
            {loading ? 'Processing...' : 'Register Institution'}
          </button>
        </form>

        {msg && (
          <div className={`mt-4 p-3 rounded text-sm text-center font-bold break-words ${
            msg.includes('❌') ? 'bg-red-50 text-red-600' : 
            msg.includes('✅') ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {msg}
          </div>
        )}
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered? <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in here</Link>
        </p>
      </div>
    </div>
  )
}