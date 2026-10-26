import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { getDashboardPath } from '../lib/roleUtils'

export const AuthContext = createContext(null)

export { getDashboardPath }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  /**
   * Fetch the verified profile for a user ID from public.profiles.
   * If the profile record is being created by the on_auth_user_created trigger,
   * we retry up to 2 times with a brief delay.
   */
  const fetchProfile = useCallback(async (userId, attempts = 3) => {
    if (!userId || !isSupabaseConfigured) {
      setProfile(null)
      return null
    }

    try {
      for (let i = 0; i < attempts; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone, city, role, created_at, updated_at')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.warn(`[RentX Auth] Error fetching profile (attempt ${i + 1}):`, error.message)
        } else if (data) {
          setProfile(data)
          return data
        }

        // Wait 300ms before next attempt (helpful right after signup when trigger executes)
        if (i < attempts - 1) {
          await new Promise((res) => setTimeout(res, 300))
        }
      }

      // Fallback default profile state if profile row not found yet
      const fallback = {
        id: userId,
        full_name: '',
        role: 'customer',
      }
      setProfile(fallback)
      return fallback
    } catch (err) {
      console.error('[RentX Auth] Unexpected error fetching profile:', err)
      return null
    }
  }, [])

  /**
   * Refresh profile data manually (e.g., after editing profile).
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id, 1)
    }
    return null
  }, [user, fetchProfile])

  // Initialize session and attach auth state listener
  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('[RentX Auth] Error getting initial session:', error.message)
        }

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id)
          }
        }
      } catch (err) {
        console.error('[RentX Auth] Init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

  /**
   * User Signup
   * Handles customer and equipment owner registration.
   */
  const signUp = async ({ email, password, fullName, accountType = 'customer' }) => {
    setAuthError(null)
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env.local file.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          requested_account_type: accountType,
        },
      },
    })

    if (error) {
      setAuthError(error.message)
      throw error
    }

    if (data.user) {
      await fetchProfile(data.user.id)
    }

    return data
  }

  /**
   * User Login
   */
  const signIn = async ({ email, password }) => {
    setAuthError(null)
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your .env.local file.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthError(error.message)
      throw error
    }

    if (data.user) {
      await fetchProfile(data.user.id)
    }

    return data
  }

  /**
   * User Logout
   */
  const signOut = async () => {
    setAuthError(null)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }

  /**
   * Profile Update (safe fields only)
   */
  const updateProfile = async ({ fullName, phone, city, avatarUrl }) => {
    if (!user) throw new Error('Not authenticated')

    const updates = {
      full_name: fullName,
      phone,
      city,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    setProfile(data)
    return data
  }

  const role = profile?.role ?? null

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,
    isConfigured: isSupabaseConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
