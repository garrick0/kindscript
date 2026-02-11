import type { ReactNode } from 'react';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  title: 'KindScript — Architecture as Types',
  description: 'Enforce architectural rules at compile time. Define your architecture as TypeScript types — KindScript checks that your code follows them.',
  keywords: ['typescript', 'architecture', 'clean architecture', 'hexagonal architecture', 'compiler', 'type checking'],
  authors: [{ name: 'KindScript Team' }],
  openGraph: {
    title: 'KindScript — Architecture as Types',
    description: 'Enforce architectural rules at compile time using TypeScript types.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap('/');

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          navbar={
            <Navbar
              logo={<b>KindScript</b>}
              projectLink="https://github.com/kindscript/kindscript"
            />
          }
          footer={<Footer>MIT {new Date().getFullYear()} KindScript</Footer>}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/kindscript/kindscript/tree/main/website"
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
