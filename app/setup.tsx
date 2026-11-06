'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()

  // Institution State
  const [institutionName, setInstitutionName] = useState('')
  const [domain, setDomain] = useState('')
  const [address, setAddress] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Admin State
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setMsg('Creating Institution...')

    const res = await fetch('/api/setup-institution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        institutionName, domain, address, contactEmail, contactPhone,
        adminName, adminEmail, adminPassword 
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setMsg(`❌ ${data.error}`)
      setLoading(false)
      return
    }

    setMsg('✅ Success! Redirecting to login...')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Institution Onboarding</h1>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Step {step} of 2</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Legal Entity Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                <input required type="text" value={institutionName} onChange={e => setInstitutionName(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="e.g. Tech University" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Domain</label>
                <input required type="text" value={domain} onChange={e => setDomain(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="e.g. techuniversity.ac.ke" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="e.g. 123 Campus Road, Nairobi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input required type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="info@techuniversity.ac.ke" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input required type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="+254 700 000 000" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 mt-4">
                Continue to Admin Setup &rarr;
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Super Admin Account</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name</label>
                <input required type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (must match domain)</label>
                <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder={`admin@${domain}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full border p-2.5 rounded-md text-black" placeholder="Min 6 characters" />
              </div>
              
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">
                  &larr; Back
                </button>
                <button type="submit" disabled={loading} className="w-2/3 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Institution'}
                </button>
              </div>
            </>
          )}
        </form>

        {msg && (
          <div className={`mt-4 p-3 rounded text-sm text-center font-bold ${msg.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}