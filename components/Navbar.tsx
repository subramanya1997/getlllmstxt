"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

export default function Navbar() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }
    
    checkUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="hover:opacity-90">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="bg-[#E76F51] hover:bg-[#c45e3f] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing out..." : "Sign out"}
                </Button>
              </>
            ) : (
              <Button asChild className="bg-[#E76F51] hover:bg-[#c45e3f] text-white">
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

