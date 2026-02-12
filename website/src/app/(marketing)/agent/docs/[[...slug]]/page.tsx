import { notFound } from 'next/navigation';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const AGENT_DOCS_ROOT = join(process.cwd(), 'content', 'agent-docs');

interface Props {
  params: Promise<{
    slug?: string[];
  }>;
}

async function getDocContent(slug: string[]): Promise<string | null> {
  try {
    // Default to README.md if no slug
    const filePath = slug.length === 0
      ? join(AGENT_DOCS_ROOT, 'README.md')
      : join(AGENT_DOCS_ROOT, ...slug) + '.md';

    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    // Try with /README.md suffix for directory indices
    if (slug.length > 0) {
      try {
        const dirPath = join(AGENT_DOCS_ROOT, ...slug, 'README.md');
        const content = await readFile(dirPath, 'utf-8');
        return content;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generateStaticParams() {
  // Generate paths for all markdown files in agent docs
  const paths: { slug: string[] }[] = [];

  async function walkDir(dir: string, basePath: string[] = []): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Skip hidden directories
          if (entry.name.startsWith('.')) continue;
          await walkDir(join(dir, entry.name), [...basePath, entry.name]);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Add file path (without .md extension)
          const fileName = entry.name.replace(/\.md$/, '');
          if (fileName === 'README') {
            // Index file
            paths.push({ slug: basePath });
          } else {
            paths.push({ slug: [...basePath, fileName] });
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist yet (first build) - that's fine
      console.warn(`Agent docs directory not found: ${dir}`);
    }
  }

  await walkDir(AGENT_DOCS_ROOT);
  return paths;
}

export { generateStaticParams };

export default async function AgentDocPage({ params }: Props) {
  const { slug = [] } = await params;
  const content = await getDocContent(slug);

  if (!content) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <article className="prose prose-slate dark:prose-invert lg:prose-lg">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
