import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - getllmstxt",
  description: "Privacy policy and data handling practices for getllmstxt",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-lg text-gray-600">
              At getllmstxt, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <p className="text-gray-600">
              When you visit the website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Provide and maintain our Service</li>
              <li>Notify you about changes to our Service</li>
              <li>Allow you to participate in interactive features when you choose to do so</li>
              <li>Provide customer support</li>
              <li>Monitor the usage of our Service</li>
              <li>Detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p className="text-gray-600">
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Cookies</h2>
            <p className="text-gray-600">
              We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-600">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@getllmstxt.com" className="text-[#E76F51] hover:underline">
                privacy@getllmstxt.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
} 