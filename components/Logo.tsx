"use client"

import Link from "next/link"
import { Krona_One } from "next/font/google"
import { usePathname } from "next/navigation"

const kronaOne = Krona_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-krona-one",
})

export default function Logo() {
  const pathname = usePathname()
  
  // Determine if we're in a dashboard route
  const isDashboard = pathname?.includes('/dashboard')
  
  // Set redirect URL based on current location
  const redirectUrl = isDashboard ? '/dashboard' : '/'
  
  return (
    <div className={`text-2xl font-bold ${kronaOne.className}`}>
      <Link 
        href={redirectUrl}
        className="flex items-center cursor-pointer"
      >
        <span className="text-[#E97451]">/</span>
        <span className="inline-block">getllmstxt</span>
      </Link>
    </div>
  )
} 