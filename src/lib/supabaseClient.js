/**
 * supabaseClient.js
 * ─────────────────────────────────────────────────────────────────────
 * Single shared Supabase client for the entire frontend.
 *
 * SECURITY RULES (read before editing):
 * ✅  Only uses VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
 *     These are the "anon / public" credentials — safe for browser use.
 * ❌  NEVER import or use the service-role key here.
 *     The service-role key bypasses Row Level Security and must only
 *     ever exist in a secure backend / Edge Function environment.
 *
 * HOW TO CONFIGURE:
 *   1. Copy .env.local.example → .env.local  (in the project root)
 *   2. Fill in your Supabase project URL and anon key.
 *   3. Restart `npm run dev` so Vite picks up the new env vars.
 *
 * All imports across the app should use this single instance:
 *   import { supabase } from '../lib/supabaseClient'
 */

import { createClient } from '@supabase/supabase-js'

// ── Read credentials from Vite environment variables ──────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// ── Configuration guard ───────────────────────────────────────────────
// Provide a clear, actionable error if either variable is missing.
// This surfaces during development so the issue is never silently ignored.
const missingVars = []
if (!supabaseUrl)     missingVars.push('VITE_SUPABASE_URL')
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY')

if (missingVars.length > 0) {
  const msg =
    `[RentX] Missing Supabase environment variable(s): ${missingVars.join(', ')}\n\n` +
    `To fix this:\n` +
    `  1. Copy ".env.local.example" to ".env.local" in your project root.\n` +
    `  2. Open ".env.local" and fill in your Supabase project URL and anon key.\n` +
    `     You can find both at: https://supabase.com/dashboard → Project Settings → API\n` +
    `  3. Stop and restart the dev server: npm run dev\n\n` +
    `⚠️  Do NOT paste the service-role key here — use the "anon / public" key only.`
  console.error(msg)
}

// ── Client options ────────────────────────────────────────────────────
const clientOptions = {
  auth: {
    // Persist the user session across page refreshes using localStorage.
    persistSession: true,
    // Automatically refresh the JWT before it expires.
    autoRefreshToken: true,
    // Detect and handle OAuth redirects automatically.
    detectSessionInUrl: true,
  },
}

// ── Create and export the client ──────────────────────────────────────
// If credentials are missing we still export a client object so the app
// doesn't crash on import — it will fail gracefully when a query is made.
export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  clientOptions,
)

// ── Convenience: are credentials configured? ─────────────────────────
// Components can import this to show UI warnings without making a network call.
export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey)
