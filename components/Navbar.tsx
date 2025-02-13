import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <Button asChild className="bg-[#E76F51] hover:bg-[#D65F41] text-white">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

