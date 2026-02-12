import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'KindScript — Architecture as Types',
  description: 'Enforce architectural rules at compile time. Define your architecture as TypeScript types — KindScript checks that your code follows them.',
  keywords: ['typescript', 'architecture', 'clean architecture', 'hexagonal architecture', 'compiler', 'type checking'],
  authors: [{ name: 'KindScript Team' }],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'KindScript — Architecture as Types',
    description: 'Enforce architectural rules at compile time using TypeScript types.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
