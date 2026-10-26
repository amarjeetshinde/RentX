import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../../context/AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'

/**
 * ProtectedRoute
 *
 * Props:
 *   - children: ReactNode (or rendered via Outlet)
 *   - allowedRoles: string[] (e.g. ['admin'], ['owner', 'admin'])
 *
 * Security:
 *   - Relies on the verified database profile role from AuthContext.
 *   - Redirects unauthenticated visitors to /login preserving the requested path.
 *   - Redirects unauthorized roles to their authorized dashboard or displays an access alert.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  // 1. While resolving session from Supabase, show a clean loading indicator
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Verifying your secure session...</p>
      </div>
    )
  }

  // 2. If not authenticated, redirect to /login with state.from
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. If specific roles are required, verify that the user's role is permitted
  if (allowedRoles && allowedRoles.length > 0) {
    const isAuthorized = allowedRoles.includes(role)

    if (!isAuthorized) {
      // If an admin wants to preview any dashboard, allow them
      if (role === 'admin') {
        return children
      }

      // If user lacks permission, show a polite unauthorized screen or redirect
      return (
        <div className="section-container py-16">
          <div className="max-w-lg mx-auto card p-8 text-center border-amber-200 bg-amber-50/40">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">Access Restricted</h2>
            <p className="text-slate-600 text-sm mb-6">
              This area requires <span className="font-semibold capitalize">{allowedRoles.join(' or ')}</span> privileges.
              Your current account role is <span className="font-semibold capitalize">{role || 'customer'}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={getDashboardPath(role)}
                className="btn-primary text-sm justify-center"
              >
                Go to My Dashboard
              </a>
              <a
                href="/"
                className="btn-secondary text-sm justify-center"
              >
                Return to Homepage
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  return children
}
