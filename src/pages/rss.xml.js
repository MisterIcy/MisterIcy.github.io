import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const allPosts = await getCollection('blog');
	// Filter out drafts - RSS feeds should only contain published content
	const posts = allPosts.filter((post) => !post.data.draft);
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => {
			const author = post.data.author || {
				name: SITE_AUTHOR.name,
				social: SITE_AUTHOR.social,
			};
			return {
				...post.data,
				link: `/blog/${post.id}/`,
				author: author.name,
				categories: [
					...(post.data.category ? [post.data.category] : []),
					...(post.data.tags || []),
				],
				customData: `
					<author>${author.name}</author>
					${post.data.tags && post.data.tags.length > 0
						? `<category>${post.data.tags.join('</category><category>')}</category>`
						: ''}
					${post.data.category ? `<category>${post.data.category}</category>` : ''}
				`,
			};
		}),
	});
}
