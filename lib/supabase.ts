import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// Custom function to safely handle base64 cookies
function safeHandleCookieValue(value: string | undefined): string | undefined {
  if (!value) return value;
  
  // If it's a base64 cookie, properly decode it
  if (value.startsWith('base64-')) {
    try {
      // We return the raw value, but ensure it's structured correctly
      // The actual decoding will be handled by Supabase internally
      return value;
    } catch (error) {
      console.error('Error handling base64 cookie:', error);
      // Return null to avoid parsing errors
      return undefined;
    }
  }
  
  return value;
}

// Server-side Supabase client - only use in Server Components or API routes
export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookieStore = await cookies()
            const value = cookieStore.get(name)?.value
            return safeHandleCookieValue(value)
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error)
            return undefined
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies()
            cookieStore.set(name, value, options)
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        async remove(name: string) {
          try {
            const cookieStore = await cookies()
            cookieStore.delete(name)
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
}

export async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      throw new Error("Error fetching user")
    }

    return {
      name: user.email?.split("@")[0] || "User",
      email: user.email || "",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`,
    }
  } catch (error) {
    console.error("Error in getUser:", error)
    throw error
  }
} 