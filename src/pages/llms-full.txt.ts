import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';

export const GET: APIRoute = async () => {
	const allPosts = await getCollection('blog');
	const posts = allPosts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	const sections = posts
		.map((post) => {
			const url = `${SITE_URL}/blog/${post.id}/`;
			const tags = (post.data.tags ?? []).join(', ');
			const date = post.data.pubDate.toISOString().split('T')[0];
			const updated = post.data.updatedDate
				? `\nUpdated: ${post.data.updatedDate.toISOString().split('T')[0]}`
				: '';
			const desc = post.data.description.replace(/\n/g, ' ').trim();
			return `## ${post.data.title}

URL: ${url}
Published: ${date}${updated}
Category: ${post.data.category ?? 'General'}
Tags: ${tags}

${desc}

${(post.body ?? '').trim()}`;
		})
		.join('\n\n---\n\n');

	const content = `# ${SITE_TITLE} — Full Content

> ${SITE_DESCRIPTION}

Complete text of all published posts on ${SITE_TITLE}, a blog by ${SITE_AUTHOR.name}.
For a structured index, see: ${SITE_URL}/llms.txt

---

${sections}
`;

	return new Response(content, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
