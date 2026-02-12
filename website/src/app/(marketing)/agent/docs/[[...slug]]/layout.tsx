import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AgentDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                K
              </div>
              <span className="text-lg font-semibold">KindScript</span>
            </Link>
            <span className="text-sm text-zinc-400">/</span>
            <Link href="/agent" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Agent
            </Link>
            <span className="text-sm text-zinc-400">/</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-white">Docs</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              OSS Docs
            </Link>
            <Link href="/agent" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Agent Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content with top padding for fixed header */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
