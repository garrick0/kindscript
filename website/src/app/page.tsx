import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              K
            </div>
            <span className="text-lg font-semibold text-white">KindScript</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-zinc-400 transition hover:text-white">
              Docs
            </Link>
            <Link href="/tutorial" className="text-sm text-zinc-400 transition hover:text-white">
              Tutorial
            </Link>
            <Link href="/agent" className="text-sm text-zinc-400 transition hover:text-white">
              Agent
            </Link>
            <Link href="/about" className="text-sm text-zinc-400 transition hover:text-white">
              About
            </Link>
            <Link
              href="/agent#waitlist"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-36 pb-12 sm:pt-44 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Architecture as Types
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-zinc-400 sm:text-2xl">
            Enforce architectural rules at compile time. Define your architecture as TypeScript types — KindScript checks that your code follows them.
          </p>
        </div>
      </section>

      {/* KindScript OSS Section */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-wide">
              Open Source
            </span>
          </div>
          <h2 className="mb-6 text-center text-3xl font-bold text-white sm:text-4xl">
            KindScript
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-zinc-400">
            A TypeScript compiler plugin that validates your codebase against architectural patterns. No runtime overhead, pure type-level enforcement.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
                <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Compile-Time Checking</h3>
              <p className="text-zinc-400">
                Architectural violations are caught before code ships — not in code review or at runtime. Violations appear as diagnostics in your IDE.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Zero Runtime</h3>
              <p className="text-zinc-400">
                All APIs are pure TypeScript types. No runtime code, no bundle impact, no performance cost. <code className="text-xs text-indigo-400">import type</code> is all you need.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">TypeScript-Native</h3>
              <p className="text-zinc-400">
                No new language, no config files. Your architecture is defined in <code className="text-xs text-indigo-400">.ts</code> files using the type system you already know.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/docs"
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:w-auto"
            >
              Read the Docs
            </Link>
            <Link
              href="/tutorial"
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 sm:w-auto"
            >
              Start Interactive Tutorial
            </Link>
            <a
              href="https://github.com/garrick0/abstractions-as-types"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg border border-zinc-700 px-6 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:w-auto"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-6xl border-t border-zinc-800" />

      {/* Agent Section */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 uppercase tracking-wide">
              AI-Powered
            </span>
          </div>
          <h2 className="mb-6 text-center text-3xl font-bold text-white sm:text-4xl">
            KindScript Agent
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-zinc-400">
            Discover the architecture your codebase already has. Agent uses AI to scan your code, classify files into architectural roles, and visualize the result.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">AI-Powered Discovery</h3>
              <p className="text-zinc-400">
                Claude analyzes your codebase to identify patterns, architectural layers, and component relationships automatically.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Interactive Graph</h3>
              <p className="text-zinc-400">
                Visualize your architecture as an interactive graph. Explore kinds, instances, and relationships with detail views and filters.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/agent"
              className="inline-block rounded-lg bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-500"
            >
              Learn More About Agent
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-sm text-zinc-400 transition hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/tutorial" className="text-sm text-zinc-400 transition hover:text-white">
                    Tutorial
                  </Link>
                </li>
                <li>
                  <Link href="/agent" className="text-sm text-zinc-400 transition hover:text-white">
                    Agent
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-zinc-400 transition hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-zinc-400 transition hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/garrick0/abstractions-as-types"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 transition hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/garrick0/abstractions-as-types/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 transition hover:text-white"
                  >
                    Issues
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-zinc-400 transition hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} KindScript. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
