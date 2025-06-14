'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/admin/dashboard')
  }

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-xl mb-4 font-bold">Login Admin</h1>
      <input className="border w-full p-2 mb-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="border w-full p-2 mb-2 rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={login} className="bg-green-600 text-white px-4 py-2 rounded">Login</button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}
