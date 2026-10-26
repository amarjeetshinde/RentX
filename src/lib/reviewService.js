/**
 * reviewService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Equipment reviews, verified customer ratings, and rating aggregates.
 */

import { supabase } from './supabaseClient'

/**
 * Fetch all verified reviews for an equipment item.
 */
export async function getEquipmentReviews(equipmentId) {
  if (!equipmentId) return []

  let { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customer:customer_id (
        full_name,
        avatar_url,
        city
      )
    `)
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[ReviewService] Joined reviews error, falling back:', error.message)
    const fallback = await supabase
      .from('reviews')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })

    if (fallback.error) return []
    data = fallback.data
  }

  return data || []
}

/**
 * Check if the customer has already submitted a review for a specific booking.
 */
export async function getBookingReview(bookingId) {
  if (!bookingId) return null

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) {
    console.warn('[ReviewService] Booking review check error:', error.message)
    return null
  }

  return data
}

/**
 * Submit a customer review via the secure stored procedure `submit_equipment_review`.
 * Enforces: rating in 1..5, caller is customer, booking status is 'completed'.
 */
export async function submitReview({ bookingId, rating, comment }) {
  if (!bookingId || !rating) {
    throw new Error('Booking ID and a rating between 1 and 5 stars are required.')
  }

  const { data, error } = await supabase.rpc('submit_equipment_review', {
    p_booking_id: bookingId,
    p_rating: parseInt(rating, 10),
    p_comment: comment?.trim() || null,
  })

  if (error) {
    console.error('[ReviewService] RPC error:', error)
    throw error
  }

  return data
}
