import SitemapSubmissionForm from "@/components/SitemapSubmissionForm"

export default function Home() {
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
        <SitemapSubmissionForm />
      </div>
    </div>
  )
}

