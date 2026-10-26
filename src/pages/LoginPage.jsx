import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  Package,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function LoginPage() {
  const { signIn, user, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // If already logged in, redirect to their role's dashboard
  useEffect(() => {
    if (user && role) {
      const target = location.state?.from?.pathname || getDashboardPath(role)
      navigate(target, { replace: true })
    }
  }, [user, role, navigate, location.state])

  // Client-side validation
  const validateForm = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validateForm()) return

    setLoading(true)
    try {
      const data = await signIn({
        email: email.trim(),
        password,
      })

      // Successful sign in. Determine verified role directly to redirect to correct dashboard
      if (data?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        const verifiedRole = profileData?.role || 'customer'
        const target = location.state?.from?.pathname || getDashboardPath(verifiedRole)
        navigate(target, { replace: true })
      }
    } catch (err) {
      console.error('[Login Error]', err)
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Invalid email or password. Please verify your credentials and try again.')
      } else if (msg.includes('Email not confirmed')) {
        setErrorMessage('Please confirm your email address before logging in. Check your inbox.')
      } else if (msg.includes('Too many requests')) {
        setErrorMessage('Too many failed attempts. Please wait a few moments before trying again.')
      } else {
        setErrorMessage(msg || 'An unexpected error occurred during login. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section-container py-12 sm:py-16 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-bold text-2xl text-navy-900 mb-3"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500 text-white shadow-sm">
                <Package size={20} />
              </span>
              <span>
                Rent<span className="text-sky-500">X</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-navy-900">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to manage your equipment rentals and bookings.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3"
              role="alert"
            >
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }))
                  }}
                  placeholder="student@college.edu"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <span className="text-xs text-slate-400">Min. 6 characters</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }))
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center text-sm py-2.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In to Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
