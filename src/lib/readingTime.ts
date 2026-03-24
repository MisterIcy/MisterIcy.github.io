/** Default English web reading speed (words per minute). */
export const DEFAULT_WORDS_PER_MINUTE = 200;

export interface ReadingStats {
	words: number;
	minutes: number;
}

/**
 * Estimate reading time from markdown/MDX source (`post.body`).
 * Minimum display is 1 minute when there is any post (empty body still shows 1).
 */
export function getReadingStats(
	body: string,
	wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE,
): ReadingStats {
	const normalized = body.trim().replace(/\s+/g, ' ');
	const words = normalized.length === 0 ? 0 : normalized.split(' ').length;
	const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
	return { words, minutes };
}
