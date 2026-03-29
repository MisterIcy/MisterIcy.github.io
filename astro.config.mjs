// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

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
		}),
		tailwind()],
});
