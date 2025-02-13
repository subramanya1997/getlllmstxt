import { Metadata } from "next"
import Logo from "@/components/Logo"
import SignInForm from "@/components/auth/SignInForm"

export const metadata: Metadata = {
  title: "Login - getlllmstxt",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-10">
      <div className="w-full max-w-[350px] space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Logo />
          <p className="text-sm text-gray-500 text-center">
            Optimize your website for the new age of AI search engines
          </p>
        </div>
        <SignInForm />
        <div className="text-center text-sm text-gray-500">
          By clicking continue, you agree to our{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-[#E97451]">Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-[#E97451]">Privacy Policy</a>.
        </div>
      </div>
    </div>
  )
} 