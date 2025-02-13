import { Krona_One } from "next/font/google"
import Link from "next/link"

const kronaOne = Krona_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-krona-one",
})

export default function Logo() {
  return (
    <Link href="/" className={`text-2xl font-bold ${kronaOne.className} hover:opacity-90`}>
      <span className="text-[#E97451]">/</span>
      <span>getllmstxt</span>
    </Link>
  )
} 