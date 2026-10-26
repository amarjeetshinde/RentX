import { Link } from 'react-router-dom'
import { Search, ArrowRight, ShieldCheck, Clock, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { DEMO_STATS } from '../../data/demoData'

const TRUST_BADGES = [
  { icon: ShieldCheck, text: 'Verified Equipment Owners' },
  { icon: Clock, text: 'Fast Booking · Same Day' },
  { icon: TrendingUp, text: 'Best Price Guarantee' },
]

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    // Phase 2: will navigate to /equipment?q=searchQuery
    // For now, we just log to console so we can see it works
    console.log('[DEMO] Search submitted:', searchQuery)
  }

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-white"
      aria-label="RentX hero — Find equipment to rent"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-sky-50 opacity-70 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-[360px] h-[360px] rounded-full bg-violet-50 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="section-container relative">
        {/* Two-column layout on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20 md:py-28">

          {/* ── Left: Text + CTA ── */}
          <div className="flex flex-col gap-6 animate-fade-up">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-500 pulse-glow" />
              Smart Equipment Rental for Students &amp; Creators
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-tight text-slate-900">
              Rent Any Gear,{' '}
              <span className="gradient-text">Anytime.</span>
              <br />
              Skip the Ownership.
            </h1>

            {/* Sub-headline */}
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              From professional cameras to electronics kits — discover thousands
              of items listed by verified owners near you. Affordable. Reliable.
              Simple.
            </p>

            {/* ── Search bar ── */}
            <form
              id="hero-search-form"
              onSubmit={handleSearch}
              className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-md max-w-lg"
              role="search"
              aria-label="Search equipment"
            >
              <Search size={18} className="ml-3 text-slate-400 shrink-0" />
              <input
                id="hero-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras, laptops, projectors…"
                className="flex-1 py-2 pr-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                aria-label="Equipment search query"
              />
              <button
                type="submit"
                id="hero-search-submit"
                className="btn-primary text-sm py-2 px-5 shrink-0"
              >
                Search
              </button>
            </form>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Popular:</span>
              {['DSLR Camera', 'MacBook', 'Projector', 'Arduino Kit', 'DJI Drone'].map((term) => (
                <button
                  key={term}
                  type="button"
                  id={`hero-popular-${term.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSearchQuery(term)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-600 transition-colors cursor-pointer font-medium"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-up animate-fade-up-delay-2">
              <Link
                to="/equipment"
                id="hero-browse-btn"
                className="btn-primary"
              >
                Browse Equipment
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/list-equipment"
                id="hero-list-btn"
                className="btn-secondary"
              >
                List Your Gear
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-2 animate-fade-up animate-fade-up-delay-3">
              {TRUST_BADGES.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon size={14} className="text-sky-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Hero image + floating stat cards ── */}
          <div className="relative hidden lg:flex items-center justify-center animate-fade-up animate-fade-up-delay-1">
            <div className="relative w-full max-w-lg">
              {/* Main image */}
              <img
                src="/hero-equipment.jpg"
                alt="A variety of rental equipment including cameras, laptops and projectors arranged on a desk"
                className="rounded-2xl shadow-2xl w-full object-cover"
                width={600}
                height={400}
                fetchpriority="high"
              />

              {/* Floating stat card — top left */}
              <div className="absolute -top-4 -left-6 card p-3 flex items-center gap-3 bg-white min-w-[150px] animate-fade-up">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-sky-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Active Rentals</div>
                  <div className="font-bold text-slate-900 text-sm">1,240+</div>
                </div>
              </div>

              {/* Floating stat card — bottom right */}
              <div className="absolute -bottom-4 -right-6 card p-3 flex items-center gap-3 bg-white min-w-[160px] animate-fade-up animate-fade-up-delay-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Verified Owners</div>
                  <div className="font-bold text-slate-900 text-sm">850+ owners</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-16 border-t border-slate-100 pt-10">
          {DEMO_STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 gradient-text">
                {value}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
