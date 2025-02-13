import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - getllmstxt",
  description: "Terms of service and usage agreement for getllmstxt",
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using getllmstxt, you accept and agree to be bound by the terms and provision of this agreement.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily access the materials (information or software) on getllmstxt&apos;s website for personal, non-commercial transitory viewing only.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
          <p>The materials on getllmstxt&apos;s website are provided on an &apos;as is&apos; basis. getllmstxt makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
          <p>In no event shall getllmstxt or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on getllmstxt&apos;s website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Revisions and Errata</h2>
          <p>The materials appearing on getllmstxt&apos;s website could include technical, typographical, or photographic errors. getllmstxt does not warrant that any of the materials on its website are accurate, complete or current.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Links</h2>
          <p>getllmstxt has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by getllmstxt of the site.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Modifications</h2>
          <p>getllmstxt may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
        </section>
      </div>
    </div>
  )
} 