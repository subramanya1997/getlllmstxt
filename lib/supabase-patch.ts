/**
 * Utility functions to patch Supabase cookie handling issues
 * - Fixes "Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"..." error
 * - Fixes "Failed to parse cookie string: Error: Unexpected format: String" error
 */

// Call this function at app initialization to patch Supabase cookie handling
export function patchSupabaseCookieHandling() {
  if (typeof window === 'undefined') return;

  console.log('Applying Supabase cookie handling patches...');

  // Patch 1: Fix base64-prefixed cookie parsing
  const origJsonParse = JSON.parse;
  JSON.parse = function(text: string, reviver?: (key: string, value: unknown) => unknown) {
    if (typeof text === 'string' && text.startsWith('base64-')) {
      try {
        // Option 1: Try proper decoding of base64 value
        const base64Value = text.replace('base64-', '');
        const jsonString = atob(base64Value);
        return origJsonParse(jsonString, reviver);
      } catch (e) {
        console.warn('Base64 decode failed, returning fallback session structure', e);
        // Option 2: Return a valid empty session structure to prevent format errors
        return {
          access_token: '',
          refresh_token: '',
          expires_at: 0,
          expires_in: 0,
          provider_token: null,
          provider_refresh_token: null,
          user: null
        };
      }
    }
    
    // Default case: use original parser
    return origJsonParse(text, reviver);
  };

  // Patch 2: Protect localStorage.getItem
  try {
    const origGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key: string) {
      try {
        return origGetItem.call(this, key);
      } catch (error) {
        console.warn(`Storage.getItem error for key ${key}:`, error);
        return null;
      }
    };
  } catch (error) {
    console.error('Failed to patch Storage.getItem:', error);
  }

  // Patch 3: Add global error handler for Supabase-related errors
  window.addEventListener('error', function(event) {
    const errorMsg = event.message || '';
    
    // Check if it's a Supabase cookie parsing error
    if (
      errorMsg.includes('Failed to parse cookie string') || 
      errorMsg.includes('Unexpected token') ||
      errorMsg.includes('Unexpected format')
    ) {
      console.warn('Suppressed Supabase cookie error:', event);
      
      // Clear problematic cookies
      if (errorMsg.includes('base64-')) {
        try {
          // Get domain from window location
          document.cookie.split(';').forEach(function(c) {
            if (c.trim().startsWith('sb-')) {
              document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
          });
          console.log('Cleared problematic Supabase cookies');
        } catch (e) {
          console.error('Failed to clear cookies:', e);
        }
      }
      
      // Prevent the error from bubbling up
      event.preventDefault();
    }
  }, true);

  console.log('Supabase cookie handling patches applied');
}

// Call this to clear all Supabase cookies (useful for troubleshooting)
export function clearSupabaseCookies() {
  if (typeof window === 'undefined') return;
  
  try {
    document.cookie.split(';').forEach(function(c) {
      const cookieName = c.trim().split('=')[0];
      if (cookieName.startsWith('sb-')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log(`Cleared cookie: ${cookieName}`);
      }
    });
    
    // Also clear localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage item: ${key}`);
      }
    });
    
    console.log('All Supabase cookies and storage cleared');
  } catch (error) {
    console.error('Error clearing Supabase cookies:', error);
  }
} 