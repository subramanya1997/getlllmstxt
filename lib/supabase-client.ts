import { createBrowserClient } from "@supabase/ssr";

// Create a browser client for client-side usage
function createCustomSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Client-side Supabase client - safe to use in hooks, components and browser
export function createClientSideSupabase() {
  return createCustomSupabaseClient();
}

// Create a pre-initialized instance for direct imports
export const supabaseClient = createClientSideSupabase();

// Note: Any connection checking functionality has been removed to prevent errors 