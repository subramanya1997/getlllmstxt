"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

interface RootLayoutClientProps {
  children: React.ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith("/login") || pathname === "/verify"
  const isDashboard = pathname?.startsWith("/dashboard")

  return (
    <>
      {!isAuthPage && !isDashboard && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAuthPage && !isDashboard && <Footer />}
    </>
  )
} 