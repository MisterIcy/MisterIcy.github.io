Regenerate public/llms.txt and public/llms-full.txt from the current state of all published blog posts.

Run:
```
npm run generate-llms
```

This script reads every file in `src/content/blog/`, skips drafts, sorts by publish date (newest first), and writes two files to `public/`:

- **llms.txt** — structured index per the llmstxt.org spec (title, description, post list with URLs)
- **llms-full.txt** — complete post content for deep LLM consumption

After running, commit both files alongside any new or updated post.

**Note:** The Astro build (`npm run build`) generates the authoritative versions via `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts`. The GitHub Pages deploy runs `npm run build` automatically, so production is always in sync. Use this command for quick local refresh or to update the committed `public/` copies before pushing.
