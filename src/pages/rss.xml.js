import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getReadingStats } from '../lib/readingTime';

export async function GET(context) {
	const allPosts = await getCollection('blog');
	// Filter out drafts - RSS feeds should only contain published content
	const posts = allPosts.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const latestPost = posts[0].data.pubDate;
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		customData: `
			<language>en-US</language>
			<copyright>Copyright ${new Date().getFullYear()} ${SITE_AUTHOR.name}</copyright>
			<generator>Astro</generator>
			<pubDate>${latestPost.toUTCString()}</pubDate>
			<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
		`,
		items: posts.map((post) => {
			const author = post.data.author || {
				name: SITE_AUTHOR.name,
				social: SITE_AUTHOR.social,
			};
			const { minutes } = getReadingStats(post.body ?? '');
			const readSuffix = ` (${minutes} min read)`;
			return {
				title: post.data.title,
				link: `/blog/${post.id}/`,
				description: `${post.data.description}${readSuffix}`,
				categories: post.data.category ? [post.data.category] : [],
				guid: post.id,
				pubDate: post.data.pubDate,
			};
		}),
	});
}
