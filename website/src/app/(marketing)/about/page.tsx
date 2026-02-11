import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              K
            </div>
            <span className="text-lg font-semibold text-white">KindScript</span>
          </Link>
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
            <Link href="/about" className="text-sm text-white">
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-white sm:text-5xl">
            About KindScript
          </h1>

          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-lg leading-relaxed text-zinc-400">
              KindScript started as an exploration: what if we could enforce architectural patterns
              the same way TypeScript enforces type safety?
            </p>

            <h2 className="mt-12 mb-4 text-2xl font-bold text-white">
              The Problem
            </h2>
            <p className="leading-relaxed text-zinc-400">
              Traditional architectural enforcement happens through documentation, code reviews,
              and linters with complex configuration files. These approaches are fragile, easy to
              bypass, and disconnected from the type system developers already use.
            </p>

            <h2 className="mt-12 mb-4 text-2xl font-bold text-white">
              Our Approach
            </h2>
            <p className="leading-relaxed text-zinc-400">
              KindScript makes architecture first-class. Define your layers, components, and
              constraints as TypeScript types. The compiler validates every import against your
              rules. Violations appear as red squiggles in your editor — just like type errors.
            </p>

            <h2 className="mt-12 mb-4 text-2xl font-bold text-white">
              Two Products
            </h2>
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="mb-2 text-xl font-semibold text-white">
                  KindScript (Open Source)
                </h3>
                <p className="text-zinc-400">
                  A TypeScript compiler plugin for compile-time architectural validation.
                  Zero runtime overhead, pure type-level enforcement. Perfect for teams that
                  know their architecture and want to enforce it automatically.
                </p>
                <Link
                  href="/docs"
                  className="mt-4 inline-block text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Read the documentation →
                </Link>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="mb-2 text-xl font-semibold text-white">
                  KindScript Agent (AI-Powered)
                </h3>
                <p className="text-zinc-400">
                  Discover the architecture your codebase already has. Agent uses AI to scan
                  your code, classify files into architectural roles, and visualize patterns
                  as an interactive graph. Powered by Claude.
                </p>
                <Link
                  href="/agent"
                  className="mt-4 inline-block text-sm font-semibold text-violet-400 hover:text-violet-300"
                >
                  Learn about Agent →
                </Link>
              </div>
            </div>

            <h2 className="mt-12 mb-4 text-2xl font-bold text-white">
              Open Source
            </h2>
            <p className="leading-relaxed text-zinc-400">
              KindScript is open source and always will be. We believe architectural tooling
              should be accessible to everyone. The compiler plugin, type definitions, and
              documentation are all available on GitHub under the MIT license.
            </p>

            <div className="mt-8">
              <a
                href="https://github.com/garrick0/abstractions-as-types"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                View on GitHub
              </a>
            </div>

            <h2 className="mt-12 mb-4 text-2xl font-bold text-white">
              Get in Touch
            </h2>
            <p className="leading-relaxed text-zinc-400">
              Questions? Feedback? Want to contribute?
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="https://github.com/garrick0/abstractions-as-types/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Open an issue on GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/garrick0/abstractions-as-types/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Start a discussion
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-3xl text-center text-sm text-zinc-600">
          © {new Date().getFullYear()} KindScript. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
