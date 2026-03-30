// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import matter from 'gray-matter';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dirname, 'src', 'content', 'blog');

/** @param {unknown} v */
function toDate(v) {
	if (v == null) return undefined;
	if (v instanceof Date) return v;
	if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v);
	return new Date(String(v));
}

// https://astro.build/config
export default defineConfig({
	site: 'https://mistericy.github.io',
	integrations: [
		mdx({
			extendMarkdownConfig: true,
			optimize: true,
		}),
		sitemap({
			lastmod: new Date(),
			changefreq: 'weekly',
			priority: 1,
			serialize: (item) => {
				const path = new URL(item.url).pathname.replace(/\/$/, '');
				if (!path.startsWith('/blog/')) return item;
				const slug = path.slice('/blog/'.length);
				if (!slug) return item;
				try {
					const raw = readFileSync(join(blogDir, `${slug}.md`), 'utf8');
					const { data } = matter(raw);
					const d = toDate(data.updatedDate ?? data.pubDate);
					if (!d || Number.isNaN(d.getTime())) return item;
					return { ...item, lastmod: d.toISOString() };
				} catch {
					return item;
				}
			},
		}),
		tailwind()],
});
