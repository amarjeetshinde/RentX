import { Link } from 'react-router-dom'
import {
  Package,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Briefcase,
  Code,
  Camera,
} from 'lucide-react'

const footerLinks = {
  Platform: [
    { label: 'Browse Equipment', to: '/equipment' },
    { label: 'List Your Equipment', to: '/list-equipment' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
  ],
  Support: [
    { label: 'Help Center', to: '/help' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Report an Issue', to: '/report' },
    { label: 'Community Forum', to: '/forum' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookies' },
    { label: 'Refund Policy', to: '/refund' },
  ],
}

const socialLinks = [
  { icon: MessageCircle, href: '#', label: 'Twitter / X' },
  { icon: Briefcase, href: '#', label: 'LinkedIn' },
  { icon: Camera, href: '#', label: 'Instagram' },
  { icon: Code, href: '#', label: 'GitHub' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">

      {/* ── Main footer content ── */}
      <div className="section-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-white mb-4"
              aria-label="RentX home"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 text-white">
                <Package size={18} />
              </span>
              Rent<span className="text-sky-400">X</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              RentX is a smart equipment rental marketplace connecting students,
              institutions and small businesses with affordable, quality gear.
            </p>

            {/* Contact info */}
            <div className="mt-6 flex flex-col gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Mail size={14} />
                hello@rentx.in
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} />
                +91 98765 43210
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={14} />
                New Delhi, India
              </span>
            </div>

            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    flex items-center justify-center w-9 h-9 rounded-lg
                    bg-slate-800 text-slate-400
                    hover:bg-sky-500 hover:text-white
                    transition-all duration-200
                  "
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold text-sm mb-4">{section}</h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-slate-800">
        <div className="section-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} RentX. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with ❤️ for students and creators across India.
          </span>
        </div>
      </div>

    </footer>
  )
}
