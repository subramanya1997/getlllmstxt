"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Home() {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitted URL:", url)
    setUrl("")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 shadow-sm border border-gray-200">
          <span className="text-[#E76F51] text-sm">💥</span>
          <span className="text-gray-600 text-sm">Get 1 month free with yearly plan</span>
        </div>
        <div className="space-y-2 mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            Turn websites into <span className="text-[#F4A261]">LLM Search</span> ready
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Get ready for Perplexity, Google Overview, and ChatGPT
          </p>
        </div>
        <div className="flex justify-center w-full">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="url"
                placeholder="https://example.com/sitemap.xml"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="flex-grow bg-white border-gray-200 h-12 text-base sm:max-w-md md:max-w-lg"
              />
              <Button type="submit" className="w-full sm:w-auto bg-[#E76F51] hover:bg-[#D65F41] text-white px-8 h-12">
                Start for free
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

