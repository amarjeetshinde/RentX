import { Link } from 'react-router-dom'
import { Wrench } from 'lucide-react'

/**
 * PlaceholderPage — used for routes that aren't built yet.
 * Shows the page name and a link back to home.
 * Will be replaced with real pages in later phases.
 */
export default function PlaceholderPage({ title }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center">
            <Wrench size={30} className="text-sky-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {title ?? 'Coming Soon'}
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          This page is under construction and will be built in an upcoming phase.
        </p>
        <Link to="/" id="placeholder-home-link" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
