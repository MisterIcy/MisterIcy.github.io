import fs from 'fs';
import path from 'path';
import { ContentProcessor, Post } from './ContentProcessor';
import { TemplateEngine, TemplateData } from './TemplateEngine';
import { AssetManager } from './AssetManager';
import yaml from 'js-yaml';

export interface BuildConfig {
    site: {
        title: string;
        headline: string;
        description: string;
        author: string;
        url: string;
        language: string;
    };
    social?: {
        github?: string;
        linkedin?: string;
    };
}

export class StaticBuilder {
    private contentProcessor: ContentProcessor;
    private templateEngine: TemplateEngine;
    private assetManager: AssetManager;
    private config: BuildConfig;
    private outputDir: string;

    constructor(outputDir: string = 'dist') {
        this.contentProcessor = new ContentProcessor();
        this.templateEngine = new TemplateEngine();
        this.assetManager = new AssetManager();
        this.outputDir = outputDir;
        this.config = this.loadConfig();
    }

    private loadConfig(): BuildConfig {
        try {
            const configFile = fs.readFileSync('config.yaml', 'utf8');
            return yaml.load(configFile) as BuildConfig;
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

    public async build(): Promise<void> {
        console.log('🚀 Starting static site build...');
        
        try {
            // Step 1: Load and process content
            console.log('📝 Loading content...');
            const posts = this.contentProcessor.loadPosts();
            
            // Step 2: Compile CSS
            console.log('🎨 Compiling CSS...');
            await this.assetManager.compileCSS();
            
            // Step 3: Register templates and partials
            console.log('📄 Loading templates...');
            this.templateEngine.registerPartials();
            this.templateEngine.loadAllTemplates();
            
            // Step 4: Create output directory
            if (fs.existsSync(this.outputDir)) {
                fs.rmSync(this.outputDir, { recursive: true });
            }
            fs.mkdirSync(this.outputDir, { recursive: true });
            
            // Step 5: Generate all pages
            console.log('📄 Generating pages...');
            await this.generateAllPages(posts);
            
            // Step 6: Copy assets
            console.log('📁 Copying assets...');
            await this.assetManager.copyAssets('.', this.outputDir);
            
            // Step 7: Generate sitemap and robots.txt
            console.log('🗺️ Generating sitemap...');
            this.generateSitemapAndRobots(posts);
            
            console.log('✅ Static site build completed successfully!');
            console.log(`📁 Output directory: ${this.outputDir}`);
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            throw error;
        }
    }

    private async generateAllPages(posts: Post[]): Promise<void> {
        // Generate home page
        await this.generateHomePage(posts);
        
        // Generate individual post pages
        await this.generatePostPages(posts);
        
        // Generate archive page
        await this.generateArchivePage(posts);
        
        // Generate categories page
        await this.generateCategoriesPage(posts);
        
        
        // Generate about page
        await this.generateAboutPage();
    }

    private async generateHomePage(posts: Post[]): Promise<void> {
        const recentPosts = posts.slice(0, 3);
        const hasMorePosts = posts.length > 3;
        
        // Generate keywords from posts
        const allTags = posts.flatMap(post => post.tags || []);
        const uniqueTags = [...new Set(allTags)];
        const keywords = uniqueTags.slice(0, 10).join(', ');
        
        const data: TemplateData = {
            title: this.config.site.title,
            headline: this.config.site.headline,
            description: this.config.site.description,
            author: this.config.site.author,
            url: this.config.site.url,
            language: this.config.site.language,
            social: this.config.social,
            posts: recentPosts,
            hasMorePosts,
            keywords,
            canonicalUrl: this.config.site.url
        };

        const html = this.templateEngine.render('index', data);
        this.writeFile('index.html', html);
    }

    private async generatePostPages(posts: Post[]): Promise<void> {
        for (const post of posts) {
            const currentIndex = posts.findIndex(p => p.slug === post.slug);
            const previousPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
            const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
            
            const data: TemplateData = {
                title: this.config.site.title,
                headline: this.config.site.headline,
                description: this.config.site.description,
                author: this.config.site.author,
                url: this.config.site.url,
                language: this.config.site.language,
                social: this.config.social,
                post,
                postUrl: `${this.config.site.url}/posts/${post.slug}`,
                postImage: post.image || `${this.config.site.url}/og-image.jpg`,
                articleSection: post.categories ? post.categories.join(', ') : 'Technology',
                previousPost,
                nextPost,
                keywords: post.tags ? post.tags.join(', ') : '',
                canonicalUrl: `${this.config.site.url}/posts/${post.slug}`
            };

            const html = this.templateEngine.render('post', data);
            const postDir = path.join('posts', post.slug);
            this.writeFile(path.join(postDir, 'index.html'), html);
        }
    }

    private async generateArchivePage(posts: Post[]): Promise<void> {
        const postsByYear = this.contentProcessor.getPostsByYear();
        
        const data: TemplateData = {
            title: `Archive - ${this.config.site.title}`,
            headline: this.config.site.headline,
            description: this.config.site.description,
            author: this.config.site.author,
            url: this.config.site.url,
            language: this.config.site.language,
            social: this.config.social,
            postsByYear,
            isArchive: true,
            archiveUrl: `${this.config.site.url}/archive`,
            keywords: 'archive, blog posts, articles, technology, programming',
            canonicalUrl: `${this.config.site.url}/archive`
        };

        const html = this.templateEngine.render('archive', data);
        this.writeFile('archive/index.html', html);
    }

    private async generateCategoriesPage(posts: Post[]): Promise<void> {
        const categoriesByCount = this.contentProcessor.getCategories();
        
        const data: TemplateData = {
            title: this.config.site.title,
            headline: this.config.site.headline,
            description: this.config.site.description,
            author: this.config.site.author,
            url: this.config.site.url,
            language: this.config.site.language,
            social: this.config.social,
            categoriesByCount,
            categoriesUrl: `${this.config.site.url}/categories`,
            keywords: 'categories, blog categories, technology topics, programming topics',
            canonicalUrl: `${this.config.site.url}/categories`
        };

        const html = this.templateEngine.render('categories', data);
        this.writeFile('categories/index.html', html);
    }


    private async generateAboutPage(): Promise<void> {
        const data: TemplateData = {
            title: this.config.site.title,
            headline: this.config.site.headline,
            description: this.config.site.description,
            author: this.config.site.author,
            url: this.config.site.url,
            language: this.config.site.language,
            social: this.config.social,
            keywords: 'about, author, bio, profile, technology, programming, reverse engineering',
            canonicalUrl: `${this.config.site.url}/about`
        };

        const html = this.templateEngine.render('about', data);
        this.writeFile('about/index.html', html);
    }

    private generateSitemapAndRobots(posts: Post[]): void {
        const sitemap = this.assetManager.generateSitemap(posts, this.config.site.url);
        this.writeFile('sitemap.xml', sitemap);
        
        const robotsTxt = this.assetManager.generateRobotsTxt(this.config.site.url);
        this.writeFile('robots.txt', robotsTxt);
    }

    private writeFile(relativePath: string, content: string): void {
        const fullPath = path.join(this.outputDir, relativePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content);
        console.log(`📄 Generated: ${relativePath}`);
    }
}
