/**
 * depositService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Security deposit escrow management, deduction review, and refund tracking.
 */

import { supabase } from './supabaseClient'

/**
 * Fetch all security deposits across the platform for Administrators.
 */
export async function getAllDepositsAdmin() {
  let { data, error } = await supabase
    .from('security_deposits')
    .select(`
      *,
      booking:booking_id (
        id,
        status,
        start_date,
        end_date
      ),
      equipment:equipment_id (
        id,
        name,
        category,
        image_url
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
    console.warn('[DepositService] Join error, falling back:', error.message)
    const fallback = await supabase
      .from('security_deposits')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallback.error) return []
    data = fallback.data
  }

  return data || []
}

/**
 * Admin Action: Review and settle security deposit deduction or refund.
 */
export async function adminSettleDeposit({
  depositId,
  deductionAmount = 0,
  deductionReason = '',
  newStatus = 'refunded',
}) {
  if (!depositId) throw new Error('Deposit ID is required.')

  const { data, error } = await supabase.rpc('admin_review_security_deposit', {
    p_deposit_id: depositId,
    p_deduction_amount: parseFloat(deductionAmount || 0),
    p_deduction_reason: deductionReason?.trim() || null,
    p_new_status: newStatus,
  })

  if (error) {
    console.error('[DepositService] Settle deposit error:', error)
    throw error
  }

  return data
}
