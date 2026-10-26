import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

/**
 * NotFoundPage — shown when a route doesn't exist.
 * Provides clear navigation back to home.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error graphic */}
        <div className="text-8xl font-extrabold text-slate-100 select-none mb-2">
          404
        </div>
        <div className="text-6xl mb-6">🔍</div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h1>
        <p className="text-slate-500 mb-8">
          Oops! We couldn't find what you were looking for. The page may have
          been moved, deleted, or the URL might be wrong.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            id="not-found-home-btn"
            className="btn-primary"
          >
            <Home size={16} />
            Go Home
          </Link>
          <button
            id="not-found-back-btn"
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
