"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SitemapSubmissionForm() {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitted URL:", url)
    setUrl("")
  }

  return (
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
  )
}

