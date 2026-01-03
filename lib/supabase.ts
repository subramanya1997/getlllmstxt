import { createBrowserClient } from "@supabase/ssr"

// ============================================================================
// Browser Client (for client components, hooks, etc.)
// ============================================================================

// Create a browser client for client-side usage
function createCustomSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Client-side Supabase client - safe to use in hooks, components and browser
export function createClientSideSupabase() {
  return createCustomSupabaseClient()
}

// Pre-initialized browser client instance for direct imports
export const supabaseClient = createClientSideSupabase()

// ============================================================================
// Cookie Handling Patches (for client-side error suppression)
// ============================================================================

/**
 * Utility function to patch Supabase cookie handling issues on the client side
 * - Fixes "Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"..." error
 * - Fixes "Failed to parse cookie string: Error: Unexpected format: String" error
 * 
 * Call this function at app initialization (in a useEffect in your root provider)
 */
export function patchSupabaseCookieHandling() {
  if (typeof window === 'undefined') return

  console.log('Applying Supabase cookie handling patches...')

  // Patch 1: Fix base64-prefixed cookie parsing
  const origJsonParse = JSON.parse
  JSON.parse = function(text: string, reviver?: (key: string, value: unknown) => unknown) {
    if (typeof text === 'string' && text.startsWith('base64-')) {
      try {
        const base64Value = text.replace('base64-', '')
        const jsonString = atob(base64Value)
        return origJsonParse(jsonString, reviver)
      } catch (e) {
        console.warn('Base64 decode failed, returning fallback session structure', e)
        return {
          access_token: '',
          refresh_token: '',
          expires_at: 0,
          expires_in: 0,
          provider_token: null,
          provider_refresh_token: null,
          user: null
        }
      }
    }
    return origJsonParse(text, reviver)
  }

  // Patch 2: Protect localStorage.getItem
  try {
    const origGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = function(key: string) {
      try {
        return origGetItem.call(this, key)
      } catch (error) {
        console.warn(`Storage.getItem error for key ${key}:`, error)
        return null
      }
    }
  } catch (error) {
    console.error('Failed to patch Storage.getItem:', error)
  }

  // Patch 3: Add global error handler for Supabase-related errors
  window.addEventListener('error', function(event) {
    const errorMsg = event.message || ''
    
    if (
      errorMsg.includes('Failed to parse cookie string') || 
      errorMsg.includes('Unexpected token') ||
      errorMsg.includes('Unexpected format')
    ) {
      console.warn('Suppressed Supabase cookie error:', event)
      
      if (errorMsg.includes('base64-')) {
        try {
          document.cookie.split(';').forEach(function(c) {
            if (c.trim().startsWith('sb-')) {
              document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            }
          })
          console.log('Cleared problematic Supabase cookies')
        } catch (e) {
          console.error('Failed to clear cookies:', e)
        }
      }
      
      event.preventDefault()
    }
  }, true)

  console.log('Supabase cookie handling patches applied')
}
