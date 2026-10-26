import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import BookingModal from '../components/booking/BookingModal'
import EquipmentReviewsList from '../components/reviews/EquipmentReviewsList'
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Share2,
  User,
  Info,
  Package,
} from 'lucide-react'

export default function EquipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchEquipmentDetails = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      let { data, error } = await supabase
        .from('equipment')
        .select(`
          id,
          owner_id,
          name,
          description,
          category,
          brand,
          daily_price,
          security_deposit,
          location,
          image_url,
          availability_status,
          approval_status,
          created_at,
          updated_at,
          profiles!owner_id (
            full_name,
            avatar_url,
            phone,
            city
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[EquipmentDetail] Join query failed, attempting direct query:', error.message)
        const fallback = await supabase
          .from('equipment')
          .select('*')
          .eq('id', id)
          .single()

        if (fallback.error) throw fallback.error
        data = fallback.data
      }

      setEquipment(data)
    } catch (err) {
      console.error('[EquipmentDetail] Error:', err)
      setErrorMsg(err.message || 'Unable to load equipment details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchEquipmentDetails()
  }, [fetchEquipmentDetails])

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="section-container py-16 text-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading equipment details...</p>
      </div>
    )
  }

  if (errorMsg || !equipment) {
    return (
      <div className="section-container py-16">
        <div className="card max-w-lg mx-auto p-8 text-center border-rose-200 bg-rose-50/30">
          <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Equipment Not Found</h2>
          <p className="text-slate-600 text-xs mb-6">
            The requested equipment listing could not be found, or is pending admin verification.
          </p>
          <Link to="/equipment" className="btn-primary text-xs justify-center">
            <ArrowLeft size={14} />
            <span>Back to Browse Equipment</span>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnerOrAdmin = user && (user.id === equipment.owner_id || profile?.role === 'admin')
  const isPendingReview = equipment.approval_status !== 'approved'

  // Block unauthorized viewing of pending listings
  if (isPendingReview && !isOwnerOrAdmin) {
    return (
      <div className="section-container py-16">
        <div className="card max-w-lg mx-auto p-8 text-center border-amber-200 bg-amber-50/40">
          <Clock size={36} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Listing Under Review</h2>
          <p className="text-slate-600 text-xs mb-6">
            This equipment listing is currently pending administrative review and verification before it is visible in the public marketplace.
          </p>
          <Link to="/equipment" className="btn-primary text-xs justify-center">
            <ArrowLeft size={14} />
            <span>Browse Available Equipment</span>
          </Link>
        </div>
      </div>
    )
  }

  const isAvailable = equipment.availability_status === 'available'
  const isApproved = equipment.approval_status === 'approved'
  const dailyPrice = parseFloat(equipment.daily_price || 0)
  const deposit = parseFloat(equipment.security_deposit || 0)
  const ownerName = equipment.profiles?.full_name || 'Verified Owner'

  return (
    <div className="section-container py-10">
      {/* ── Pending Admin Review Banner (Visible only to Lister or Admin) ── */}
      {isPendingReview && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Listing Pending Administrator Review: </span>
            This equipment has not been approved yet and is currently hidden from the public browse catalog.
            {profile?.role === 'admin' ? (
              <Link to="/dashboard/admin" className="ml-2 underline font-semibold text-amber-950">
                Go to Admin Console to Approve &rarr;
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Breadcrumb / Back ── */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/equipment"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Equipment Catalog</span>
        </Link>

        <button
          onClick={handleShare}
          className="btn-ghost text-xs py-1.5 px-3 border border-slate-200"
        >
          <Share2 size={13} />
          <span>{copied ? 'Link Copied!' : 'Share Listing'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Photos & Details (2 Cols) ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Photo Card */}
          <div className="card overflow-hidden bg-slate-900 flex items-center justify-center min-h-[340px] max-h-[500px]">
            {equipment.image_url ? (
              <img
                src={equipment.image_url}
                alt={equipment.name}
                className="w-full h-full object-contain max-h-[500px]"
              />
            ) : (
              <div className="p-16 text-center text-slate-400">
                <Package size={64} className="mx-auto mb-3 text-slate-600" />
                <p className="text-sm font-medium">No photo uploaded</p>
              </div>
            )}
          </div>

          {/* Title & Metadata Card */}
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge badge-sky capitalize text-xs">
                {equipment.category}
              </span>
              {equipment.brand && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {equipment.brand}
                </span>
              )}
              {isApproved ? (
                <span className="badge badge-available text-xs flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Verified Listing
                </span>
              ) : (
                <span className="badge bg-amber-100 text-amber-800 text-xs flex items-center gap-1">
                  <Clock size={12} />
                  Pending Admin Approval
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
              {equipment.name}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
              <MapPin size={14} className="text-sky-500 shrink-0" />
              <span>Available at: <strong>{equipment.location}</strong></span>
            </div>

            {/* Description Section */}
            <div className="pt-6 border-t border-slate-100">
              <h2 className="text-base font-bold text-navy-900 mb-3">
                Equipment Specifications & Details
              </h2>
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {equipment.description || 'No detailed specifications provided for this listing.'}
              </div>
            </div>

            {/* Rental Safeguards */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-navy-900">Damage Protection</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Security deposit is held safely in escrow and refunded after return.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-navy-900">Tested Condition</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Equipment is verified by the owner prior to student pickup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Ratings List */}
          <EquipmentReviewsList equipmentId={equipment.id} />
        </div>

        {/* ── Right Column: Pricing & Booking Card (1 Col) ── */}
        <div className="space-y-6">
          <div className="card p-6 sticky top-24 shadow-md">
            {/* Pricing Header */}
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider block">
                Daily Rate
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-navy-900">
                  ₹{dailyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-500">/ day</span>
              </div>
              {deposit > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Refundable Security Deposit: <strong>₹{deposit.toLocaleString('en-IN')}</strong>
                </p>
              )}
            </div>

            {/* Availability Indicator */}
            <div className="py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Current Availability:</span>
                {isAvailable ? (
                  <span className="badge badge-available text-xs flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Ready for Pickup
                  </span>
                ) : (
                  <span className="badge badge-unavailable text-xs flex items-center gap-1">
                    <XCircle size={12} />
                    {equipment.availability_status}
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Cost Breakdown */}
            <div className="py-4 space-y-2 text-xs text-slate-600 border-b border-slate-100">
              <div className="flex justify-between">
                <span>1-Day Rental Rate</span>
                <span>₹{dailyPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Refundable Deposit</span>
                <span>₹{deposit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-navy-900 pt-2 border-t border-slate-100">
                <span>Total Due at Pickup</span>
                <span>₹{(dailyPrice + deposit).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4">
              {user && user.id === equipment.owner_id ? (
                <div className="p-3 rounded-lg bg-slate-100 text-slate-600 text-xs text-center font-medium">
                  You own this equipment listing
                </div>
              ) : (
                <button
                  disabled={!isAvailable}
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: location } })
                    } else {
                      setBookingModalOpen(true)
                    }
                  }}
                  className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {!isAvailable
                    ? 'Currently Unavailable'
                    : user
                    ? 'Rent Now'
                    : 'Sign in to Rent Now'}
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                No upfront payment needed until owner confirms availability.
              </p>
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User size={14} className="text-sky-500" />
              Equipment Owner
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm shrink-0">
                {ownerName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-sm">{ownerName}</h4>
                <p className="text-xs text-slate-500">{equipment.location}</p>
                <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
                  <ShieldCheck size={12} />
                  <span>Verified Campus Lister</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase 5 Interactive Booking Modal ── */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        equipment={equipment}
        user={user}
      />
    </div>
  )
}
