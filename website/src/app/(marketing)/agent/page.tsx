import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";
import { FadeIn } from "@/components/fade-in";
import { ImageLightbox } from "@/components/image-lightbox";

function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            K
          </div>
          <span className="text-lg font-semibold text-white">Kindscript</span>
        </div>
        <a
          href="#waitlist"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Get Early Access
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-36 pb-12 sm:pt-44 sm:pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium tracking-widest text-indigo-400 uppercase">
          AI-Powered Codebase Analysis
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          See the architecture your codebase{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            already has
          </span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Kindscript scans your code to discover patterns, classify every file
          into its architectural role, and show you the result as an interactive
          graph. Powered by Claude.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#waitlist"
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:w-auto"
          >
            Get Early Access
          </a>
          <a
            href="#features"
            className="w-full rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:w-auto"
          >
            See How It Works
          </a>
        </div>
      </div>

      {/* Hero product demo */}
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="overflow-hidden rounded-xl border border-zinc-800 shadow-2xl shadow-indigo-500/5">
          <img
            src="/agent/demo.webp"
            alt="Animated demo of the Kindscript ontology manager showing kind discovery, instance classification, and detail views"
            width={1440}
            height={900}
            className="w-full"
          />
        </div>
        <p className="mt-3 text-center text-xs text-zinc-600">
          Live product demo — kinds, instances, and detail views
        </p>
      </div>

      {/* Powered by */}
      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="mb-4 text-xs font-medium tracking-widest text-zinc-600 uppercase">
          Built with
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm text-zinc-500 sm:flex sm:items-center sm:justify-center sm:gap-8">
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.31 0-.594.063-.846.182C4.81 2.18 4.282 4.232 4.69 7.04c-2.442.872-4.056 2.294-4.056 3.964 0 1.67 1.614 3.093 4.055 3.964-.408 2.808.12 4.86 1.572 5.524.252.12.535.182.846.182 1.345 0 3.107-.96 4.888-2.623 1.78 1.654 3.542 2.603 4.887 2.603.31 0 .594-.063.846-.182 1.452-.665 1.98-2.717 1.572-5.524 2.441-.872 4.055-2.294 4.055-3.964 0-1.67-1.614-3.092-4.055-3.964.408-2.808-.12-4.86-1.572-5.524a1.903 1.903 0 0 0-.846-.182zm-.025 1.35c.953.427 1.203 2.043.862 4.154a17.98 17.98 0 0 0-2.36-.546 18.14 18.14 0 0 0-1.508-1.839c1.415-1.336 2.674-2.058 3.006-1.77zm-9.706.002c.332-.29 1.59.432 3.006 1.767a18.14 18.14 0 0 0-1.508 1.84 17.98 17.98 0 0 0-2.36.545c-.342-2.11-.091-3.726.862-4.152zM12 15.435a15.36 15.36 0 0 1-1.658-1.432 15.36 15.36 0 0 1-1.432-1.658c.49-.095 1-.17 1.523-.22.37.608.78 1.192 1.223 1.748a17.06 17.06 0 0 0 1.224-1.748c.523.05 1.033.125 1.523.22a15.36 15.36 0 0 1-1.432 1.658 15.36 15.36 0 0 1-1.658 1.432h.687z"/>
            </svg>
            React
          </span>
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="4" cy="8" r="2"/>
              <circle cx="20" cy="8" r="2"/>
              <circle cx="4" cy="16" r="2"/>
              <circle cx="20" cy="16" r="2"/>
              <line x1="6" y1="8" x2="9" y2="10.5" stroke="currentColor" strokeWidth="1"/>
              <line x1="18" y1="8" x2="15" y2="10.5" stroke="currentColor" strokeWidth="1"/>
              <line x1="6" y1="16" x2="9" y2="13.5" stroke="currentColor" strokeWidth="1"/>
              <line x1="18" y1="16" x2="15" y2="13.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            Cytoscape
          </span>
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            TypeScript
          </span>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: "Pattern Discovery",
    headline: "Your codebase has patterns. Kindscript finds them.",
    description:
      "Scans file structure, naming conventions, AST, and imports to surface the recurring architectural concepts — entities, services, repositories, controllers, hooks — whatever patterns actually exist in your code.",
    image: "/agent/feature-schema.webp",
    imageAlt:
      "Schema view showing discovered kinds like Aggregate, Commands, State, Events organized in a hierarchical graph",
    caption: "Schema view — discovered architectural patterns rendered as a kind hierarchy",
    blurDataURL:
      "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAACQAQCdASoQAAoABUB8JZwAAuZdk0AA/u7Kios0OW81+c/itV8eAIG5VgQAAA==",
  },
  {
    title: "Instance Classification",
    headline: "Every file gets a role.",
    description:
      "Map each file and declaration to its architectural kind. See instances grouped by containment, filter by kind, and explore relationships between components. Each classification is backed by structured evidence.",
    image: "/agent/feature-instances.webp",
    imageAlt:
      "Instance view showing OrderAggregate and PaymentAggregate with their contained files classified by kind",
    caption: "Instance view — files classified into their architectural roles",
    blurDataURL:
      "data:image/webp;base64,UklGRkYAAABXRUJQVlA4IDoAAADQAQCdASoQAAoABUB8JQBYdiEI5lVuoAD+7A9GyFyKcKibJtUhgB31D7A/NBpn/2iktGZSWLfRoAAA",
  },
  {
    title: "Visual Graph Explorer",
    headline: "Navigate your architecture, not just your file tree.",
    description:
      "An interactive graph editor that shows how concepts relate. Hierarchical layouts, containment grouping, detail panels with relationships — click any node to see exactly where it lives in your code.",
    image: "/agent/feature-detail.webp",
    imageAlt:
      "Detail panel showing OrderAggregate instance with its kind, location, and 5 containment relationships",
    caption: "Detail panel — drill into any node to see relationships and source locations",
    blurDataURL:
      "data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAACwAQCdASoQAAoABUB8JZQAAueL6WzgAP7uymQ8Dt4a/dmPscKrU/B5o9ryYHOSAAA=",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Understand your codebase at a higher level
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              Go beyond file trees and grep. See the architectural concepts that
              shape your system.
            </p>
          </div>
        </FadeIn>

        <div className="mt-20 space-y-16 sm:space-y-24 lg:space-y-32">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={100}>
              <div
                className={`flex flex-col items-center gap-12 lg:flex-row ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-1 lg:max-w-md">
                  <p className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
                    {feature.title}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    {feature.headline}
                  </h3>
                  <p className="mt-4 leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="overflow-hidden rounded-xl border border-zinc-800 shadow-xl">
                    <ImageLightbox
                      src={feature.image}
                      alt={feature.imageAlt}
                      width={1440}
                      height={900}
                      className="w-full"
                      placeholder="blur"
                      blurDataURL={feature.blurDataURL}
                    >
                      <p className="mt-3 text-center text-xs text-zinc-600">
                        {feature.caption}
                      </p>
                    </ImageLightbox>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* AI Copilot feature with mock conversation */}
        <FadeIn delay={100}>
          <div className="mt-24 sm:mt-32">
            <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-10">
              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
                <div className="flex-1 text-center lg:text-left">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 lg:mx-0">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                      />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm font-medium tracking-widest text-indigo-400 uppercase">
                    AI Copilot
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    Ask questions. Propose changes. Stay in control.
                  </h3>
                  <p className="mt-4 leading-relaxed text-zinc-400">
                    A Claude-powered assistant that reads your codebase, navigates
                    your ontology, and proposes structural changes through natural
                    conversation. Every mutation requires your approval —
                    human-in-the-loop by design.
                  </p>
                </div>
                {/* Mock conversation */}
                <div className="w-full flex-1 lg:max-w-sm">
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-950 p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                        Y
                      </div>
                      <p className="text-zinc-300">
                        Which files don&apos;t fit any discovered pattern?
                      </p>
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        K
                      </div>
                      <div className="text-zinc-400">
                        <p>
                          I found <span className="text-indigo-400">12 files</span> classified as <span className="text-zinc-300">Unknown</span>. Most are utility modules that could form a new kind:
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
                            src/utils/retry.ts
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
                            src/utils/debounce.ts
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500/70" />
                            src/lib/cache.ts
                          </li>
                        </ul>
                        <p className="mt-2 text-xs">
                          Want me to propose a <span className="text-indigo-400">&quot;Utility&quot;</span> kind for these?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

const steps = [
  {
    step: "01",
    title: "Point it at your codebase",
    description:
      "Kindscript analyzes your project's files, structure, naming patterns, imports, and AST to build an evidence index — a structured map of everything in your code.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Discover architectural patterns",
    description:
      "AI identifies the recurring concepts — the \"kinds\" of things in your code. Aggregates, services, events, controllers — whatever patterns actually emerge from the evidence.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Classify, explore, refine",
    description:
      "Every file gets mapped to its role. Explore the result as an interactive graph. Use the AI copilot to ask questions, reclassify, or restructure your ontology.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Three steps to architectural clarity
            </h2>
          </div>
        </FadeIn>
        <div className="mt-16 space-y-0">
          {steps.map((item, i) => (
            <FadeIn key={item.step} delay={i * 100}>
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400">
                    {item.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 h-full w-px bg-gradient-to-b from-indigo-500/30 to-transparent" />
                  )}
                </div>
                <div className={i < steps.length - 1 ? "pb-12" : ""}>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400/60">{item.icon}</span>
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-1 leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  return (
    <section id="waitlist" className="px-6 py-24">
      <FadeIn>
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center sm:p-12">
            <p className="text-sm font-medium tracking-widest text-indigo-400 uppercase">
              Early Access
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Get early access
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              We&apos;re building Kindscript for teams who want deeper insight
              into their codebases. Drop your email and we&apos;ll let you know
              when it&apos;s ready.
            </p>
            <WaitlistForm />
            <p className="mt-4 text-xs text-zinc-600">
              No spam, ever.{" "}
              <Link href="/privacy" className="text-zinc-500 underline hover:text-zinc-400">
                Privacy policy
              </Link>
            </p>
            <div className="mt-6 border-t border-zinc-800 pt-5">
              <p className="text-xs text-zinc-600">Not ready to sign up? Help spread the word.</p>
              <a
                href="https://x.com/intent/tweet?text=Kindscript%20%E2%80%94%20see%20the%20architecture%20your%20codebase%20already%20has.%20AI-powered%20ontology%20discovery%20for%20developers.&url=https%3A%2F%2Fkindscript.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              K
            </div>
            <span className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} Kindscript
            </span>
          </div>
          <span className="text-zinc-800">|</span>
          <Link href="/privacy" className="text-sm text-zinc-600 hover:text-zinc-400">
            Privacy
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/samuelgleeson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 transition hover:text-zinc-400"
            aria-label="GitHub"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a
            href="https://x.com/samuelgleeson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 transition hover:text-zinc-400"
            aria-label="X (Twitter)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <span className="text-sm text-zinc-600">
            Built by Samuel Gleeson
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
