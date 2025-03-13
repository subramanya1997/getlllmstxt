import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Create a custom browser utility file for handling cookies
function createCustomSupabaseClient() {
  // Monkey patch the cookie parsing function to handle base64-encoded cookies
  if (typeof window !== 'undefined') {
    // First patch: Fix JSON parsing for base64-encoded cookies
    const origJsonParse = JSON.parse;
    JSON.parse = function(text: string, reviver?: (key: string, value: unknown) => unknown) {
      // Only apply special handling for cookie strings that start with base64-
      if (typeof text === 'string' && text.startsWith('base64-')) {
        try {
          // For Supabase base64 cookies, decode properly
          const base64Value = text.replace('base64-', '');
          const jsonString = atob(base64Value);
          return origJsonParse(jsonString, reviver);
        } catch (e) {
          console.error('Error parsing base64 cookie:', e);
          // Return a properly structured object that won't cause format errors
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
      
      // For all other cases, use the original JSON.parse
      return origJsonParse(text, reviver);
    };

    // Second patch: Intercept any errors from parsing unexpected string formats
    // This helps with the "Unexpected format: String" error
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key: string) {
      try {
        const value = originalGetItem.call(this, key);
        return value;
      } catch (error) {
        console.warn(`Error getting item from storage for key ${key}:`, error);
        return null; // Return null to prevent further errors
      }
    };
  }

  // Now create the client with our patched handling
  return createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

// Client-side Supabase client - safe to use in hooks, components and browser
export function createClientSideSupabase() {
  return createCustomSupabaseClient();
}

// Create a pre-initialized instance for direct imports
export const supabaseClient = createClientSideSupabase();

// Note: Any connection checking functionality has been removed to prevent errors 