"use client";

import { useForm, ValidationError } from "@formspree/react";

export function WaitlistForm() {
  const [state, handleSubmit] = useForm("waitlistForm");

  if (state.succeeded) {
    return (
      <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm font-medium text-emerald-400">
          You&apos;re on the list! We&apos;ll be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="flex gap-3">
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="you@company.com"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={state.submitting}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {state.submitting ? "Joining..." : "Join"}
        </button>
      </div>
      <ValidationError prefix="Email" field="email" errors={state.errors} className="mt-2 text-xs text-red-400" />
    </form>
  );
}
