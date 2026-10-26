/**
 * bookingService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Data service for RentX Phase 5: Equipment Bookings and Rental Lifecycle.
 * All pricing, dates, and identity fields are validated server-side by PostgreSQL triggers.
 */

import { supabase } from './supabaseClient'

/**
 * Submit a new booking request.
 * Server trigger `validate_and_snapshot_booking` sets customer_id = auth.uid(),
 * snapshots authoritative equipment prices, calculates total_amount, and sets status = 'pending'.
 */
export async function createBookingRequest({ equipmentId, startDate, endDate, notes = '' }) {
  if (!equipmentId || !startDate || !endDate) {
    throw new Error('Please select both pickup and return dates.')
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate,
        customer_notes: notes?.trim() || null,
        // Optional client estimates; server trigger overrides with authoritative DB values
        total_days: 1,
        daily_price: 0,
        rental_amount: 0,
        deposit_amount: 0,
        total_amount: 0,
      },
    ])
    .select(`
      *,
      equipment:equipment_id (
        id,
        name,
        category,
        brand,
        image_url,
        location,
        daily_price,
        security_deposit
      )
    `)
    .single()

  if (error) {
    console.error('[BookingService] Create booking error:', error)
    throw error
  }

  return data
}

/**
 * Fetch all bookings placed by a specific customer.
 */
export async function getCustomerBookings(customerId) {
  if (!customerId) return []

  // 1. Try relational join
  let { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      equipment:equipment_id (
        id,
        name,
        category,
        brand,
        image_url,
        location
      ),
      owner:owner_id (
        full_name,
        phone,
        city,
        avatar_url
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  // 2. Direct fallback if relationship cache needs refresh
  if (error) {
    console.warn('[BookingService] Embedded customer booking join failed, falling back:', error.message)
    const fallback = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (fallback.error) throw fallback.error
    data = fallback.data
  }

  return data || []
}

/**
 * Fetch all booking requests received by an equipment owner.
 */
export async function getOwnerBookings(ownerId) {
  if (!ownerId) return []

  // 1. Try relational join
  let { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      equipment:equipment_id (
        id,
        name,
        category,
        brand,
        image_url,
        location
      ),
      customer:customer_id (
        full_name,
        phone,
        city,
        avatar_url
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  // 2. Direct fallback
  if (error) {
    console.warn('[BookingService] Embedded owner booking join failed, falling back:', error.message)
    const fallback = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (fallback.error) throw fallback.error
    data = fallback.data
  }

  return data || []
}

/**
 * Fetch all bookings across the platform for Administrators.
 */
export async function getAllBookingsAdmin() {
  let { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      equipment:equipment_id (
        id,
        name,
        category,
        brand,
        image_url,
        location
      ),
      customer:customer_id (
        full_name,
        phone
      ),
      owner:owner_id (
        full_name,
        phone
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[BookingService] Admin join failed, falling back:', error.message)
    const fallback = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallback.error) throw fallback.error
    data = fallback.data
  }

  return data || []
}

/**
 * Update the status of a booking (Accept, Reject, Handover, Return, Cancel).
 * State transitions are verified server-side by trigger `protect_booking_lifecycle`.
 */
export async function updateBookingStatus(bookingId, newStatus) {
  if (!bookingId || !newStatus) {
    throw new Error('Booking ID and new status are required.')
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    console.error('[BookingService] Status update error:', error)
    throw error
  }

  return data
}
