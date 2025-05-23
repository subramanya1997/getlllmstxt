import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import RootLayoutClient from "@/components/RootLayoutClient"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "getllmstxt - Optimize for AI Search",
  description: "Turn your website ready for new age answer engines",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-screen bg-white overflow-x-hidden`}>
        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}