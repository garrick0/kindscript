import type { ReactNode } from 'react';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const pageMap = await getPageMap('/docs');

  return (
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
  );
}
