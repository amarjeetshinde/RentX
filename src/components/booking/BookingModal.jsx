import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBookingRequest } from '../../lib/bookingService'
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Info,
} from 'lucide-react'

export default function BookingModal({ isOpen, onClose, equipment, user }) {
  const navigate = useNavigate()

  // Helper: Format a Date object to YYYY-MM-DD in local time
  const formatLocalDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Today in local timezone
  const todayStr = useMemo(() => {
    return formatLocalDate(new Date())
  }, [])

  // Default dates: start tomorrow, end 3 days later
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return formatLocalDate(d)
  }, [])

  const defaultEndStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 4)
    return formatLocalDate(d)
  }, [])

  const [startDate, setStartDate] = useState(tomorrowStr)
  const [endDate, setEndDate] = useState(defaultEndStr)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successBooking, setSuccessBooking] = useState(null)

  // Min return date: startDate + 1 day in local time
  const minEndDate = useMemo(() => {
    if (!startDate) return ''
    const [y, m, d] = startDate.split('-').map(Number)
    const next = new Date(y, m - 1, d + 1)
    return formatLocalDate(next)
  }, [startDate])

  // Calculations
  const calculations = useMemo(() => {
    if (!startDate || !endDate) {
      return { days: 0, rentalTotal: 0, deposit: 0, grandTotal: 0, isValid: false }
    }

    const [sy, sm, sd] = startDate.split('-').map(Number)
    const [ey, em, ed] = endDate.split('-').map(Number)
    const startUtc = Date.UTC(sy, sm - 1, sd)
    const endUtc = Date.UTC(ey, em - 1, ed)
    const diffTime = endUtc - startUtc
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24))

    const dailyPrice = parseFloat(equipment?.daily_price || 0)
    const deposit = parseFloat(equipment?.security_deposit || 0)

    if (days <= 0) {
      return { days: 0, rentalTotal: 0, deposit, grandTotal: deposit, isValid: false }
    }

    const rentalTotal = days * dailyPrice
    const grandTotal = rentalTotal + deposit

    return {
      days,
      dailyPrice,
      rentalTotal,
      deposit,
      grandTotal,
      isValid: true,
    }
  }, [startDate, endDate, equipment])

  if (!isOpen) return null

  const handleStartDateChange = (e) => {
    const newStart = e.target.value
    setStartDate(newStart)
    if (newStart >= endDate) {
      const [y, m, d] = newStart.split('-').map(Number)
      const nextDay = new Date(y, m - 1, d + 1)
      setEndDate(formatLocalDate(nextDay))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!user) {
      navigate('/login')
      return
    }

    if (!calculations.isValid || calculations.days < 1) {
      setErrorMsg('Return date must be at least 1 day after pickup date.')
      return
    }

    setSubmitting(true)

    try {
      const result = await createBookingRequest({
        equipmentId: equipment.id,
        startDate,
        endDate,
        notes,
      })

      setSuccessBooking(result)
    } catch (err) {
      console.error('[BookingModal] Booking failed:', err)
      const msg = err.message || ''
      if (msg.includes('already reserved')) {
        setErrorMsg('This equipment is already reserved for part or all of the selected dates. Please choose different dates.')
      } else if (msg.includes('owners cannot book')) {
        setErrorMsg('You cannot book your own equipment listing.')
      } else {
        setErrorMsg(msg || 'Failed to submit booking request. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="card max-w-lg w-full p-6 sm:p-8 animate-fade-up bg-white my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {successBooking ? (
          /* ── SUCCESS VIEW ── */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-1">
              Booking Request Submitted!
            </h3>
            <p className="text-slate-600 text-xs mb-6 max-w-sm mx-auto">
              Your request for <strong>{equipment.name}</strong> has been sent to the equipment owner. You will be notified once they confirm.
            </p>

            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2 mb-6 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Rental Period:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(startDate).toLocaleDateString()} &rarr; {new Date(endDate).toLocaleDateString()} ({calculations.days} {calculations.days === 1 ? 'day' : 'days'})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Due at Pickup:</span>
                <span className="font-bold text-navy-900">
                  ₹{calculations.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                <span>Payment Status:</span>
                <span className="badge bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  Unpaid (Pay at Pickup)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose()
                  navigate('/dashboard/customer')
                }}
                className="btn-primary flex-1 justify-center text-xs py-2.5"
              >
                View in My Bookings
              </button>
              <button
                onClick={onClose}
                className="btn-secondary flex-1 justify-center text-xs py-2.5"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ── BOOKING FORM VIEW ── */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 overflow-hidden flex items-center justify-center shrink-0">
                {equipment.image_url ? (
                  <img
                    src={equipment.image_url}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Calendar className="text-sky-500" size={24} />
                )}
              </div>
              <div>
                <span className="badge badge-sky text-[10px] uppercase tracking-wider mb-1">
                  Reserve Equipment
                </span>
                <h2 className="text-lg font-bold text-navy-900 leading-tight">
                  {equipment.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Daily Rate: <strong className="text-navy-900">₹{parseFloat(equipment.daily_price || 0).toLocaleString('en-IN')}/day</strong>
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={handleStartDateChange}
                      required
                      className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Return Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={minEndDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note to Equipment Owner <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain your project, pickup time preference, or campus meetup point..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
              </div>

              {/* Price Breakdown Calculation Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-semibold text-navy-900">
                    {calculations.days} {calculations.days === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Rental Subtotal ({calculations.days}d &times; ₹{calculations.dailyPrice?.toLocaleString('en-IN')}):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{calculations.rentalTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{calculations.deposit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-navy-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-sky-600">
                    ₹{calculations.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Unpaid / Cash on Handover Notice */}
              <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100 text-[11px] text-sky-800 flex items-start gap-2">
                <Info size={15} className="shrink-0 mt-0.5 text-sky-600" />
                <div>
                  <span className="font-semibold">Zero Upfront Charge: </span>
                  This request is placed in <strong>Unpaid</strong> status. Payment and deposit are settled directly upon equipment inspection and handover.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !calculations.isValid}
                  className="btn-primary text-xs py-2 px-5 font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting Request...' : 'Confirm & Request Booking'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
