import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../context/AuthContext'
import {
  Package,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  ShoppingBag,
} from 'lucide-react'

export default function SignUpPage() {
  const { signUp, user, role } = useAuth()
  const navigate = useNavigate()

  // Form inputs
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState('customer') // 'customer' or 'owner'

  // UI states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      navigate(getDashboardPath(role), { replace: true })
    }
  }, [user, role, navigate])

  const validateForm = () => {
    const errors = {}

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.'
    }

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
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
      const data = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        accountType,
      })

      // If Supabase returned an active session immediately (confirm email disabled)
      if (data?.session) {
        navigate('/dashboard/customer', { replace: true })
      } else {
        // Confirmation email was sent
        setSignupSuccess(true)
      }
    } catch (err) {
      console.error('[Signup Error]', err)
      const msg = err.message || ''
      if (msg.includes('User already registered')) {
        setErrorMessage('An account with this email already exists. Try signing in.')
      } else if (msg.includes('Password should be')) {
        setErrorMessage('Password is too weak. Please use at least 6 characters.')
      } else {
        setErrorMessage(msg || 'An error occurred during account registration. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Confirmation email screen
  if (signupSuccess) {
    return (
      <div className="section-container py-16 flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="w-full max-w-md card p-8 text-center border-sky-100 bg-sky-50/30">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Check Your Email</h2>
          <p className="text-slate-600 text-sm mb-6">
            We have sent a verification link to <span className="font-semibold text-slate-800">{email}</span>.
            Please click the link in your email to activate your RentX account.
          </p>
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 mb-6 text-left">
            <p className="font-semibold text-slate-700 mb-1">Security note:</p>
            <p>
              Your account is created with verified customer permissions. If you requested an Equipment Owner account, our team will review and enable listing capabilities upon confirmation.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-primary w-full justify-center text-sm py-2.5"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-12 sm:py-16 flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-lg">
        {/* Card Container */}
        <div className="card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
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
            <h1 className="text-2xl font-bold text-navy-900">Create Your Account</h1>
            <p className="text-slate-500 text-sm mt-1">
              Join RentX to rent or list equipment across colleges and labs.
            </p>
          </div>

          {/* Account Type Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  accountType === 'customer'
                    ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className={accountType === 'customer' ? 'text-sky-600' : 'text-slate-500'} />
                  <span className="font-semibold text-sm text-navy-900">Customer</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  I want to rent equipment for projects, study, or events.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  accountType === 'owner'
                    ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className={accountType === 'owner' ? 'text-sky-600' : 'text-slate-500'} />
                  <span className="font-semibold text-sm text-navy-900">Equipment Owner</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  I want to list gear and earn rental income.
                </p>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>
                All new accounts receive customer access. Owner listings are activated via admin verification.
              </span>
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
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: null }))
                  }}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.fullName
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                  disabled={loading}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="signup-email"
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signup-password"
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
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }))
                  }}
                  placeholder="Create a strong password"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }))
                  }}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
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
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
