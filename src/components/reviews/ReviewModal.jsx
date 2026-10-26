import { useState } from 'react'
import { submitReview } from '../../lib/reviewService'
import { Star, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function ReviewModal({ isOpen, onClose, booking, onSuccess }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen || !booking) return null

  const equipmentName = booking.equipment?.name || 'Equipment'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      await submitReview({
        bookingId: booking.id,
        rating,
        comment,
      })

      setSuccess(true)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('[ReviewModal] Submit error:', err)
      setErrorMsg(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="card max-w-md w-full p-6 sm:p-8 animate-fade-up bg-white my-8 relative">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-1">
              Review Submitted!
            </h3>
            <p className="text-slate-600 text-xs mb-6 max-w-sm mx-auto">
              Thank you for your feedback! Your review helps other students and researchers make informed rental decisions.
            </p>

            <button
              onClick={onClose}
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="badge badge-sky text-[10px] uppercase tracking-wider mb-1">
                Verified Customer Feedback
              </span>
              <h2 className="text-lg font-bold text-navy-900 leading-tight">
                Rate & Review Equipment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {equipmentName}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Your Overall Rating:
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg text-slate-300 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={28}
                          className={
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    )
                  })}
                  <span className="ml-2 text-xs font-bold text-navy-900">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Experience / Notes on Equipment Condition:
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the equipment condition? Did battery life, lens clarity, or specs match expectations? Meetup experience with owner..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
                />
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
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5 font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
