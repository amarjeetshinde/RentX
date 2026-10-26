import { useState, useEffect } from 'react'
import { getEquipmentReviews } from '../../lib/reviewService'
import { Star, ShieldCheck, MessageSquare, RefreshCw } from 'lucide-react'

export default function EquipmentReviewsList({ equipmentId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReviews() {
      if (!equipmentId) return
      setLoading(true)
      const data = await getEquipmentReviews(equipmentId)
      setReviews(data)
      setLoading(false)
    }

    loadReviews()
  }, [equipmentId])

  // Aggregate computations
  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null

  // Rating breakdown counts (5 down to 1)
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage:
      totalReviews > 0
        ? Math.round((reviews.filter((r) => r.rating === stars).length / totalReviews) * 100)
        : 0,
  }))

  return (
    <div className="card p-6 sm:p-8 mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <MessageSquare size={18} className="text-sky-500" />
            Verified Customer Reviews & Ratings
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Feedback from students and researchers who rented this equipment.
          </p>
        </div>

        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-base font-extrabold text-navy-900">{averageRating}</span>
            <span className="text-slate-500 text-xs">({totalReviews})</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw size={20} className="animate-spin mx-auto text-sky-500 mb-2" />
          <span>Loading verified reviews...</span>
        </div>
      ) : totalReviews === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs border border-dashed rounded-xl p-6">
          <Star size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No customer reviews yet</p>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
            Be the first customer to rent and review this verified listing on RentX!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rating Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 items-center">
            <div className="text-center sm:text-left sm:pl-2">
              <span className="text-4xl font-extrabold text-navy-900">{averageRating}</span>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={
                      Math.round(parseFloat(averageRating)) >= s
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Based on {totalReviews} completed rentals</p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              {ratingCounts.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-10 text-right">{stars} star</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Reviews List */}
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => {
              const reviewerName = rev.customer?.full_name || 'Verified Student'
              return (
                <div key={rev.id} className="pt-4 pb-4 first:pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {reviewerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900 text-xs">
                            {reviewerName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <ShieldCheck size={11} />
                            Verified Rental
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            rev.rating >= s
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-700 leading-relaxed pl-10">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
