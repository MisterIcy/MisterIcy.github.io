import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';

export const GET: APIRoute = async () => {
	const allPosts = await getCollection('blog');
	const posts = allPosts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	const postLines = posts
		.map((post) => {
			const url = `${SITE_URL}/blog/${post.id}/`;
			const desc = (post.data.excerpt || post.data.description).replace(/\n/g, ' ').trim();
			return `- [${post.data.title}](${url}): ${desc}`;
		})
		.join('\n');

	const content = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

${SITE_TITLE} is a technical blog by ${SITE_AUTHOR.name} — ${SITE_AUTHOR.jobTitle}, Engineering Manager, and someone who has been writing code since 1995. Posts live at the intersection of the technical and the human: deep debugging, reverse engineering, security, team psychology, and software leadership written from 30 years of hands-on practice.

## Blog Posts

${postLines}

## About

- [About ${SITE_AUTHOR.name}](${SITE_URL}/about/): ${SITE_AUTHOR.jobTitle} and Engineering Manager at ${SITE_AUTHOR.worksFor.name}. 10+ years professional experience, nearly 30 years coding. Specializing in backend engineering, debugging, reverse engineering, and SaaS platform development.

## Feeds & Discovery

- [RSS Feed](${SITE_URL}/rss.xml): Subscribe to all posts in RSS 2.0 format
- [Sitemap](${SITE_URL}/sitemap-index.xml): Full site structure

## Optional

- [llms-full.txt](${SITE_URL}/llms-full.txt): Complete post content for deep LLM consumption
`;

	return new Response(content, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
