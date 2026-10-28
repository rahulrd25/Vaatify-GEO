import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Building2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vaatify GEO',
  description:
    'Privacy Policy for Vaatify GEO, compliant with UK GDPR and the Data Protection Act 2018. Operated by DECCAN ADAPTIVE INTELLIGENCE LIMITED (Company No. 16694122).',
  alternates: {
    canonical: 'https://vaatify.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Vaatify GEO',
    description:
      'Privacy Policy for Vaatify GEO, compliant with UK GDPR and the Data Protection Act 2018. Operated by DECCAN ADAPTIVE INTELLIGENCE LIMITED (Company No. 16694122).',
    url: 'https://vaatify.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24 bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>UK GDPR &amp; Data Protection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500 font-subheading">
            Last updated: October 2026 &middot; Compliant with UK GDPR, Data Protection Act 2018 &amp; EU GDPR
          </p>
        </div>

        {/* Official Data Controller Registry Banner */}
        <div className="mb-12 p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Registered Data Controller</span>
            </div>
            <p className="text-base font-bold text-slate-950">
              DECCAN ADAPTIVE INTELLIGENCE LIMITED
            </p>
            <p className="text-xs text-slate-600">
              Private Limited Company &middot; United Kingdom &middot; Company Number: <strong className="text-slate-900 font-semibold">16694122</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/terms"
              className="text-xs font-semibold text-[#FE4D03] hover:text-[#d03e00] flex items-center gap-1 transition-colors"
            >
              <span>View Terms of Service</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Privacy Content Body */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed font-subheading">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              1. Overview &amp; Data Controller
            </h2>
            <p>
              <strong>DECCAN ADAPTIVE INTELLIGENCE LIMITED</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a private limited company registered in the United Kingdom under Company Number <strong>16694122</strong>, is the data controller responsible for the personal data collected through the <strong>Vaatify GEO</strong> platform and websites (vaatify.com).
            </p>
            <p>
              We are committed to respecting your privacy, protecting your personal data, and maintaining transparency about how we collect, store, and process your information in accordance with the <strong>UK General Data Protection Regulation (UK GDPR)</strong>, the <strong>Data Protection Act 2018</strong>, and the European Union General Data Protection Regulation (EU GDPR).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              2. Personal Data We Collect
            </h2>
            <p>Depending on how you interact with our platform, we collect the following categories of information:</p>
            <div className="space-y-3 pl-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="font-semibold text-slate-900 text-sm">A. Account &amp; Identity Data</p>
                <p className="text-xs text-slate-600 mt-1">
                  When you register, we collect your work email address, user ID, corporate organization name, and authentication tokens. Passwords are cryptographically salted and hashed using industry-standard protocols.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="font-semibold text-slate-900 text-sm">B. Workspace &amp; Brand Configuration Data</p>
                <p className="text-xs text-slate-600 mt-1">
                  Brand domains, target category keywords, tracked competitor domains, schedule frequencies, and notification webhook destinations (e.g. Slack/Email) that you configure.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="font-semibold text-slate-900 text-sm">C. Technical &amp; Log Telemetry</p>
                <p className="text-xs text-slate-600 mt-1">
                  IP addresses, browser type, operating system version, page response latency, and referring URLs collected to monitor platform security, API rate limiting, and system reliability.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="font-semibold text-slate-900 text-sm">D. Billing Data</p>
                <p className="text-xs text-slate-600 mt-1">
                  Payment records, transaction identifiers, and VAT details. We do not store raw credit card numbers on our servers; payments are processed securely by PCI-DSS Level 1 certified payment processors.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              3. AI Citation Data vs. Personal Data
            </h2>
            <p>
              <strong>Important Clarification:</strong> Vaatify GEO audits publicly available generative AI engine responses (e.g. OpenAI ChatGPT, Google AI Overviews, Perplexity, Anthropic Claude).
            </p>
            <p className="text-slate-600">
              The citation snippets, source URLs, and ranking distributions retrieved from search models consist of public web data and AI outputs. We do not collect, intercept, or inspect the private conversational histories of individuals searching on external platforms.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              4. Lawful Bases for Processing (UK GDPR Article 6)
            </h2>
            <p>We process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>
                <strong>Performance of a Contract:</strong> To provision your user account, execute scheduled citation audits, deliver dashboard reporting, and process billing;
              </li>
              <li>
                <strong>Legitimate Interests:</strong> To safeguard our infrastructure against abusive scraping, enhance our SERP collectors, and prevent platform fraud;
              </li>
              <li>
                <strong>Legal Obligation:</strong> To maintain required financial, accounting, and tax records in accordance with United Kingdom statutory obligations.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              5. Data Sharing &amp; Third-Party Sub-Processors
            </h2>
            <p>
              <strong>We do not sell, rent, or trade your personal data or your brand tracking data.</strong>
            </p>
            <p>We share personal data solely with trusted third-party sub-processors required to operate our service:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span className="font-semibold text-slate-900 block">Cloud Database &amp; Identity Infrastructure</span>
                <span className="text-slate-500">Secure database hosting and encrypted authentication infrastructure (SOC-2 Type II certified).</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span className="font-semibold text-slate-900 block">Cloud Application Hosting</span>
                <span className="text-slate-500">Secure application hosting and background pipeline execution with end-to-end TLS encryption.</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span className="font-semibold text-slate-900 block">Stripe</span>
                <span className="text-slate-500">Payment gateway and subscription billing management.</span>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <span className="font-semibold text-slate-900 block">Transactional Email</span>
                <span className="text-slate-500">Dispatching password resets, account confirmation links, and rank alerts.</span>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              6. Data Security &amp; Storage Standards
            </h2>
            <p>
              We enforce rigorous administrative, technical, and physical safeguards to protect your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>All network transmissions are protected using Transport Layer Security (TLS 1.3);</li>
              <li>Data stored in our primary data stores is encrypted at rest using AES-256;</li>
              <li>Administrative access requires mandatory multi-factor authentication (MFA) and least-privilege role boundaries;</li>
              <li>Periodic automated vulnerability assessments and code audits.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              7. International Data Transfers
            </h2>
            <p>
              When your personal data is transferred outside the United Kingdom or the European Economic Area, we ensure an adequate level of protection is maintained by using UK International Data Transfer Agreements (IDTA) or European Commission Standard Contractual Clauses (SCCs).
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              8. Your Rights Under UK GDPR
            </h2>
            <p>Under United Kingdom data protection law, you possess key rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you;</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data;</li>
              <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data where no continuing lawful basis exists;</li>
              <li><strong>Right to Restrict Processing:</strong> Request suspension of processing under certain statutory conditions;</li>
              <li><strong>Right to Data Portability:</strong> Obtain your data in a structured, machine-readable format;</li>
              <li><strong>Right to Object:</strong> Object to processing carried out under our legitimate interests.</li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">
              To exercise any of these rights, email us at <a href="mailto:hello@vaatify.com" className="text-[#FE4D03] hover:underline font-medium">hello@vaatify.com</a>. We respond to all verified statutory requests within thirty (30) days.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              9. Cookies &amp; Tracking Technologies
            </h2>
            <p>
              We use strictly necessary authentication cookies to maintain your authenticated session across browser visits and remember your workspace state. We do not employ intrusive tracking cookies or sell behavioral profile segments to third-party advertising networks.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              10. Data Protection Officer &amp; Contact Inquiries
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact our team:
            </p>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs sm:text-sm">
              <p>
                <strong>Data Controller:</strong> DECCAN ADAPTIVE INTELLIGENCE LIMITED
              </p>
              <p>
                <strong>Company Number:</strong> 16694122
              </p>
              <p>
                <strong>Jurisdiction:</strong> United Kingdom
              </p>
              <p>
                <strong>Product:</strong> Vaatify GEO (https://vaatify.com)
              </p>
              <p>
                <strong>Contact Email:</strong>{' '}
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
            <p className="text-xs text-slate-500 mt-3">
              You also have the statutory right to lodge a complaint with the UK supervisory authority, the <strong>Information Commissioner&apos;s Office (ICO)</strong>, at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-slate-700 underline hover:text-slate-900">ico.org.uk</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
