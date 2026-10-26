import { Link } from 'react-router-dom'
import { ArrowRight, Package } from 'lucide-react'

export default function CTASection() {
  return (
    <section
      id="cta-section"
      className="py-20 bg-white"
      aria-labelledby="cta-heading"
    >
      <div className="section-container">
        <div
          className="
            relative overflow-hidden rounded-3xl
            bg-gradient-to-br from-navy-900 via-slate-800 to-sky-900
            p-10 md:p-16 text-center
          "
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Package size={28} className="text-sky-400" />
            </div>
          </div>

          <h2
            id="cta-heading"
            className="text-3xl sm:text-4xl font-extrabold text-white mb-4"
          >
            Ready to Rent Smarter?
          </h2>
          <p className="text-slate-300 max-w-lg mx-auto mb-8 text-lg">
            Join thousands of students and creators who save money renting
            instead of buying. Sign up today — it's completely free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              id="cta-signup-btn"
              className="btn-primary bg-sky-500 hover:bg-sky-400 py-3 px-8 text-base"
            >
              Create Free Account
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/equipment"
              id="cta-browse-btn"
              className="
                inline-flex items-center gap-2
                px-8 py-3 rounded-xl text-base font-semibold
                text-white border border-white/20
                hover:bg-white/10 transition-all duration-200
              "
            >
              Browse Equipment
            </Link>
          </div>

          <p className="text-slate-500 text-xs mt-6">
            No credit card required · Free for students and individuals
          </p>
        </div>
      </div>
    </section>
  )
}
