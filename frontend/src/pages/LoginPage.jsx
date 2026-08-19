import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { LogIn, Mail, Lock, Eye, EyeOff, Stethoscope } from 'lucide-react'
import { loginUser } from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await loginUser(form.email, form.password)
      login(data.access_token)           // saves to localStorage + updates context
      toast.success('Welcome back!')
      navigate('/chat')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-700/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-700/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-brand-900/50 mb-4">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight">MedRAG</h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Medical Intelligence</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 relative glow-bg">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">Access your AI medical assistant</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="input-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="doctor@hospital.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          For authorised medical professionals only. All queries are logged.
        </p>
      </div>
    </div>
  )
}
