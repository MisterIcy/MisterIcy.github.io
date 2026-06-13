#!/usr/bin/env node
/**
 * Standalone llms.txt generator — runs without a full Astro build.
 *
 * Reads blog posts directly via gray-matter and writes:
 *   public/llms.txt        → index for LLMs (per llmstxt.org spec)
 *   public/llms-full.txt   → full post content for deep LLM consumption
 *
 * The Astro build (npm run build) regenerates these via dedicated endpoints:
 *   src/pages/llms.txt.ts and src/pages/llms-full.txt.ts
 * Those take precedence in dist/. This script is for quick local refresh
 * and is triggered automatically by the Claude Code PostToolUse hook.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const PUBLIC_DIR = join(ROOT, 'public');

const SITE_URL = 'https://mistericy.github.io';
const SITE_TITLE = 'Binary Brew';
const SITE_DESCRIPTION = 'Brewing stories of software, systems, and the souls behind the code';
const AUTHOR_NAME = 'Alexandros Koutroulis';

const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

const posts = files
	.map((file) => {
		const raw = readFileSync(join(BLOG_DIR, file), 'utf-8');
		const { data, content: body } = matter(raw);
		const ext = file.endsWith('.mdx') ? '.mdx' : '.md';
		const slug = basename(file, ext);
		return { data, body, slug };
	})
	.filter((p) => !p.data.draft)
	.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate));

// ── llms.txt ──────────────────────────────────────────────────────────────────

const postLines = posts
	.map((p) => {
		const url = `${SITE_URL}/blog/${p.slug}/`;
		const desc = (p.data.excerpt || p.data.description || '').replace(/\n/g, ' ').trim();
		return `- [${p.data.title}](${url}): ${desc}`;
	})
	.join('\n');

const llmsTxt = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

${SITE_TITLE} is a technical blog by ${AUTHOR_NAME} — Senior Software Engineer, Engineering Manager, and someone who has been writing code since 1995. Posts live at the intersection of the technical and the human: deep debugging, reverse engineering, security, team psychology, and software leadership written from 30 years of hands-on practice.

## Blog Posts

${postLines}

## About

- [About ${AUTHOR_NAME}](${SITE_URL}/about/): Senior Software Engineer and Engineering Manager at Epignosis (eFront). 10+ years professional experience, nearly 30 years coding. Specializing in backend engineering, debugging, reverse engineering, and SaaS platform development.

## Feeds & Discovery

- [RSS Feed](${SITE_URL}/rss.xml): Subscribe to all posts in RSS 2.0 format
- [Sitemap](${SITE_URL}/sitemap-index.xml): Full site structure

## Optional

- [llms-full.txt](${SITE_URL}/llms-full.txt): Complete post content for deep LLM consumption
`;

// ── llms-full.txt ─────────────────────────────────────────────────────────────

const postSections = posts
	.map((p) => {
		const url = `${SITE_URL}/blog/${p.slug}/`;
		const tags = (p.data.tags ?? []).join(', ');
		const date = new Date(p.data.pubDate).toISOString().split('T')[0];
		const updated = p.data.updatedDate
			? `\nUpdated: ${new Date(p.data.updatedDate).toISOString().split('T')[0]}`
			: '';
		const desc = (p.data.description || '').replace(/\n/g, ' ').trim();
		return `## ${p.data.title}

URL: ${url}
Published: ${date}${updated}
Category: ${p.data.category ?? 'General'}
Tags: ${tags}

${desc}

${p.body.trim()}`;
	})
	.join('\n\n---\n\n');

const llmsFullTxt = `# ${SITE_TITLE} — Full Content

> ${SITE_DESCRIPTION}

Complete text of all published posts on ${SITE_TITLE}, a blog by ${AUTHOR_NAME}.
For a structured index, see: ${SITE_URL}/llms.txt

---

${postSections}
`;

writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsTxt, 'utf-8');
writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), llmsFullTxt, 'utf-8');

console.log(`✅ Generated public/llms.txt (${posts.length} published posts)`);
console.log(`✅ Generated public/llms-full.txt (${posts.length} published posts)`);
