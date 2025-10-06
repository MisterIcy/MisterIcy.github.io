import express, {Request, Response} from 'express'
import chokidar from 'chokidar'
import Handlebars from 'handlebars'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import yaml from 'js-yaml'

// Load site configuration
function loadConfig() {
  try {
    const configFile = fs.readFileSync('config.yaml', 'utf8');
    return yaml.load(configFile) as any;
  } catch (error) {
    console.warn('Config file not found, using defaults');
    return {
      site: {
        title: "Production Breaker",
        headline: "Breaking Down Complex Systems",
        description: "A technical blog exploring reverse engineering, assembly language, and system analysis.",
        author: "Your Name",
        url: "https://productionbreaker.com",
        language: "en"
      }
    };
  }
}

const config = loadConfig();

// Configure marked with highlight.js syntax highlighting and GFM support
marked.use(markedHighlight({
    highlight(code: string, lang: string) {
        let highlightedCode: string
        if (lang && hljs.getLanguage(lang)) {
            try {
                highlightedCode = hljs.highlight(code, { language: lang }).value
            } catch (err) {
                console.log('Highlight error:', err)
                highlightedCode = code
            }
        } else {
            highlightedCode = hljs.highlightAuto(code).value

        }
        
        return highlightedCode
    }
}))

// Custom renderer for images with Tailwind classes
const renderer = new marked.Renderer();
renderer.image = function(href: string, title: string | null, text: string) {
    // Convert relative paths to absolute paths for dev server
    // Dev server serves public/ directory at root level, so /images/ not /public/images/
    let src = href;
    if (href.startsWith('./images/')) {
        src = href.replace('./images/', '/images/');
    } else if (href.startsWith('images/')) {
        src = href.replace('images/', '/images/');
    } else if (href.startsWith('/images/')) {
        src = href; // Already correct
    }
    
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    
    return `<div class="flex justify-center my-6">
        <img src="${src}"${altAttr}${titleAttr} class="max-w-full h-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
    </div>`;
};

// Add GFM support (tables, strikethrough, task lists)
marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
    sanitize: true
})

// Override blockquote renderer to handle GitHub alerts
renderer.blockquote = function(quote: string) {
    // Check if this is a GitHub alert using the suggested regex
    const alertMatch = quote.match(/\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/)
    if (alertMatch) {
        const alertType = alertMatch[1].toLowerCase()
        
        // Extract content by removing the [!ALERT_TYPE] part and cleaning up
        const content = quote
            .replace(/\[![^\]]+\]\s*<br>?/g, '') // Remove [!ALERT_TYPE]<br>
            .replace(/<p>|<\/p>/g, '') // Remove <p> tags
            .trim()
        
        // Map alert types to their corresponding classes and icons
        const alertConfig = {
            note: { class: 'markdown-alert-note', icon: 'info-circle' },
            tip: { class: 'markdown-alert-tip', icon: 'lightbulb' },
            important: { class: 'markdown-alert-important', icon: 'exclamation-triangle' },
            warning: { class: 'markdown-alert-warning', icon: 'exclamation-triangle' },
            caution: { class: 'markdown-alert-caution', icon: 'times-circle' }
        }
        
        const config = alertConfig[alertType as keyof typeof alertConfig] || alertConfig.note
        
        // Create the alert HTML structure
        return `<div class="markdown-alert ${config.class}" dir="auto">
            <p class="markdown-alert-title" dir="auto">
                <i class="fas fa-${config.icon} mr-2"></i>
                ${alertType.charAt(0).toUpperCase() + alertType.slice(1)}
            </p>
            <p dir="auto">${content}</p>
        </div>`
    }
    
    // Default blockquote rendering
    return `<blockquote>\n${quote}</blockquote>\n`
}



// Set the custom renderer
marked.use({ renderer })

