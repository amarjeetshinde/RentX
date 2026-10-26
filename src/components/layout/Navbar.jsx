import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, getDashboardPath } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  Package,
  LayoutDashboard,
  LogOut,
  Shield,
} from 'lucide-react'

const navLinks = [
  { label: 'Browse Equipment', to: '/equipment' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'List Equipment', to: '/list-equipment' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, role, signOut } = useAuth()

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'My Account'
  const dashboardPath = getDashboardPath(role)

  return (
    <header
      className={`
        fixed top-0 inset-x-0 z-50 bg-white
        transition-shadow duration-300
        ${scrolled ? 'shadow-md' : 'border-b border-slate-100'}
      `}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            to="/"
            id="nav-logo"
            className="flex items-center gap-2 font-bold text-xl text-navy-900 hover:opacity-80 transition-opacity"
            aria-label="RentX home"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 text-white">
              <Package size={18} />
            </span>
            <span>
              Rent<span className="text-sky-500">X</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `btn-ghost text-sm font-medium ${isActive ? 'text-sky-600 bg-sky-50' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop auth buttons ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Role Badge */}
                <span
                  className={`badge text-[11px] font-semibold capitalize ${
                    role === 'admin'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : role === 'owner'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'badge-sky'
                  }`}
                >
                  {role === 'admin' ? (
                    <Shield size={12} className="inline mr-1" />
                  ) : null}
                  {role || 'Customer'}
                </span>

                {/* Notifications Bell */}
                <NotificationBell userId={user.id} />

                {/* Dashboard Link */}
                <Link
                  to={dashboardPath}
                  id="nav-dashboard-btn"
                  className="btn-primary text-xs py-2 px-3.5"
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>

                {/* User indicator & Sign Out */}
                <div className="flex items-center pl-2 border-l border-slate-200 gap-2">
                  <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate" title={user.email}>
                    {displayName}
                  </span>
                  <button
                    onClick={handleLogout}
                    id="nav-logout-btn"
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  id="nav-login-btn"
                  className="btn-ghost text-sm"
                >
                  <LogIn size={16} />
                  Log In
                </Link>
                <Link
                  to="/signup"
                  id="nav-signup-btn"
                  className="btn-primary text-sm"
                >
                  <UserPlus size={16} />
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            id="nav-mobile-menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>
      </div>

      {/* ── Mobile menu panel ── */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 border-t border-slate-100 bg-white
          ${menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <nav className="section-container py-4 flex flex-col gap-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-sky-50 text-sky-600'
                   : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                 }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="px-3 py-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-navy-900">{displayName}</p>
                    <p className="text-slate-500 text-[11px] truncate max-w-[200px]">{user.email}</p>
                  </div>
                  <span
                    className={`badge text-[10px] capitalize ${
                      role === 'admin'
                        ? 'bg-rose-100 text-rose-800'
                        : role === 'owner'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'badge-sky'
                    }`}
                  >
                    {role || 'Customer'}
                  </span>
                </div>

                <Link
                  to={dashboardPath}
                  id="nav-mobile-dashboard"
                  className="btn-primary text-sm justify-center"
                >
                  <LayoutDashboard size={16} />
                  Go to Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  id="nav-mobile-logout"
                  className="btn-secondary text-sm justify-center text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  id="nav-mobile-login"
                  className="btn-secondary text-sm justify-center"
                >
                  <LogIn size={16} />
                  Log In
                </Link>
                <Link
                  to="/signup"
                  id="nav-mobile-signup"
                  className="btn-primary text-sm justify-center"
                >
                  <UserPlus size={16} />
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
