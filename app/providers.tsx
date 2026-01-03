"use client"

import { UserProvider } from "@/lib/user-provider"
import { useEffect } from "react"
import { patchSupabaseCookieHandling } from "@/lib/supabase"

export default function Providers({ children }: { children: React.ReactNode }) {
  // Apply Supabase cookie handling patches on component mount (client-side only)
  useEffect(() => {
    // Fix Supabase cookie parsing errors
    patchSupabaseCookieHandling();
  }, []);

  return <UserProvider>{children}</UserProvider>
} 