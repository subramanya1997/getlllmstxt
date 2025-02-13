import { Metadata } from "next"
import VerifyForm from "@/components/auth/VerifyForm"

export const metadata: Metadata = {
  title: "Verify Code - getlllmstxt",
  description: "Enter your verification code",
}

export default function VerifyPage() {
  return (
    <>
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 shadow-sm border border-gray-200">
        <span className="text-[#E76F51] text-sm">🔐</span>
        <span className="text-gray-600 text-sm">Check your email for the code</span>
      </div>
      <div className="space-y-2 mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
          Enter the <span className="text-[#F4A261]">code</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          We sent a verification code to your email
        </p>
      </div>
      <VerifyForm />
    </>
  )
} 