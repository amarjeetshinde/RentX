import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { deleteEquipmentImage } from '../../lib/storageService'
import { getOwnerBookings, updateBookingStatus } from '../../lib/bookingService'
import AddEquipmentModal from '../../components/equipment/AddEquipmentModal'
import EditEquipmentModal from '../../components/equipment/EditEquipmentModal'
import {
  Boxes,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  MapPin,
  ExternalLink,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  User,
  ArrowRight,
  Package,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function OwnerDashboard() {
  const { user, profile } = useAuth()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Equipment Owner'
  const isVerifiedOwner = profile?.role === 'owner' || profile?.role === 'admin'
  const isPendingOwner = !isVerifiedOwner && user?.user_metadata?.requested_account_type === 'owner'

  // Tab State
  const [activeTab, setActiveTab] = useState('bookings') // 'bookings' | 'equipment'

  // Equipment Data
  const [equipmentList, setEquipmentList] = useState([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)

  // Bookings Data
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [bookingFilter, setBookingFilter] = useState('all') // 'all' | 'pending' | 'confirmed' | 'active' | 'completed' | 'rejected'
  const [actioningBookingId, setActioningBookingId] = useState(null)

  // Notifications
  const [actionError, setActionError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  /**
   * Load Owner Equipment Listings
   */
  const loadOwnerEquipment = useCallback(async () => {
    if (!user?.id) return
    setLoadingEquipment(true)
    setActionError(null)

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEquipmentList(data || [])
    } catch (err) {
      console.error('[Owner Dashboard] Error fetching equipment:', err)
      setActionError(err.message || 'Could not load your equipment listings.')
    } finally {
      setLoadingEquipment(false)
    }
  }, [user?.id])

  /**
   * Load Bookings Received for Owner's Equipment
   */
  const loadOwnerBookings = useCallback(async () => {
    if (!user?.id) return
    setLoadingBookings(true)

    try {
      const data = await getOwnerBookings(user.id)
      setBookings(data)
    } catch (err) {
      console.error('[Owner Dashboard] Error fetching bookings:', err)
      // non-fatal if bookings table not queried
    } finally {
      setLoadingBookings(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadOwnerEquipment()
    loadOwnerBookings()
  }, [loadOwnerEquipment, loadOwnerBookings])

  /**
   * Booking Action Handler (Accept, Reject, Handover, Return)
   */
  const handleBookingAction = async (bookingId, newStatus, actionName) => {
    setActioningBookingId(bookingId)
    setActionError(null)
    setActionSuccess(null)

    try {
      await updateBookingStatus(bookingId, newStatus)
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
      setActionSuccess(`Booking request marked as "${actionName}".`)
      // Also refresh equipment availability if active
      await loadOwnerEquipment()
    } catch (err) {
      console.error('[Owner Dashboard] Booking status error:', err)
      setActionError(err.message || `Failed to update booking status to ${actionName}.`)
    } finally {
      setActioningBookingId(null)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(item.id)
    setActionError(null)
    setActionSuccess(null)

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      if (item.image_url) {
        await deleteEquipmentImage(item.image_url, user.id)
      }

      setActionSuccess(`"${item.name}" was successfully removed.`)
      setEquipmentList((prev) => prev.filter((e) => e.id !== item.id))
    } catch (err) {
      console.error('[Delete Error]', err)
      setActionError(err.message || 'Failed to delete equipment listing.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleAvailability = async (item, newStatus) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ availability_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) throw error

      setEquipmentList((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, availability_status: newStatus } : e))
      )
      setActionSuccess(`Status for "${item.name}" updated to ${newStatus}.`)
    } catch (err) {
      console.error('[Availability Toggle Error]', err)
      setActionError(err.message || 'Failed to update availability status.')
    }
  }

  // Summary Metrics
  const approvedCount = equipmentList.filter((e) => e.approval_status === 'approved').length
  const pendingEquipmentCount = equipmentList.filter((e) => e.approval_status === 'pending').length
  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length
  const activeBookingsCount = bookings.filter((b) => b.status === 'active').length

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true
    return b.status === bookingFilter
  })

  return (
    <div className="section-container py-10">
      {/* ── Header Banner ── */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-navy-900 to-navy-800 text-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-sky-500/20 text-sky-300">
              {isVerifiedOwner ? (
                <>
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Verified Equipment Owner</span>
                </>
              ) : (
                <>
                  <Clock size={14} className="text-amber-400" />
                  <span>Owner Application Under Verification</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {displayName}’s Equipment Hub
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Manage incoming rental requests, verify handovers, and track your inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadOwnerEquipment()
                loadOwnerBookings()
              }}
              disabled={loadingEquipment || loadingBookings}
              className="btn-secondary text-white border-white/20 hover:bg-white/10 text-xs py-2 px-3"
              title="Refresh inventory and bookings"
            >
              <RefreshCw size={14} className={loadingEquipment || loadingBookings ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 shadow-md"
            >
              <Plus size={15} />
              <span>Add Equipment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner if Pending */}
      {isPendingOwner && (
        <div className="card p-5 mb-8 border-amber-200 bg-amber-50/70 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1 text-sm">
            <h3 className="font-bold text-amber-950 mb-0.5">
              Owner Account Status: Verification in Progress
            </h3>
            <p className="text-amber-800 text-xs">
              Your equipment listings will be submitted in <strong>Pending</strong> status until verified by administrators. Once approved, they will instantly appear in the public catalog.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-amber-800 text-xs font-semibold uppercase tracking-wider">Booking Requests</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{pendingBookingsCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting your approval</p>
        </div>

        <div className="card p-5 border-sky-200 bg-sky-50/40">
          <div className="flex items-center justify-between">
            <span className="text-sky-800 text-xs font-semibold uppercase tracking-wider">Active Rentals</span>
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{activeBookingsCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Checked out with students</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Live Inventory</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{approvedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Approved & searchable</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Listings</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{equipmentList.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">In your equipment catalog</p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'bookings'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} />
          <span>Rental Requests & Bookings ({pendingBookingsCount} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'equipment'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <Boxes size={15} />
          <span>Equipment Inventory ({equipmentList.length})</span>
        </button>
      </div>

      {/* ── TAB 1: Rental Bookings Management ── */}
      {activeTab === 'bookings' && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Calendar size={18} className="text-sky-500" />
                Customer Rental Bookings
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Review rental dates, accept bookings, and manage equipment handover and return.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs overflow-x-auto no-scrollbar">
              {['pending', 'confirmed', 'active', 'completed', 'all'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingFilter(st)}
                  className={`px-3 py-1 rounded-md font-semibold capitalize whitespace-nowrap transition-all ${
                    bookingFilter === st
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
              Loading rental bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border border-dashed rounded-xl">
              No rental bookings currently in "{bookingFilter}" status.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Equipment</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Financials</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => {
                    const isActioning = actioningBookingId === b.id
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Equipment */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {b.equipment?.image_url ? (
                                <img
                                  src={b.equipment.image_url}
                                  alt={b.equipment?.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/equipment/${b.equipment_id}`}
                                className="font-bold text-navy-900 hover:text-sky-600 transition-colors flex items-center gap-1 text-sm"
                              >
                                <span>{b.equipment?.name || 'Equipment Item'}</span>
                                <ExternalLink size={12} className="text-slate-400" />
                              </Link>
                              <div className="text-xs text-slate-500 capitalize mt-0.5">
                                {b.equipment?.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {b.customer?.full_name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {b.customer?.phone || b.customer?.city || 'Campus student'}
                          </div>
                          {b.customer_notes && (
                            <div className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded max-w-xs">
                              &ldquo;{b.customer_notes}&rdquo;
                            </div>
                          )}
                        </td>

                        {/* Dates */}
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
                                <CheckCircle2 size={10} /> Paid via Razorpay
                              </span>
                            ) : (
                              <span className="badge bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200 block w-fit">
                                Unpaid (Collect at Handover)
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
                            <span className="capitalize">{b.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* PENDING: Accept or Reject */}
                            {b.status === 'pending' && (
                              <>
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleBookingAction(b.id, 'confirmed', 'Confirmed')}
                                  className="btn-primary text-[11px] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                                  title="Accept this booking request"
                                >
                                  <ThumbsUp size={12} />
                                  <span>Accept</span>
                                </button>
                                <button
                                  disabled={isActioning}
                                  onClick={() => handleBookingAction(b.id, 'rejected', 'Rejected')}
                                  className="btn-secondary text-[11px] py-1.5 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                                  title="Decline this booking request"
                                >
                                  <ThumbsDown size={12} />
                                  <span>Decline</span>
                                </button>
                              </>
                            )}

                            {/* CONFIRMED: Handover */}
                            {b.status === 'confirmed' && (
                              <button
                                disabled={isActioning}
                                onClick={() => handleBookingAction(b.id, 'active', 'Equipment Handed Over')}
                                className="btn-primary text-[11px] py-1.5 px-2.5 bg-sky-600 hover:bg-sky-700"
                                title="Confirm pickup and handover of equipment"
                              >
                                <Package size={12} />
                                <span>Confirm Handover</span>
                              </button>
                            )}

                            {/* ACTIVE: Return */}
                            {b.status === 'active' && (
                              <button
                                disabled={isActioning}
                                onClick={() => handleBookingAction(b.id, 'completed', 'Completed & Returned')}
                                className="btn-primary text-[11px] py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700"
                                title="Confirm safe return of equipment"
                              >
                                <CheckCircle2 size={12} />
                                <span>Confirm Return</span>
                              </button>
                            )}

                            {/* FINAL: Completed or Rejected */}
                            {(b.status === 'completed' || b.status === 'rejected' || b.status === 'cancelled') && (
                              <span className="text-xs text-slate-400">Archived</span>
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
      )}

      {/* ── TAB 2: Equipment Inventory ── */}
      {activeTab === 'equipment' && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Boxes size={18} className="text-sky-500" />
                My Equipment Listings
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Manage availability, edit specs, or remove items from the catalog.
              </p>
            </div>

            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-primary text-xs py-2 px-3.5 self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>List Another Item</span>
            </button>
          </div>

          {loadingEquipment ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
              Loading your equipment listings...
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-navy-900 text-base mb-1">
                No equipment listed yet
              </h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                Start earning by listing your cameras, laptops, lab sensors, projectors, or audio equipment for student and lab rental.
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="btn-primary text-xs py-2 px-4 inline-flex"
              >
                <Plus size={14} />
                <span>List Your First Equipment</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Daily Rate</th>
                    <th className="py-3 px-4">Deposit</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipmentList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Item with Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/equipment/${item.id}`}
                              className="font-semibold text-navy-900 hover:text-sky-600 transition-colors flex items-center gap-1.5"
                            >
                              <span>{item.name}</span>
                              <ExternalLink size={12} className="text-slate-400" />
                            </Link>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} />
                              <span>{item.location}</span>
                              {item.brand && <span>• {item.brand}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 capitalize">
                        {item.category}
                      </td>

                      {/* Daily Rate */}
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        ₹{parseFloat(item.daily_price).toLocaleString('en-IN')}
                        <span className="text-slate-400 font-normal text-xs">/d</span>
                      </td>

                      {/* Deposit */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        ₹{parseFloat(item.security_deposit || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`badge text-[11px] ${
                            item.approval_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.approval_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.approval_status === 'approved' && <CheckCircle2 size={12} />}
                          {item.approval_status === 'rejected' && <XCircle size={12} />}
                          {item.approval_status === 'pending' && <Clock size={12} />}
                          <span className="capitalize">{item.approval_status}</span>
                        </span>
                      </td>

                      {/* Availability Status Select */}
                      <td className="py-3.5 px-4">
                        <select
                          value={item.availability_status}
                          onChange={(e) => handleToggleAvailability(item, e.target.value)}
                          className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="available">Available</option>
                          <option value="rented">Rented</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedEquipment(item)
                              setEditModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Edit Equipment"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Equipment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      <AddEquipmentModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        userId={user?.id}
        onSuccess={(newItem) => {
          setEquipmentList((prev) => [newItem, ...prev])
          setActionSuccess(`"${newItem.name}" was successfully listed and is pending admin review.`)
        }}
      />

      {/* Edit Equipment Modal */}
      <EditEquipmentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedEquipment(null)
        }}
        equipment={selectedEquipment}
        userId={user?.id}
        onSuccess={(updatedItem) => {
          setEquipmentList((prev) =>
            prev.map((e) => (e.id === updatedItem.id ? updatedItem : e))
          )
          setActionSuccess(`"${updatedItem.name}" was updated successfully.`)
        }}
      />
    </div>
  )
}
