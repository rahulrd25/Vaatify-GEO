import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  content: string;
}

function getContentDirectory(): string {
  // Check frontend/content/blog then ./content/blog
  const localFrontendPath = path.join(process.cwd(), 'content', 'blog');
  if (fs.existsSync(localFrontendPath)) {
    return localFrontendPath;
  }
  const rootPath = path.join(process.cwd(), 'frontend', 'content', 'blog');
  if (fs.existsSync(rootPath)) {
    return rootPath;
  }
  return localFrontendPath;
}

export function getAllPosts(): BlogPost[] {
  const dir = getContentDirectory();
  if (!fs.existsSync(dir)) {
    return [];
  }

  const fileNames = fs.readdirSync(dir);
  const posts: BlogPost[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) {
      continue;
    }

    const slug = fileName.replace(/\.mdx?$/, '');
    const fullPath = path.join(dir, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    posts.push({
      slug,
      title: data.title || slug.replace(/-/g, ' '),
      excerpt: data.excerpt || data.description || '',
      date: data.date ? String(data.date) : '2026-10-20',
      readTime: data.readTime || `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`,
      author: data.author || 'Vaatify Research',
      category: data.category || 'GEO Insights',
      content,
    });
  }

  // Sort descending by date
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const dir = getContentDirectory();
  const mdxPath = path.join(dir, `${slug}.mdx`);
  const mdPath = path.join(dir, `${slug}.md`);

  let targetPath = '';
  if (fs.existsSync(mdxPath)) {
    targetPath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    targetPath = mdPath;
  } else {
    return null;
  }

  const fileContents = fs.readFileSync(targetPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug.replace(/-/g, ' '),
    excerpt: data.excerpt || data.description || '',
    date: data.date ? String(data.date) : '2026-10-20',
    readTime: data.readTime || `${Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read`,
    author: data.author || 'Vaatify Research',
    category: data.category || 'GEO Insights',
    content,
  };
}
