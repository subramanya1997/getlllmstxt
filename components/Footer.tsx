import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">© 2024 getllmstxt</div>
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">
            Built by{" "}
            <a
              href="https://subramanya.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E76F51] hover:underline"
            >
              Subramanya N
            </a>
          </div>
          <div className="flex space-x-6">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

