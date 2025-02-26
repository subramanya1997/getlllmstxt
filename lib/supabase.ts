import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies()
          cookieStore.set(name, value, options)
        },
        async remove(name: string) {
          const cookieStore = await cookies()
          cookieStore.delete(name)
        },
      },
    }
  )
}

export async function getUser() {
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
} 