import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getCustomerBookings, updateBookingStatus } from '../../lib/bookingService'
import PaymentModal from '../../components/payment/PaymentModal'
import ReviewModal from '../../components/reviews/ReviewModal'
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Calendar,
  ExternalLink,
  MapPin,
  X,
  CreditCard,
  Star,
  Lock,
} from 'lucide-react'

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Customer'

  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  // Payment & Review Modals State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null)

  const loadBookings = useCallback(async () => {
    if (!user?.id) return
    setLoadingBookings(true)
    setActionError(null)

    try {
      const data = await getCustomerBookings(user.id)
      setBookings(data)
    } catch (err) {
      console.error('[CustomerDashboard] Error fetching bookings:', err)
      setActionError(err.message || 'Unable to load your bookings.')
    } finally {
      setLoadingBookings(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Are you sure you want to cancel your booking request for "${booking.equipment?.name || 'this item'}"?`)) {
      return
    }

    setCancellingId(booking.id)
    setActionError(null)
    setActionSuccess(null)

    try {
      await updateBookingStatus(booking.id, 'cancelled')
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
      )
      setActionSuccess('Booking request was cancelled successfully.')
    } catch (err) {
      console.error('[CustomerDashboard] Cancel error:', err)
      setActionError(err.message || 'Failed to cancel booking.')
    } finally {
      setCancellingId(null)
    }
  }

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'all') return true
    return b.status === filterStatus
  })

  // Dynamic Metrics
  const activeCount = bookings.filter((b) => b.status === 'active').length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const completedCount = bookings.filter((b) => b.status === 'completed').length

  return (
    <div className="section-container py-10">
      {/* ── Header Banner ── */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-navy-900 to-navy-800 text-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3">
              <ShieldCheck size={14} />
              <span>Verified Customer Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {displayName}!
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Find, rent, and manage equipment for your projects and college needs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadBookings}
              disabled={loadingBookings}
              className="btn-secondary text-white border-white/20 hover:bg-white/10 text-xs py-2 px-3"
              title="Refresh bookings"
            >
              <RefreshCw size={14} className={loadingBookings ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/equipment"
              className="btn-primary text-xs py-2 px-4 shadow-md"
            >
              <Search size={15} />
              <span>Browse Equipment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            &times;
          </button>
        </div>
      )}

      {/* ── Dynamic Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border-sky-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-navy-900 mt-2">{activeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Currently checked out in possession</p>
        </div>

        <div className="card p-6 border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-navy-900 mt-2">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting owner review</p>
        </div>

        <div className="card p-6 border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Completed Rentals</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-navy-900 mt-2">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Returned and completed</p>
        </div>
      </div>

      {/* ── My Equipment Bookings Section ── */}
      <div className="card p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Calendar size={18} className="text-sky-500" />
              My Bookings & Rental History
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Track requests, view rental durations, and verify pickup amounts.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs overflow-x-auto no-scrollbar">
            {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md font-semibold capitalize whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loadingBookings ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
            Loading your bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-navy-900 text-base mb-1">
              {filterStatus === 'all'
                ? 'No bookings yet'
                : `No bookings matching "${filterStatus}" status`}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
              Browse equipment on RentX to reserve cameras, laptops, or electronics for your project.
            </p>
            <Link
              to="/equipment"
              className="btn-primary text-xs py-2 px-4 inline-flex"
            >
              <Search size={14} />
              <span>Explore Equipment Catalog</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Rental Dates</th>
                  <th className="py-3 px-4">Financials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const equip = b.equipment
                  const owner = b.owner
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Equipment Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {equip?.image_url ? (
                              <img
                                src={equip.image_url}
                                alt={equip?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/equipment/${b.equipment_id}`}
                              className="font-bold text-navy-900 hover:text-sky-600 transition-colors flex items-center gap-1 text-sm"
                            >
                              <span>{equip?.name || 'Equipment Item'}</span>
                              <ExternalLink size={12} className="text-slate-400" />
                            </Link>
                            <div className="text-xs text-slate-500 capitalize mt-0.5">
                              {equip?.category} {equip?.brand && `• ${equip.brand}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {owner?.full_name || 'Owner'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} />
                          <span>{equip?.location || owner?.city || 'Campus Pickup'}</span>
                        </div>
                      </td>

                      {/* Rental Dates */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 text-xs">
                          {new Date(b.start_date).toLocaleDateString()} &rarr; {new Date(b.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Duration: <strong className="text-navy-900">{b.total_days} {b.total_days === 1 ? 'day' : 'days'}</strong>
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy-900 text-xs">
                          ₹{parseFloat(b.total_amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          (₹{parseFloat(b.rental_amount).toLocaleString('en-IN')} rent + ₹{parseFloat(b.deposit_amount).toLocaleString('en-IN')} dep)
                        </div>
                        <div className="mt-1">
                          {b.payment_status === 'paid' ? (
                            <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-semibold flex items-center gap-1 w-fit">
                              <CheckCircle2 size={10} /> Paid & Verified
                            </span>
                          ) : (
                            <span className="badge bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200 block w-fit">
                              Unpaid (Razorpay / Pickup)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`badge text-[11px] ${
                            b.status === 'confirmed'
                              ? 'bg-sky-100 text-sky-800'
                              : b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : b.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : b.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status === 'confirmed' && <CheckCircle2 size={11} />}
                          {b.status === 'active' && <Package size={11} />}
                          {b.status === 'completed' && <CheckCircle2 size={11} />}
                          {b.status === 'pending' && <Clock size={11} />}
                          {b.status === 'rejected' && <XCircle size={11} />}
                          {b.status === 'cancelled' && <X size={11} />}
                          <span className="capitalize">{b.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Pay Now Button (if not paid and not cancelled/rejected) */}
                          {b.payment_status !== 'paid' && b.status !== 'cancelled' && b.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setSelectedBookingForPayment(b)
                                setPaymentModalOpen(true)
                              }}
                              className="btn-primary text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                              title="Pay securely via Razorpay"
                            >
                              <CreditCard size={11} />
                              <span>Pay Online</span>
                            </button>
                          )}

                          {/* Leave Review Button (if completed) */}
                          {b.status === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedBookingForReview(b)
                                setReviewModalOpen(true)
                              }}
                              className="btn-secondary text-[11px] py-1 px-2.5 text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1"
                              title="Rate and review this equipment"
                            >
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              <span>Review</span>
                            </button>
                          )}

                          {/* Cancel Request Button (if pending) */}
                          {b.status === 'pending' && (
                            <button
                              disabled={cancellingId === b.id}
                              onClick={() => handleCancelBooking(b)}
                              className="btn-secondary text-[11px] py-1 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Cancel pending booking request"
                            >
                              {cancellingId === b.id ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Profile & Help Guides ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
            <User size={18} className="text-sky-500" />
            Customer Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 text-xs block">Full Name</span>
              <span className="font-semibold text-slate-800">
                {profile?.full_name || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Email Address</span>
              <span className="font-semibold text-slate-800 break-all">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Assigned Role</span>
              <span className="badge badge-sky capitalize mt-1">
                {profile?.role || 'customer'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-navy-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-sky-500" />
            Rental Pickup & Return Guide
          </h2>
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              &bull; <strong>Inspection at Pickup:</strong> Always inspect cameras, laptops, or electronics with the owner before handing over payment and deposit.
            </p>
            <p>
              &bull; <strong>Deposit Return:</strong> Your refundable deposit is returned immediately upon safe equipment return and inspection.
            </p>
            <p>
              &bull; <strong>Need Support?</strong> If an owner does not respond to your pending request within 24 hours, you can cancel it at any time above without penalty.
            </p>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false)
          setSelectedBookingForPayment(null)
        }}
        booking={selectedBookingForPayment}
        user={user}
        onSuccess={() => {
          loadBookings()
          setActionSuccess('Payment verified successfully!')
        }}
      />

      {/* ── Review Modal ── */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false)
          setSelectedBookingForReview(null)
        }}
        booking={selectedBookingForReview}
        onSuccess={() => {
          loadBookings()
          setActionSuccess('Review submitted successfully!')
        }}
      />
    </div>
  )
}
