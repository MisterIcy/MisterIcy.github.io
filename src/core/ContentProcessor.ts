import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    readingTime: number;
    wordCount: number;
    content: string;
    html: string;
    tags?: string[];
    categories?: string[];
    image?: string;
    frontmatter?: { [key: string]: any };
}

export class ContentProcessor {
    private posts: Post[] = [];

    constructor() {
        this.setupMarked();
    }

    private setupMarked() {
        // Configure marked with highlight.js syntax highlighting and GFM support
        marked.use(markedHighlight({
            highlight: (code: string, lang: string) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.warn(`Failed to highlight code block with language "${lang}":`, err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        }));

        // Custom renderer for GitHub Flavored Markdown alerts and images                                                                                                                                   
        const renderer = new marked.Renderer();
        const originalBlockquote = renderer.blockquote.bind(renderer);
        const originalImage = renderer.image.bind(renderer);
        
        // Custom image renderer with Tailwind classes
        renderer.image = function(href: string, title: string | null, text: string) {
            // Convert relative paths to absolute paths for build process
            // Build process copies public/ to dist/public/, so use /public/images/
            let src = href;
            if (href.startsWith('./images/')) {
                src = href.replace('./images/', '/public/images/');
            } else if (href.startsWith('images/')) {
                src = href.replace('images/', '/public/images/');
            } else if (href.startsWith('/images/')) {
                src = href.replace('/images/', '/public/images/');
            }
            
            const titleAttr = title ? ` title="${title}"` : '';
            const altAttr = text ? ` alt="${text}"` : '';
            
            return `<div class="flex justify-center my-6">
                <img src="${src}"${altAttr}${titleAttr} class="max-w-full h-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            </div>`;
        };
        
        renderer.blockquote = function(quote: string) {
            // Check for GitHub-style alerts: > [!NOTE], > [!TIP], etc.
            const alertMatch = quote.match(/^\[!(\w+)\]\s*\n(.*)/s);
            if (alertMatch) {
                const alertType = alertType.toLowerCase();
                const content = alertMatch[2].trim();
                
                // Parse title and content
                const lines = content.split('\n');
                const title = lines[0].trim();
                const body = lines.slice(1).join('\n').trim();
                
                const icons = {
                    note: 'fas fa-info-circle',
                    tip: 'fas fa-lightbulb',
                    important: 'fas fa-exclamation-triangle',
                    warning: 'fas fa-exclamation-triangle',
                    caution: 'fas fa-skull-crossbones'
                };
                
                const icon = icons[alertType as keyof typeof icons] || 'fas fa-info-circle';
                
                return `<div class="markdown-alert markdown-alert-${alertType}" dir="auto">
                    <p class="markdown-alert-title" dir="auto">
                        <i class="${icon} mr-2"></i>
                        ${title}
                    </p>
                    <p dir="auto">${body}</p>
                </div>`;
            }
            
            return originalBlockquote(quote);
        };
        
        marked.setOptions({
            renderer: renderer,
            gfm: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false
        });
    }

    public loadPosts(contentDir: string = 'content'): Post[] {
        try {
            if (!fs.existsSync(contentDir)) {
                fs.mkdirSync(contentDir, { recursive: true });
                return [];
            }

            const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
            this.posts = files.map(file => {
                const filePath = path.join(contentDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const { data: frontmatter, content: markdown } = matter(content);
                
                // Calculate reading time (average 200 words per minute)
                const wordCount = markdown.split(/\s+/).length;
                const readingTime = Math.ceil(wordCount / 200);
                
                // Generate slug from filename
                const slug = path.basename(file, '.md');
                
                // Generate excerpt from frontmatter or first paragraph
                let excerpt = frontmatter.excerpt || '';
                if (!excerpt) {
                    const firstParagraph = markdown.split('\n\n')[0];
                    excerpt = firstParagraph.replace(/[#*`]/g, '').substring(0, 160);
                    if (excerpt.length === 160) {
                        excerpt += '...';
                    }
                }
                
                return {
                    title: frontmatter.title || 'Untitled',
                    date: frontmatter.date || new Date().toISOString(),
                    excerpt,
                    slug,
                    readingTime,
                    wordCount,
                    content: markdown,
                    html: marked(markdown),
                    tags: frontmatter.tags || [],
                    categories: frontmatter.categories || [],
                    image: frontmatter.image,
                    ...frontmatter
                };
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            console.log(`📝 Loaded ${this.posts.length} posts`);
            return this.posts;
        } catch (error) {
            console.error('Error loading posts:', error);
            return [];
        }
    }

    public getPosts(): Post[] {
        return this.posts;
    }

    public getPostBySlug(slug: string): Post | undefined {
        return this.posts.find(post => post.slug === slug);
    }

    public getPostsByCategory(category: string): Post[] {
        return this.posts.filter(post => 
            post.categories && post.categories.includes(category)
        );
    }


    public getCategories(): { [category: string]: Post[] } {
        const categories: { [category: string]: Post[] } = {};
        
        this.posts.forEach(post => {
            if (post.categories && post.categories.length > 0) {
                post.categories.forEach(category => {
                    if (!categories[category]) {
                        categories[category] = [];
                    }
                    categories[category].push(post);
                });
            }
        });
        
        return categories;
    }


    public getPostsByYear(): Array<{year: string, posts: Post[]}> {
        const postsByYear: { [year: string]: Post[] } = {};

        this.posts.forEach(post => {
            if (!post || !post.slug || !post.date) {
                console.warn(`Post ${post?.slug || 'unknown'} missing required data, skipping from archive`);
                return;
            }

            try {
                const date = new Date(post.date);
                const year = date.getFullYear().toString();

                if (!postsByYear[year]) {
                    postsByYear[year] = [];
                }
                postsByYear[year].push(post);
            } catch (error) {
                console.warn(`Error processing post ${post.slug}:`, error);
            }
        });

        // Convert to array and sort by year (newest first)
        const yearArray = Object.keys(postsByYear).map(year => ({
            year,
            posts: postsByYear[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).sort((a, b) => parseInt(b.year) - parseInt(a.year));

        return yearArray;
    }
}