// Post interface
interface Post {
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

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory cache for content
let posts: Post[] = [];
let template: HandlebarsTemplateDelegate | null = null;
let postTemplate: HandlebarsTemplateDelegate | null = null;
let archiveTemplate: HandlebarsTemplateDelegate | null = null;
let categoriesTemplate: HandlebarsTemplateDelegate | null = null;
let aboutTemplate: HandlebarsTemplateDelegate | null = null;
let compiledCSS: string | null = null;

// Live reload functionality
function broadcastReload() {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({ type: 'reload' }));
        }
    });
}

// Compile CSS with Tailwind
async function compileCSS() {
    try {
        const cssContent = fs.readFileSync('src/styles.css', 'utf-8');
        const result = await postcss([
            tailwindcss,
            autoprefixer
        ]).process(cssContent, {
            from: 'src/styles.css',
            to: 'dist/styles.css'
        });
        
        compiledCSS = result.css;
        console.log('🎨 CSS compiled');
    } catch (error) {
        console.error('CSS compilation error:', error);
        compiledCSS = '/* CSS compilation failed */';
    }
}

// Register partials
function registerPartials() {
    try {
        // Register Handlebars helpers
        Handlebars.registerHelper('formatDate', (date: string) => {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        });
        
        Handlebars.registerHelper('substring', (str: string, start: number, end: number) => {
            return str.substring(start, end);
        });
        
        Handlebars.registerHelper('join', (arr: string[], separator: string) => {
            return arr.join(separator);
        });
        
    Handlebars.registerHelper('concat', (...args: any[]) => {
        // Remove the last argument which is the Handlebars options object
        const strings = args.slice(0, -1);
        return strings.join('');
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => {
        return a === b;
    });
        
        // Note: main layout is now the index.hbs template itself, not a partial
        
        // Register component partials
        const components = [
            'header', 'hero', 'posts-list', 'sidebar', 'footer', 'post-card', 'tags',
            'head', 'meta', 'structured-data', 'scripts'
        ];
        
        components.forEach(component => {
            try {
                const componentContent = fs.readFileSync(`templates/components/${component}.hbs`, 'utf-8');
                Handlebars.registerPartial(component, componentContent);
            } catch (error) {
                console.warn(`Component ${component} not found, skipping...`);
            }
        });
        
        console.log('📝 Partials registered');
    } catch (error) {
        console.error('Partials error:', error);
    }
}

// Load and compile templates
function loadTemplate() {
    try {
        const templateContent = fs.readFileSync('templates/index.hbs', 'utf-8');
        template = Handlebars.compile(templateContent);
        console.log('📝 Index template reloaded');
    } catch (error) {
        console.error('Template error:', error);
        // Fallback template
        template = Handlebars.compile(`
            <!DOCTYPE html>
            <html>
            <head><title>Blog</title></head>
            <body>
                <h1>My Blog</h1>
                {{#each posts}}
                <article>
                    <h2>{{title}}</h2>
                    <p>{{excerpt}}</p>
                    <small>{{date}}</small>
                </article>
                {{/each}}
            </body>
            </html>
        `);
    }
}

// Load and compile post template
function loadPostTemplate() {
    try {
        const postTemplateContent = fs.readFileSync('templates/post.hbs', 'utf-8');
        postTemplate = Handlebars.compile(postTemplateContent);
        console.log('📝 Post template reloaded');
    } catch (error) {
        console.error('Post template error:', error);
        // Fallback post template
        postTemplate = Handlebars.compile(`
            <!DOCTYPE html>
            <html>
            <head><title>{{post.title}}</title></head>
            <body>
                <h1>{{post.title}}</h1>
                <div>{{{post.html}}}</div>
                <p><a href="/">← Back to home</a></p>
            </body>
            </html>
        `);
    }
}

function loadArchiveTemplate() {
    try {
        const archiveTemplateContent = fs.readFileSync('templates/archive.hbs', 'utf-8');
        archiveTemplate = Handlebars.compile(archiveTemplateContent);
        console.log('📝 Archive template reloaded');
    } catch (error) {
        console.error('Archive template error:', error);
        // Fallback archive template
        archiveTemplate = Handlebars.compile(`
            <!DOCTYPE html>
            <html>
            <head><title>Archive</title></head>
            <body>
                <h1>Archive</h1>
                {{#each postsByYear}}
                <h2>{{@key}}</h2>
                {{#each this}}
                <h3>{{@key}}</h3>
                {{#each this}}
                <article>
                    <h4><a href="/posts/{{slug}}">{{title}}</a></h4>
                    <p>{{excerpt}}</p>
                    <small>{{date}}</small>
                </article>
                {{/each}}
                {{/each}}
                {{/each}}
            </body>
            </html>
        `);
    }
}

function loadCategoriesTemplate() {
    try {
        const templateContent = fs.readFileSync('templates/categories.hbs', 'utf-8');
        categoriesTemplate = Handlebars.compile(templateContent);
        console.log('📝 Categories template loaded');
    } catch (error) {
        console.error('Categories template error:', error);
        categoriesTemplate = null;
    }
}


function loadAboutTemplate() {
    try {
        const templateContent = fs.readFileSync('templates/about.hbs', 'utf-8');
        aboutTemplate = Handlebars.compile(templateContent);
        console.log('📝 About template loaded');
    } catch (error) {
        console.error('About template error:', error);
        aboutTemplate = null;
    }
}

// Load markdown posts
function loadPosts() {
    try {
        const contentDir = 'content';
        if (!fs.existsSync(contentDir)) {
            fs.mkdirSync(contentDir, { recursive: true });
            return;
        }

        const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
        posts = files.map(file => {
            const filePath = path.join(contentDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const { data: frontmatter, content: markdown } = matter(content);
            
            // Calculate reading time (average 200 words per minute)
            const wordCount = markdown.split(/\s+/).length;
            const readingTime = Math.max(1, Math.round(wordCount / 200));
            
            // Use frontmatter excerpt or generate fallback
            let excerpt = frontmatter.excerpt;
            if (!excerpt) {
                // Fallback: generate excerpt from content (first 150 characters, clean)
                excerpt = markdown
                    .replace(/#{1,6}\s+/g, '') // Remove headers
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
                    .replace(/`([^`]+)`/g, '$1') // Remove inline code
                    .replace(/\n+/g, ' ') // Replace newlines with spaces
                    .trim()
                    .substring(0, 150);
                
                if (excerpt.length >= 150) {
                    excerpt += '...';
                }
            }
            
            // Generate slug from filename if not provided
            const slug = frontmatter.slug || file.replace('.md', '');
            
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

        console.log(`📝 Loaded ${posts.length} posts`);
        posts.forEach(post => {
            console.log(`  - ${post.title} (${post.slug})`);
        });
    } catch (error) {
        console.error('Posts error:', error);
        posts = [];
    }
}

// Setup file watcher
function setupWatcher() {
    const watcher = chokidar.watch(['content/**/*.md', 'templates/**/*.hbs', 'src/**/*.css'], {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });

    watcher
        .on('change', (filePath) => {
            console.log(`🔄 File changed: ${filePath}`);
            if (filePath.includes('content/')) {
                loadPosts();
            }
            if (filePath.includes('templates/')) {
                registerPartials();
                loadTemplate();
                loadPostTemplate();
                loadArchiveTemplate();
                loadCategoriesTemplate();
                loadAboutTemplate();
            }
            if (filePath.includes('.css')) {
                compileCSS();
            }
            // Trigger live reload for any file change
            broadcastReload();
        })
        .on('add', (filePath) => {
            console.log(`➕ File added: ${filePath}`);
            if (filePath.includes('content/')) {
                loadPosts();
            }
            broadcastReload();
        })
        .on('unlink', (filePath) => {
            console.log(`➖ File removed: ${filePath}`);
            if (filePath.includes('content/')) {
                loadPosts();
            }
            broadcastReload();
        });

    console.log('👀 Watching for changes...');
}

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.get('/styles.css', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/css');
    res.send(compiledCSS || '/* CSS not compiled yet */');
});

app.get('/', (req: Request, res: Response) => {
    if (!template) {
        return res.send('Template not loaded');
    }
    
    // Show only the last 3 posts on home page
    const recentPosts = posts.slice(0, 3);
    
    const html = template({ 
        title: config.site.title,
        headline: config.site.headline,
        description: config.site.description,
        author: config.site.author,
        url: config.site.url,
        language: config.site.language,
        social: config.social,
        posts: recentPosts,
        hasMorePosts: posts.length > 3
    });
    res.send(html);
});

app.get('/posts/:slug', (req: Request, res: Response) => {
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) {
        return res.status(404).send('Post not found');
    }
    
    if (!postTemplate) {
        return res.status(500).send('Post template not loaded');
    }
    
    // Find previous and next posts
    const currentIndex = posts.findIndex(p => p.slug === req.params.slug);
    const previousPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
    const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    
    const html = postTemplate({ 
        title: config.site.title,
        headline: config.site.headline,
        description: config.site.description,
        author: config.site.author,
        url: config.site.url,
        language: config.site.language,
        social: config.social,
        post,
        postUrl: `${config.site.url}/posts/${post.slug}`,
        postImage: post.image || `${config.site.url}/og-image.jpg`,
        articleSection: post.categories ? post.categories.join(', ') : 'Technology',
        previousPost,
        nextPost
    });
    res.send(html);
});

// Archive route
app.get('/archive', (req: Request, res: Response) => {
    if (!archiveTemplate) {
        return res.send('Archive template not loaded');
    }
    
    // Organize posts by year
    const postsByYear: { [year: string]: Post[] } = {};
    
    console.log(`Processing ${posts.length} posts for archive`);
    console.log('Posts data:', posts.map(p => ({ slug: p?.slug, date: p?.date, title: p?.title })));
    
    posts.forEach(post => {
        // Skip posts that are null/undefined or missing required properties
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
    const sortedPostsByYear = Object.keys(postsByYear).map(year => ({
        year,
        posts: postsByYear[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })).sort((a, b) => parseInt(b.year) - parseInt(a.year));
    
    const html = archiveTemplate({ 
        title: `Archive - ${config.site.title}`,
        headline: config.site.headline,
        description: config.site.description,
        author: config.site.author,
        url: config.site.url,
        language: config.site.language,
        social: config.social,
        postsByYear: sortedPostsByYear,
        isArchive: true,
        archiveUrl: `${config.site.url}/archive`
    });
    res.send(html);
});

// Categories route
app.get('/categories', (req: Request, res: Response) => {
    if (!categoriesTemplate) {
        return res.send('Categories template not loaded');
    }
    
    // Organize posts by category
    const categoriesByCount: { [category: string]: Post[] } = {};
    
    posts.forEach(post => {
        if (post.categories && post.categories.length > 0) {
            post.categories.forEach(category => {
                if (!categoriesByCount[category]) {
                    categoriesByCount[category] = [];
                }
                categoriesByCount[category].push(post);
            });
        }
    });
    
    const html = categoriesTemplate({
        title: config.site.title,
        headline: config.site.headline,
        description: config.site.description,
        author: config.site.author,
        url: config.site.url,
        language: config.site.language,
        social: config.social,
        categoriesByCount,
        categoriesUrl: `${config.site.url}/categories`
    });
    res.send(html);
});


app.get('/about', (req: Request, res: Response) => {
    if (!aboutTemplate) {
        return res.send('About template not loaded');
    }
    
    const html = aboutTemplate({
        title: config.site.title,
        headline: config.site.headline,
        description: config.site.description,
        author: config.site.author,
        url: config.site.url,
        language: config.site.language,
        social: config.social
    });
    res.send(html);
});

// Initialize
async function initialize() {
    registerPartials();
    loadTemplate();
    loadPostTemplate();
    loadArchiveTemplate();
    loadCategoriesTemplate();
    loadAboutTemplate();
    loadPosts();
    await compileCSS();
    setupWatcher();
}

initialize();

server.listen(3000, () => {
    console.log('🚀 Server started at http://localhost:3000');
    console.log('📁 Watching: content/, templates/, and src/');
    console.log('🔄 Live reload enabled');
})