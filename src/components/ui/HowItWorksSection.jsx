import { Link } from 'react-router-dom'
import {
  Search,
  CalendarCheck,
  Star,
  Package,
  Upload,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react'

const RENTER_STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Search & Discover',
    description:
      'Browse thousands of listed items by category, location, or keyword. Filter by price and availability.',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Book Your Dates',
    description:
      'Select rental dates, confirm the price, and send a booking request to the equipment owner.',
  },
  {
    step: '03',
    icon: Package,
    title: 'Pick Up & Use',
    description:
      'Meet the owner or arrange delivery. Use the equipment and return it safely on the agreed date.',
  },
  {
    step: '04',
    icon: Star,
    title: 'Review & Rate',
    description:
      'Leave an honest review to help the community. Great renters get priority bookings in future.',
  },
]

const OWNER_STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'List Your Gear',
    description: 'Add your equipment with photos, a description, and set your daily rental price.',
  },
  {
    step: '02',
    icon: BadgeCheck,
    title: 'Get Verified',
    description:
      'Complete our quick owner verification to build trust and unlock more bookings.',
  },
  {
    step: '03',
    icon: CalendarCheck,
    title: 'Accept Bookings',
    description: 'Review rental requests, approve the ones you like and coordinate handover.',
  },
  {
    step: '04',
    icon: Star,
    title: 'Earn & Grow',
    description:
      'Receive payments, collect 5-star reviews and grow your rental side income effortlessly.',
  },
]

function Step({ step, icon: Icon, title, description }) {
  return (
    <li className="flex gap-4 group">
      {/* Step number + connector */}
      <div className="flex flex-col items-center">
        <div
          className="
            flex items-center justify-center w-11 h-11 rounded-xl shrink-0
            bg-sky-500 text-white shadow-lg shadow-sky-200
            group-hover:scale-110 transition-transform duration-200
          "
        >
          <Icon size={20} />
        </div>
        {/* Vertical connector (not on last item) */}
        <div className="flex-1 w-px bg-slate-200 mt-3 mb-0 last:hidden" />
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="text-xs font-bold text-sky-500 mb-0.5">Step {step}</div>
        <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>
    </li>
  )
}

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works-section"
      className="py-20 bg-slate-50"
      aria-labelledby="how-it-works-heading"
    >
      <div className="section-container">
        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 mb-3">
            How RentX Works
          </span>
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3"
          >
            Simple. Fast. Reliable.
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Whether you want to rent gear or earn from your unused equipment —
            we make it incredibly easy for both sides.
          </p>
        </div>

        {/* ── Two-column steps ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* For Renters */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-8 rounded-full bg-sky-500" />
              <h3 className="font-bold text-lg text-slate-900">For Renters</h3>
            </div>
            <ol className="flex flex-col" aria-label="Steps to rent equipment">
              {RENTER_STEPS.map((step, i) => (
                <Step key={step.step} {...step} index={i} />
              ))}
            </ol>
          </div>

          {/* For Owners */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-8 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-lg text-slate-900">For Equipment Owners</h3>
            </div>
            <ol className="flex flex-col" aria-label="Steps to list equipment">
              {OWNER_STEPS.map((step, i) => (
                <Step key={step.step} {...step} index={i} />
              ))}
            </ol>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center mt-12">
          <Link
            to="/signup"
            id="how-it-works-cta"
            className="btn-primary inline-flex"
          >
            Get Started for Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
