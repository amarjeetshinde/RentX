/**
 * notificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time in-app notification queries and actions for RentX.
 */

import { supabase } from './supabaseClient'

/**
 * Fetch notifications for an authenticated user.
 */
export async function getUserNotifications(userId, limit = 25) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn('[NotificationService] Fetch error:', error.message)
    return []
  }

  return data || []
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('[NotificationService] Mark read error:', error)
  }
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId) {
  if (!userId) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('[NotificationService] Mark all read error:', error)
  }
}
