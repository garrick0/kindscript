import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Kindscript",
  description: "How Kindscript handles your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <nav className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              K
            </div>
            <span className="text-lg font-semibold text-white">Kindscript</span>
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: February 2026</p>

        <div className="mt-10 space-y-8 text-zinc-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <p className="mt-2">
              When you sign up for the Kindscript waitlist, we collect your <strong className="text-zinc-300">email address</strong>. That&apos;s it. We don&apos;t collect your name, location, device information, or any other personal data through the waitlist form.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">How we use it</h2>
            <p className="mt-2">
              Your email is used for one purpose: to notify you when Kindscript is available for early access. We won&apos;t send marketing emails, sell your address to third parties, or share it with anyone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Where it&apos;s stored</h2>
            <p className="mt-2">
              Waitlist submissions are processed and stored by{" "}
              <a href="https://formspree.io" className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer">
                Formspree
              </a>
              , a third-party form handling service. Formspree&apos;s privacy practices are governed by their own{" "}
              <a href="https://formspree.io/legal/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer">
                privacy policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Analytics</h2>
            <p className="mt-2">
              This site uses Vercel&apos;s built-in analytics (if enabled) which collects anonymous, aggregated usage data such as page views and visitor counts. No personal information is collected through analytics. No cookies are used for tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Your rights</h2>
            <p className="mt-2">
              You can request deletion of your email from our waitlist at any time by emailing us. Under GDPR and CCPA, you have the right to access, correct, or delete your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-2">
              Questions about this policy? Reach out at{" "}
              <a href="mailto:privacy@kindscript.ai" className="text-indigo-400 hover:text-indigo-300 underline">
                privacy@kindscript.ai
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-zinc-800 pt-8">
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
            &larr; Back to Kindscript
          </Link>
        </div>
      </main>
    </>
  );
}
