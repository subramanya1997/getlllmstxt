import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Blog - getllmstxt",
  description: "Tips, guides, and insights about optimizing your website for AI search engines",
}

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, guides, and insights about optimizing your website for AI search engines
          </p>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 border border-gray-200">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon!
            </h2>
            <p className="text-gray-600 mb-8">
              We&apos;re working on bringing you valuable insights and guides about optimizing your website for AI search engines. Check back soon for our latest articles!
            </p>
            <Link
              href="/"
              className="inline-block bg-[#E76F51] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#d65d40] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 