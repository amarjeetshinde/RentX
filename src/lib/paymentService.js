/**
 * paymentService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Secure Razorpay payment processing and signature verification service for RentX.
 *
 * Rules:
 *  1. Never expose Razorpay secret keys in frontend code.
 *  2. Payment order creation and signature verification occur server-side.
 *  3. Payment amount is calculated from authoritative database records.
 *  4. Both test mode and live production mode are supported.
 */

import { supabase } from './supabaseClient'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * Dynamically load the official Razorpay Checkout SDK.
 */
export function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.warn('[PaymentService] Failed to load external Razorpay SDK script.')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Helper to build headers with authenticated Supabase JWT
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  } catch (err) {
    console.warn('[PaymentService] Could not attach auth token:', err)
  }
  return headers
}

/**
 * Create a Razorpay Order on the secure server endpoint.
 * The server looks up the booking row, fetches authoritative total_amount,
 * and calls Razorpay API to generate the order ID.
 */
export async function createServerPaymentOrder(bookingId) {
  if (!bookingId) throw new Error('Booking ID is required to create a payment order.')

  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ bookingId }),
  })

  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Server failed to create Razorpay payment order.')
  }

  return result.order // contains { id, amount, currency, bookingId, keyId }
}

/**
 * Verify Razorpay payment signature on the server and update database.
 */
export async function verifyServerPayment({
  bookingId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  paymentMethod = 'razorpay',
}) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/payments/verify-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    }),
  })

  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Server payment verification failed.')
  }

  return result
}

/**
 * Test Mode Simulation:
 * Executes a simulated payment flow with full server-side signature validation
 * and database recording, ensuring the payment lifecycle can be tested completely
 * in development even before live merchant KYC is finalized.
 */
export async function processTestModePayment({ bookingId, shouldSucceed = true, paymentMethod = 'upi' }) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/api/payments/test-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bookingId,
      shouldSucceed,
      paymentMethod,
    }),
  })

  const result = await response.json()
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Test payment processing failed.')
  }

  return result
}

/**
 * Fetch payment records for a booking from Supabase.
 */
export async function getBookingPayments(bookingId) {
  if (!bookingId) return []

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[PaymentService] Error fetching payments:', error)
    return []
  }

  return data || []
}
