import { Krona_One } from "next/font/google"

const kronaOne = Krona_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-krona-one",
})

export default function Logo() {
  return (
    <div className={`text-2xl font-bold ${kronaOne.className} hover:opacity-90`}>
      <span className="text-[#E97451]">/</span>
      <span>getllmstxt</span>
    </div>
  )
} 