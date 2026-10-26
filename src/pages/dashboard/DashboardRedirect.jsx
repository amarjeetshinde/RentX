import { Navigate } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirect() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading your dashboard...</p>
      </div>
    )
  }

  return <Navigate to={getDashboardPath(role)} replace />
}
