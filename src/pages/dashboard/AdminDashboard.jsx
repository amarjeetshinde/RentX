import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { getAllBookingsAdmin } from '../../lib/bookingService'
import { getAllDepositsAdmin, adminSettleDeposit } from '../../lib/depositService'
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Boxes,
  Clock,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  DollarSign,
  Edit3,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('equipment') // 'equipment' | 'users'

  // Profiles State
  const [profiles, setProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // Equipment Approvals State
  const [equipmentList, setEquipmentList] = useState([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)
  const [equipmentFilter, setEquipmentFilter] = useState('pending') // 'pending' | 'all' | 'approved' | 'rejected'
  const [actioningId, setActioningId] = useState(null)

  // Bookings Audit State
  const [bookingsList, setBookingsList] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Security Deposits State
  const [depositsList, setDepositsList] = useState([])
  const [loadingDeposits, setLoadingDeposits] = useState(false)
  const [settlingDeposit, setSettlingDeposit] = useState(null)
  const [deductionAmount, setDeductionAmount] = useState('0')
  const [deductionReason, setDeductionReason] = useState('')
  const [depositStatusToSet, setDepositStatusToSet] = useState('refunded')
  const [isSettling, setIsSettling] = useState(false)

  // Notifications
  const [actionMessage, setActionMessage] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  /**
   * Load Profiles (RLS Policy C allows admins to view all profiles)
   */
  const loadAllProfiles = useCallback(async () => {
    setLoadingProfiles(true)
    setErrorMsg(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error('[Admin] Error loading profiles:', err)
      setErrorMsg(err.message || 'Failed to load user profiles.')
    } finally {
      setLoadingProfiles(false)
    }
  }, [])

  /**
   * Load All Equipment (RLS Policy 3 allows admins to view all equipment)
   */
  const loadAllEquipment = useCallback(async () => {
    setLoadingEquipment(true)
    setErrorMsg(null)
    try {
      // 1. Try standard embedded join via owner_id foreign key
      let result = await supabase
        .from('equipment')
        .select(`
          *,
          profiles!owner_id (
            full_name,
            avatar_url,
            phone,
            city
          )
        `)
        .order('created_at', { ascending: false })

      // 2. If the join fails due to PostgREST relationship cache, fallback to simple select
      if (result.error) {
        console.warn('[Admin] Embedded join query error, falling back to direct query:', result.error.message)
        result = await supabase
          .from('equipment')
          .select('*')
          .order('created_at', { ascending: false })
      }

      if (result.error) throw result.error
      setEquipmentList(result.data || [])
    } catch (err) {
      console.error('[Admin] Error loading equipment:', err)
      setErrorMsg(err.message || 'Failed to load equipment list.')
    } finally {
      setLoadingEquipment(false)
    }
  }, [])

  /**
   * Load Platform Bookings (RLS Policy A allows admins to view all bookings)
   */
  const loadAllBookings = useCallback(async () => {
    setLoadingBookings(true)
    try {
      const data = await getAllBookingsAdmin()
      setBookingsList(data || [])
    } catch (err) {
      console.warn('[Admin] Note: bookings query:', err.message)
    } finally {
      setLoadingBookings(false)
    }
  }, [])

  /**
   * Load Security Deposits (Admin only)
   */
  const loadAllDeposits = useCallback(async () => {
    setLoadingDeposits(true)
    try {
      const data = await getAllDepositsAdmin()
      setDepositsList(data || [])
    } catch (err) {
      console.warn('[Admin] Deposits query:', err.message)
    } finally {
      setLoadingDeposits(false)
    }
  }, [])

  useEffect(() => {
    loadAllEquipment()
    loadAllProfiles()
    loadAllBookings()
    loadAllDeposits()
  }, [loadAllEquipment, loadAllProfiles, loadAllBookings, loadAllDeposits])

  const handleSettleDepositSubmit = async (e) => {
    e.preventDefault()
    if (!settlingDeposit) return
    setIsSettling(true)
    setErrorMsg(null)
    setActionMessage(null)

    try {
      await adminSettleDeposit({
        depositId: settlingDeposit.id,
        deductionAmount: parseFloat(deductionAmount || 0),
        deductionReason,
        newStatus: depositStatusToSet,
      })

      setActionMessage('Security deposit successfully settled.')
      setSettlingDeposit(null)
      await loadAllDeposits()
    } catch (err) {
      console.error('[Admin] Deposit settle error:', err)
      setErrorMsg(err.message || 'Failed to settle security deposit.')
    } finally {
      setIsSettling(false)
    }
  }

  /**
   * Assign User Role via admin RPC
   */
  const handleRoleChange = async (targetUserId, newRole) => {
    setUpdatingId(targetUserId)
    setActionMessage(null)
    setErrorMsg(null)

    try {
      const { error } = await supabase.rpc('admin_set_user_role', {
        target_user_id: targetUserId,
        new_role: newRole,
      })

      if (error) throw error

      setActionMessage(`Role updated to "${newRole}".`)
      await loadAllProfiles()
    } catch (err) {
      console.error('[Admin] Role change error:', err)
      setErrorMsg(err.message || 'Failed to update user role.')
    } finally {
      setUpdatingId(null)
    }
  }

  /**
   * Review Equipment Approval Status (calls admin_set_equipment_approval RPC or updates equipment)
   */
  const handleReviewEquipment = async (equipmentId, newStatus) => {
    setActioningId(equipmentId)
    setActionMessage(null)
    setErrorMsg(null)

    try {
      // First try the dedicated admin RPC
      const { error: rpcError } = await supabase.rpc('admin_set_equipment_approval', {
        target_equipment_id: equipmentId,
        new_status: newStatus,
      })

      // If RPC is unavailable, fallback to direct update allowed by Policy 6
      if (rpcError) {
        console.warn('[Admin RPC fallback] Updating directly via Policy 6:', rpcError.message)
        const { error: updateError } = await supabase
          .from('equipment')
          .update({ approval_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', equipmentId)

        if (updateError) throw updateError
      }

      setEquipmentList((prev) =>
        prev.map((e) => (e.id === equipmentId ? { ...e, approval_status: newStatus } : e))
      )
      setActionMessage(`Listing status successfully updated to "${newStatus}".`)
    } catch (err) {
      console.error('[Admin] Equipment review error:', err)
      setErrorMsg(err.message || 'Failed to update equipment approval status.')
    } finally {
      setActioningId(null)
    }
  }

  /**
   * Delete Equipment as Admin
   */
  const handleDeleteEquipment = async (item) => {
    if (!window.confirm(`Admin Action: Permanently delete "${item.name}"?`)) return

    setActioningId(item.id)
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', item.id)
      if (error) throw error

      setEquipmentList((prev) => prev.filter((e) => e.id !== item.id))
      setActionMessage(`"${item.name}" was permanently removed by administrator.`)
    } catch (err) {
      console.error('[Admin Delete Error]', err)
      setErrorMsg(err.message || 'Failed to delete equipment.')
    } finally {
      setActioningId(null)
    }
  }

  // Filtered Equipment List
  const filteredEquipment = equipmentList.filter((e) => {
    if (equipmentFilter === 'all') return true
    return e.approval_status === equipmentFilter
  })

  // Metrics
  const pendingEquipmentCount = equipmentList.filter((e) => e.approval_status === 'pending').length
  const approvedEquipmentCount = equipmentList.filter((e) => e.approval_status === 'approved').length

  return (
    <div className="section-container py-10">
      {/* ── Header Banner ── */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 text-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert size={14} className="text-rose-400" />
              <span>Privileged Administrator Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              System Administration
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Active Admin: <strong className="text-white">{profile?.full_name || user?.email}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                loadAllEquipment()
                loadAllProfiles()
                loadAllBookings()
                loadAllDeposits()
              }}
              disabled={loadingEquipment || loadingProfiles || loadingBookings || loadingDeposits}
              className="btn-secondary text-white border-white/20 hover:bg-white/10 text-xs py-2 px-3"
            >
              <RefreshCw size={14} className={loadingEquipment || loadingProfiles || loadingBookings || loadingDeposits ? 'animate-spin' : ''} />
              <span>Refresh All</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Overview Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock size={16} />
            Pending Approvals
          </div>
          <p className="text-2xl font-bold text-navy-900">{pendingEquipmentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting listing review</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <Boxes size={16} />
            Live Equipment
          </div>
          <p className="text-2xl font-bold text-navy-900">{approvedEquipmentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Approved & searchable</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users size={16} />
            Platform Users
          </div>
          <p className="text-2xl font-bold text-navy-900">{profiles.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total registered accounts</p>
        </div>

        <div className="card p-5 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 size={16} />
            Database RLS
          </div>
          <p className="text-2xl font-bold text-navy-900">Enforced</p>
          <p className="text-xs text-slate-500 mt-1">Equip + Profiles secured</p>
        </div>
      </div>

      {/* ── Notifications ── */}
      {actionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'equipment'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <Boxes size={15} />
          <span>Equipment Approvals ({pendingEquipmentCount} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <Users size={15} />
          <span>User Profiles & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'bookings'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <Calendar size={15} />
          <span>Platform Bookings ({bookingsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'deposits'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Security Deposits & Escrow ({depositsList.length})</span>
        </button>
      </div>

      {/* ── TAB 1: Equipment Approvals Queue ── */}
      {activeTab === 'equipment' && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Boxes size={18} className="text-sky-500" />
                Equipment Review Queue
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Review submitted listings and approve them for public customer browsing.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs">
              <button
                onClick={() => setEquipmentFilter('pending')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  equipmentFilter === 'pending'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Pending ({pendingEquipmentCount})
              </button>
              <button
                onClick={() => setEquipmentFilter('approved')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  equipmentFilter === 'approved'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Approved ({approvedEquipmentCount})
              </button>
              <button
                onClick={() => setEquipmentFilter('rejected')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  equipmentFilter === 'rejected'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setEquipmentFilter('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  equipmentFilter === 'all'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                All ({equipmentList.length})
              </button>
            </div>
          </div>

          {loadingEquipment ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
              Loading equipment list...
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm border border-dashed rounded-xl p-6">
              <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 mb-1">
                No equipment listings currently in &ldquo;{equipmentFilter}&rdquo; status.
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Total equipment registered across all statuses: {equipmentList.length} ({pendingEquipmentCount} Pending, {approvedEquipmentCount} Approved)
              </p>
              {equipmentFilter !== 'all' && (
                <button
                  onClick={() => setEquipmentFilter('all')}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View All Listings ({equipmentList.length})
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Equipment</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Pricing</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Equipment Item */}
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
                              className="font-bold text-navy-900 hover:text-sky-600 transition-colors flex items-center gap-1 text-sm"
                            >
                              <span>{item.name}</span>
                              <ExternalLink size={12} className="text-slate-400" />
                            </Link>
                            <div className="text-xs text-slate-500 capitalize mt-0.5">
                              {item.category} {item.brand && `• ${item.brand}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {item.profiles?.full_name || profiles.find((p) => p.id === item.owner_id)?.full_name || 'Owner'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} />
                          <span>{item.location}</span>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy-900 text-xs">
                          ₹{parseFloat(item.daily_price).toLocaleString('en-IN')}/day
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{parseFloat(item.security_deposit || 0).toLocaleString('en-IN')} dep.
                        </div>
                      </td>

                      {/* Status Badge */}
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
                          {item.approval_status === 'approved' && <CheckCircle2 size={11} />}
                          {item.approval_status === 'rejected' && <XCircle size={11} />}
                          {item.approval_status === 'pending' && <Clock size={11} />}
                          <span className="capitalize">{item.approval_status}</span>
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.approval_status !== 'approved' && (
                            <button
                              disabled={actioningId === item.id}
                              onClick={() => handleReviewEquipment(item.id, 'approved')}
                              className="btn-primary text-[11px] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                              title="Approve Equipment Listing"
                            >
                              <ThumbsUp size={12} />
                              <span>Approve</span>
                            </button>
                          )}

                          {item.approval_status !== 'rejected' && (
                            <button
                              disabled={actioningId === item.id}
                              onClick={() => handleReviewEquipment(item.id, 'rejected')}
                              className="btn-secondary text-[11px] py-1.5 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Reject Equipment Listing"
                            >
                              <ThumbsDown size={12} />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            disabled={actioningId === item.id}
                            onClick={() => handleDeleteEquipment(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete equipment listing"
                          >
                            <Trash2 size={14} />
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

      {/* ── TAB 2: User Profiles Table ── */}
      {activeTab === 'users' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Users size={18} className="text-sky-500" />
              Platform User Profiles
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Assigned database roles enforce access across RentX.
            </p>
          </div>

          {loadingProfiles ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
              Loading profiles...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">UUID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Member Since</th>
                    <th className="py-3 px-4 text-right">Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => {
                    const isCurrentUser = p.id === user?.id
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-navy-900">
                            {p.full_name || 'Unnamed User'}
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{p.phone || p.city || 'No contact'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          {p.id.slice(0, 8)}...{p.id.slice(-4)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`badge ${
                              p.role === 'admin'
                                ? 'bg-rose-100 text-rose-800'
                                : p.role === 'owner'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'badge-sky'
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            disabled={updatingId === p.id}
                            value={p.role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                          >
                            <option value="customer">Customer</option>
                            <option value="owner">Equipment Owner</option>
                            <option value="admin">Admin</option>
                          </select>
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

      {/* ── TAB 3: Platform Bookings Audit ── */}
      {activeTab === 'bookings' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Calendar size={18} className="text-sky-500" />
              Platform Rental Bookings Audit
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Live audit record of equipment reservations across all platform customers and owners.
            </p>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
              Loading platform bookings...
            </div>
          ) : bookingsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border border-dashed rounded-xl">
              No bookings have been placed on the platform yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Equipment</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Dates & Duration</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookingsList.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-navy-900 text-xs">
                        <Link to={`/equipment/${b.equipment_id}`} className="hover:text-sky-600">
                          {b.equipment?.name || b.equipment_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {b.customer?.full_name || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {b.owner?.full_name || 'Owner'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {new Date(b.start_date).toLocaleDateString()} &rarr; {new Date(b.end_date).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400">({b.total_days}d)</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900 text-xs">
                        ₹{parseFloat(b.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`badge text-[11px] capitalize ${
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
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 text-right">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Security Deposits & Deductions ── */}
      {activeTab === 'deposits' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-sky-500" />
              Security Deposits & Escrow Management
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Review deposit balances, authorize returns, and record damage deductions with mandatory reasons.
            </p>
          </div>

          {loadingDeposits ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-500 mb-2" />
              Loading deposits...
            </div>
          ) : depositsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border border-dashed rounded-xl">
              No security deposits recorded yet. Deposits are initialized automatically upon successful rental payment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Equipment</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Deposit Held</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Admin Settle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {depositsList.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-navy-900 text-xs">
                        <Link to={`/equipment/${d.equipment_id}`} className="hover:text-sky-600">
                          {d.equipment?.name || d.equipment_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {d.customer?.full_name || 'Customer'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {d.owner?.full_name || 'Owner'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy-900 text-xs">
                        ₹{parseFloat(d.deposit_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {parseFloat(d.deduction_amount) > 0 ? (
                          <div>
                            <span className="font-semibold text-rose-600">
                              -₹{parseFloat(d.deduction_amount).toLocaleString('en-IN')}
                            </span>
                            {d.deduction_reason && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate" title={d.deduction_reason}>
                                {d.deduction_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`badge text-[11px] ${
                            d.status === 'held'
                              ? 'bg-amber-100 text-amber-800'
                              : d.status === 'refunded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'partially_deducted'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSettlingDeposit(d)
                            setDeductionAmount(String(d.deduction_amount || 0))
                            setDeductionReason(d.deduction_reason || '')
                            setDepositStatusToSet(d.status === 'held' ? 'refunded' : d.status)
                          }}
                          className="btn-secondary text-[11px] py-1.5 px-2.5 text-sky-700 border-sky-200 hover:bg-sky-50 inline-flex items-center gap-1"
                        >
                          <Edit3 size={11} />
                          <span>Review / Settle</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Settle Deposit Modal ── */}
      {settlingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-md w-full p-6 animate-fade-up bg-white my-8 relative">
            <button
              onClick={() => setSettlingDeposit(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Settle Security Deposit
                </h3>
                <p className="text-xs text-slate-500">
                  Total Held: <strong className="text-navy-900">₹{parseFloat(settlingDeposit.deposit_amount).toLocaleString('en-IN')}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSettleDepositSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Settlement Status:
                </label>
                <select
                  value={depositStatusToSet}
                  onChange={(e) => setDepositStatusToSet(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="refunded">Full Refund (No Damage)</option>
                  <option value="partially_deducted">Partial Deduction (Damage/Fee)</option>
                  <option value="forfeited">Full Forfeit (Severe Damage/Loss)</option>
                  <option value="held">Keep in Escrow (Under Investigation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deduction Amount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  max={settlingDeposit.deposit_amount}
                  step="0.01"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Deduction / Settlement Notes:
                </label>
                <textarea
                  rows={2}
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="Explain damage claim, repair invoice, or note that equipment returned in pristine condition..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required={parseFloat(deductionAmount || 0) > 0}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSettlingDeposit(null)}
                  disabled={isSettling}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {isSettling ? 'Saving...' : 'Authorize Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
