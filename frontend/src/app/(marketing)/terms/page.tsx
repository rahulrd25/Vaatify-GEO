import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Building2, Scale, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Vaatify GEO',
  description:
    'Terms of Service and Customer Agreement for Vaatify GEO, operated by DECCAN ADAPTIVE INTELLIGENCE LIMITED (Company No. 16694122).',
  alternates: {
    canonical: 'https://vaatify.com/terms',
  },
  openGraph: {
    title: 'Terms of Service | Vaatify GEO',
    description:
      'Terms of Service and Customer Agreement for Vaatify GEO, operated by DECCAN ADAPTIVE INTELLIGENCE LIMITED (Company No. 16694122).',
    url: 'https://vaatify.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24 bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-[#FE4D03] text-xs font-medium mb-4">
            <Scale className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500 font-subheading">
            Last updated: October 2026 &middot; Effective immediately for all users and subscribers
          </p>
        </div>

        {/* Official Company Registry Banner */}
        <div className="mb-12 p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono">
              <Building2 className="h-4 w-4 text-[#FE4D03]" />
              <span>Operating Legal Entity</span>
            </div>
            <p className="text-base font-bold text-slate-950">
              DECCAN ADAPTIVE INTELLIGENCE LIMITED
            </p>
            <p className="text-xs text-slate-600">
              Private Limited Company &middot; Registered in the United Kingdom &middot; Company Number: <strong className="text-slate-900 font-semibold">16694122</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-[#FE4D03] hover:text-[#d03e00] flex items-center gap-1 transition-colors"
            >
              <span>View Privacy Policy</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Terms Content Body */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed font-subheading">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              1. Introduction &amp; Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (whether individually or on behalf of an entity that you represent) and <strong>DECCAN ADAPTIVE INTELLIGENCE LIMITED</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a private limited company incorporated in the United Kingdom under Company Number <strong>16694122</strong>.
            </p>
            <p>
              These Terms govern your access to and use of <strong>Vaatify GEO</strong>, including our web applications, APIs, analytics dashboards, citation trackers, alerting systems, and documentation available at <strong>vaatify.com</strong> and associated subdomains (collectively, the &quot;Service&quot;).
            </p>
            <p className="font-medium text-slate-900">
              By registering an account, clicking &quot;Register My Brand&quot;, signing in, or accessing the Service, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree with these Terms, you must immediately cease all use of the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              2. Description of the Vaatify GEO Service
            </h2>
            <p>
              Vaatify GEO provides a Generative Engine Optimization (GEO) and AI search visibility intelligence platform. The Service programmatically analyzes generative AI search engines and foundation model answers (including but not limited to OpenAI ChatGPT Search, Google Gemini &amp; AI Overviews, Perplexity Sonar, and Anthropic Claude) to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Track where and how your registered brand is cited, referenced, or recommended in AI search results;</li>
              <li>Monitor competitor share of voice, citation positions, and recommendation sentiment;</li>
              <li>Deliver automated notifications and reporting when AI engine rankings or citation source links change;</li>
              <li>Provide programmatic REST API access for citation ingestion and workflow integrations.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              3. Account Registration &amp; Corporate Authority
            </h2>
            <p>
              To access the dashboard and tracking tools, you must register an account with a valid work or corporate email address. You agree to provide accurate, current, and complete information during registration.
            </p>
            <p>
              If you register on behalf of a company, business, or legal entity, you represent and warrant that you possess the full legal authority to bind that entity to these Terms. You are responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              4. Subscriptions, Fees &amp; Billing
            </h2>
            <div className="space-y-2">
              <p>
                <strong>4.1 Subscription Plans:</strong> Access to paid tiers (Starter, Growth, Enterprise) is billed on a recurring monthly or annual basis as selected during onboarding or through your billing dashboard.
              </p>
              <p>
                <strong>4.2 Payment Processing:</strong> All payments are processed securely through our PCI-DSS compliant third-party payment gateways. You agree to maintain valid payment details on file.
              </p>
              <p>
                <strong>4.3 Cancellation:</strong> You may cancel your subscription at any time via your workspace settings. Cancellation takes effect at the conclusion of your current prepaid billing cycle. Except where required by applicable UK consumer law, subscription fees are non-refundable.
              </p>
              <p>
                <strong>4.4 Taxes:</strong> All stated prices are exclusive of VAT or applicable sales taxes unless expressly stated otherwise. UK VAT is calculated and charged where required by law.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              5. Intellectual Property &amp; Data Ownership
            </h2>
            <div className="space-y-2">
              <p>
                <strong>5.1 Company Intellectual Property:</strong> All software, DOM-scraping algorithms, citation synthesis methodologies, user interfaces, documentation, trademarks, and logos (including &quot;Vaatify&quot;, &quot;Vaatify GEO&quot;, and associated marks) are the exclusive property of <strong>DECCAN ADAPTIVE INTELLIGENCE LIMITED</strong> and its licensors.
              </p>
              <p>
                <strong>5.2 Your Brand Data:</strong> You retain all ownership rights to your proprietary trademarks, brand assets, confidential marketing strategies, and custom query taxonomies that you submit to the Service. You grant us a non-exclusive, worldwide license solely to process and analyze this data to deliver your citation monitoring reports.
              </p>
              <p>
                <strong>5.3 Aggregated Insights:</strong> We may generate anonymized, de-identified benchmark metrics from aggregated search trends across categories to improve our models and publish industry research. No confidential customer identity or private commercial data is ever disclosed.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              6. Acceptable Use Policy &amp; Prohibitions
            </h2>
            <p>You agree that you will not:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Reverse engineer, decompile, or attempt to extract the source code or proprietary DOM-extraction logic of the Service;</li>
              <li>Circumvent subscription plan rate limits, query quotas, or authentication controls;</li>
              <li>Use the Service to transmit malicious software, automated exploits, or unlawful content;</li>
              <li>Resell, sublicense, or distribute Vaatify GEO data feeds to third parties without an explicit Enterprise License Agreement;</li>
              <li>Impersonate any person or entity, or falsely claim affiliation with an unauthorized brand domain.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              7. Third-Party AI Engine Disclaimers
            </h2>
            <p>
              Vaatify GEO inspects and captures live answers generated by third-party AI platforms (such as OpenAI, Alphabet/Google, Anthropic, and Perplexity). You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Third-party AI platforms operate independently and may alter their algorithms, citation policies, or user interfaces without prior notice;</li>
              <li>Citation metrics and ranking positions represent deterministic observations of live AI SERPs at the specific timestamp of execution;</li>
              <li>The Company does not control, endorse, or accept liability for the factual accuracy or content of generative responses produced by third-party AI models.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law in England and Wales:
            </p>
            <p className="text-slate-600">
              In no event shall <strong>DECCAN ADAPTIVE INTELLIGENCE LIMITED</strong>, its directors, officers, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, business goodwill, or commercial opportunities arising out of or related to your use of or inability to use the Service.
            </p>
            <p className="text-slate-600">
              Our total aggregate liability for all claims arising under or in connection with these Terms or the Service shall not exceed the total amount paid by you to the Company in the twelve (12) months immediately preceding the event giving rise to liability.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              9. Termination &amp; Suspension
            </h2>
            <p>
              We reserve the right to suspend or terminate your account immediately upon notice if you commit a material breach of these Terms, fail to pay applicable subscription fees, or engage in activity that threatens the security or stability of the platform.
            </p>
            <p>
              Upon termination, your right to access the Service terminates immediately, and your stored data will be handled in accordance with our data retention schedule and Privacy Policy.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              10. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms, and any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with them or their subject matter or formation, shall be governed by and construed in accordance with the <strong>laws of England and Wales</strong>.
            </p>
            <p>
              Each party irrevocably agrees that the courts of <strong>London, England</strong> shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              11. Company Details &amp; Legal Notices
            </h2>
            <p>
              For legal inquiries, formal notices, or questions regarding these Terms, please contact us at:
            </p>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs sm:text-sm">
              <p>
                <strong>Company Name:</strong> DECCAN ADAPTIVE INTELLIGENCE LIMITED
              </p>
              <p>
                <strong>Company Number:</strong> 16694122
              </p>
              <p>
                <strong>Jurisdiction:</strong> United Kingdom (England &amp; Wales)
              </p>
              <p>
                <strong>Product:</strong> Vaatify GEO (https://vaatify.com)
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@vaatify.com" className="text-[#FE4D03] hover:underline font-medium">
                  hello@vaatify.com
                </a>
              </p>
              <p>
                <strong>LinkedIn:</strong>{' '}
                <a
                  href="https://www.linkedin.com/company/vaatifyme/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FE4D03] hover:underline font-medium"
                >
                  linkedin.com/company/vaatifyme
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
