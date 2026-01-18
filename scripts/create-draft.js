#!/usr/bin/env node

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get title from command line arguments
const title = process.argv[2];

if (!title) {
	console.error('Error: Please provide a title for the draft post.');
	console.error('Usage: npm run draft "Your Post Title"');
	process.exit(1);
}

// Generate slug from title
function slugify(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

const slug = slugify(title);
const today = new Date().toISOString().split('T')[0];
const filePath = join(__dirname, '..', 'src', 'content', 'blog', `${slug}.md`);

// Template for draft post
const template = `---
title: "${title}"
description: ""
pubDate: "${today}"
updatedDate: "${today}"
draft: true
category: ""
tags: []
excerpt: ""
keywords: []
---

Write your content here...
`;

try {
	await writeFile(filePath, template, 'utf-8');
	console.log(`✅ Draft post created: ${filePath}`);
	console.log(`📝 Edit the file to add your content.`);
} catch (error) {
	console.error('Error creating draft post:', error.message);
	process.exit(1);
}
