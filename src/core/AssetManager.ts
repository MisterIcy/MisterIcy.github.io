import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export class AssetManager {
    private compiledCSS: string | null = null;

    public async compileCSS(): Promise<string> {
        try {
            // Read the custom CSS file (same as dev server)
            const cssContent = fs.readFileSync('src/styles.css', 'utf-8');
            
            const result = await postcss([
                tailwindcss,
                autoprefixer
            ]).process(cssContent, {
                from: 'src/styles.css',
                to: 'dist/styles.css'
            });

            this.compiledCSS = result.css;
            console.log('🎨 CSS compiled successfully');
            return this.compiledCSS;
        } catch (error) {
            console.error('Error compiling CSS:', error);
            throw error;
        }
    }

    public getCompiledCSS(): string | null {
        return this.compiledCSS;
    }


    public async copyAssets(sourceDir: string, destDir: string): Promise<void> {
        try {
            // Ensure destination directory exists
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Copy CSS file
            if (this.compiledCSS) {
                const cssPath = path.join(destDir, 'styles.css');
                fs.writeFileSync(cssPath, this.compiledCSS);
                console.log('📄 CSS copied to dist/styles.css');
            }


            // Copy manifest.json to root
            const manifestPath = path.join(sourceDir, 'public', 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const destManifestPath = path.join(destDir, 'manifest.json');
                fs.copyFileSync(manifestPath, destManifestPath);
                console.log('📄 Manifest copied to dist/manifest.json');
            }

            // Copy PWA icons to root
            const iconFiles = ['192-192.png', '512-512.png', '48-48.png'];
            for (const iconFile of iconFiles) {
                const iconPath = path.join(sourceDir, 'public', iconFile);
                if (fs.existsSync(iconPath)) {
                    const destIconPath = path.join(destDir, iconFile);
                    fs.copyFileSync(iconPath, destIconPath);
                    console.log(`📄 Icon copied to dist/${iconFile}`);
                }
            }

            // Copy PWA screenshots to root
            const screenshotFiles = ['screenshot-desktop.png', 'screenshot-mobile.png'];
            for (const screenshotFile of screenshotFiles) {
                const screenshotPath = path.join(sourceDir, 'public', screenshotFile);
                if (fs.existsSync(screenshotPath)) {
                    const destScreenshotPath = path.join(destDir, screenshotFile);
                    fs.copyFileSync(screenshotPath, destScreenshotPath);
                    console.log(`📄 Screenshot copied to dist/${screenshotFile}`);
                }
            }

            // Copy other static assets if they exist
            const staticDirs = ['public', 'assets', 'images'];
            
            for (const dir of staticDirs) {
                if (fs.existsSync(dir)) {
                    const destPath = path.join(destDir, dir);
                    this.copyDirectory(dir, destPath);
                    console.log(`📁 Copied ${dir} to dist/`);
                }
            }

            // Copy any additional files from root that might be needed
            const rootFiles = ['favicon.ico', 'robots.txt', 'sitemap.xml'];
            
            for (const file of rootFiles) {
                if (fs.existsSync(file)) {
                    const destPath = path.join(destDir, file);
                    fs.copyFileSync(file, destPath);
                    console.log(`📄 Copied ${file} to dist/`);
                }
            }

        } catch (error) {
            console.error('Error copying assets:', error);
            throw error;
        }
    }

    private copyDirectory(src: string, dest: string): void {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    public generateSitemap(posts: any[], baseUrl: string): string {
        const urls = [
            { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
            { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.8' },
            { loc: `${baseUrl}/archive`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${baseUrl}/categories`, changefreq: 'weekly', priority: '0.7' },
        ];

        // Add post URLs
        posts.forEach(post => {
            urls.push({
                loc: `${baseUrl}/posts/${post.slug}`,
                changefreq: 'monthly',
                priority: '0.6'
            });
        });


        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        return sitemap;
    }

    public generateRobotsTxt(baseUrl: string): string {
        return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
    }
}
