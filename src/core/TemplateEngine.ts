import fs from 'fs';
import Handlebars from 'handlebars';
import { Post } from './ContentProcessor';

export interface TemplateData {
    title: string;
    headline: string;
    description: string;
    author: string;
    url: string;
    language: string;
    social?: any;
    posts?: Post[];
    post?: Post;
    [key: string]: any;
}

export class TemplateEngine {
    private templates: { [key: string]: HandlebarsTemplateDelegate } = {};

    constructor() {
        this.registerHelpers();
    }

    private registerHelpers() {
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
    }

    public registerPartials() {
        try {
            // Register component partials
            const components = [
                'header', 'hero', 'posts-list', 'sidebar', 'footer', 'post-card', 'tags',
                'head', 'meta', 'structured-data', 'scripts'
            ];

            components.forEach(component => {
                try {
                    const componentContent = fs.readFileSync(`templates/components/${component}.hbs`, 'utf-8');
                    Handlebars.registerPartial(component, componentContent);
                    console.log(`📝 Partial ${component} registered`);
                } catch (error) {
                    console.warn(`Component ${component} not found, skipping...`, error);
                }
            });
        } catch (error) {
            console.error('Error registering partials:', error);
        }
    }

    public loadTemplate(templatePath: string, templateName: string): HandlebarsTemplateDelegate | null {
        try {
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const template = Handlebars.compile(templateContent);
            this.templates[templateName] = template;
            console.log(`📄 Template ${templateName} loaded`);
            return template;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            return null;
        }
    }

    public getTemplate(templateName: string): HandlebarsTemplateDelegate | null {
        return this.templates[templateName] || null;
    }

    public render(templateName: string, data: TemplateData): string {
        const template = this.getTemplate(templateName);
        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }
        return template(data);
    }

    public renderTemplate(templatePath: string, data: TemplateData): string {
        try {
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const template = Handlebars.compile(templateContent);
            return template(data);
        } catch (error) {
            console.error(`Error rendering template ${templatePath}:`, error);
            throw error;
        }
    }

    public loadAllTemplates(): void {
        const templateFiles = [
            { path: 'templates/index.hbs', name: 'index' },
            { path: 'templates/post.hbs', name: 'post' },
            { path: 'templates/archive.hbs', name: 'archive' },
            { path: 'templates/categories.hbs', name: 'categories' },
            { path: 'templates/about.hbs', name: 'about' }
        ];

        templateFiles.forEach(({ path, name }) => {
            this.loadTemplate(path, name);
        });
    }
}

