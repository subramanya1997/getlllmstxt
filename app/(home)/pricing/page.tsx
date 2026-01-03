import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Pricing - getllmstxt",
  description: "Simple, transparent pricing for getllmstxt. Choose the plan that fits your needs.",
}

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaLink: string
  popular?: boolean
  yearlyPrice?: string
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out getllmstxt",
    features: [
      "Up to 3 sitemaps",
      "100 URLs per sitemap",
      "Basic llms.txt generation",
      "Community support",
      "Weekly updates",
    ],
    cta: "Get Started",
    ctaLink: "/login",
  },
  {
    name: "Pro",
    price: "$29",
    period: "month",
    yearlyPrice: "$290",
    description: "For professionals and growing businesses",
    features: [
      "Unlimited sitemaps",
      "10,000 URLs per sitemap",
      "Advanced llms.txt optimization",
      "Priority support",
      "Daily updates",
      "Custom metadata extraction",
      "API access",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    ctaLink: "/login",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large organizations with specific needs",
    features: [
      "Everything in Pro",
      "Unlimited URLs",
      "Dedicated support",
      "Real-time updates",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
      "Training & onboarding",
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:sales@getllmstxt.com",
  },
]

const faqs = [
  {
    question: "What is included in the free plan?",
    answer:
      "The free plan includes up to 3 sitemaps with 100 URLs each, basic llms.txt generation, and community support. It's perfect for testing the service and small projects.",
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges accordingly.",
  },
  {
    question: "What's the discount for yearly plans?",
    answer:
      "You get 1 month free when you choose the yearly plan. That's a 16% discount compared to monthly billing!",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can also pay via invoice.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No, there are no setup fees or hidden costs. You only pay for the plan you choose.",
  },
]

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 pt-32 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 shadow-sm border border-gray-200 mb-6">
            <span className="text-[#E76F51] text-sm">💥</span>
            <span className="text-gray-600 text-sm">Get 1 month free with yearly plan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative p-8 ${
                tier.popular
                  ? "border-[#E76F51] border-2 shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-[#E76F51] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 mb-4">{tier.description}</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  {tier.period !== "contact us" && (
                    <span className="text-gray-600 ml-2">/{tier.period}</span>
                  )}
                </div>
                {tier.yearlyPrice && (
                  <p className="text-sm text-gray-500 mt-2">
                    or {tier.yearlyPrice}/year (save 1 month!)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-[#E76F51] mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.ctaLink.startsWith("mailto:") ? (
                <a
                  href={tier.ctaLink}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? "bg-[#E76F51] text-white hover:bg-[#d65d40]"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaLink}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? "bg-[#E76F51] text-white hover:bg-[#d65d40]"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to optimize for AI search?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies making their websites ready for the new age of AI-powered search engines.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#d65d40] transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
