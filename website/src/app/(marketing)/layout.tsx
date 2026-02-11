import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-zinc-950">{children}</div>;
}
