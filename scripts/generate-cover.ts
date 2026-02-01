import OpenAI from "openai";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { resolve, basename, extname, relative } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dotenv from "dotenv";
import matter from "gray-matter";

// Load environment variables from .env file
dotenv.config();

interface ThemeAndContext {
    theme: string;
    context: string;
}

interface CliArguments {
    post: string;
    apiKey?: string;
}

const SYSTEM_PROMPT = `You are an expert in Agentic AI, prompt engineering, and editorial image visualization.
Your task is to analyze written content and extract two specific elements:

1. CONTENT_THEME - The core conceptual idea of the post (examples: Human–AI collaboration, Learning through uncertainty, Ethical reflection in technology, Creative problem-solving)

2. SCENE_CONTEXT - A visual situation that metaphorically expresses the theme using symbolic environments (light, space, motion, abstraction). Avoid literal depictions of tools, screens, interfaces, or text.

You must respond ONLY with a valid JSON object in this exact format:
{
  "theme": "the core conceptual theme",
  "context": "a detailed visual scene description that metaphorically represents the theme"
}

Do not add any other text, explanation, or commentary. Only output the JSON.`;

/**
 * Extract theme and context from a blog post using OpenAI's chat completions
 */
async function extractThemeAndContext(
    postPath: string,
    openai: OpenAI
): Promise<ThemeAndContext> {
    console.log(`📖 Reading blog post from: ${postPath}`);
    
    if (!existsSync(postPath)) {
        throw new Error(`Blog post not found at path: ${postPath}`);
    }

    const fileContent = await readFile(postPath, "utf-8");
    
    console.log("🤔 Analyzing content with OpenAI...");
    
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: `Analyze this blog post and extract the theme and scene context:\n\n${fileContent}`
            }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
        throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(responseContent) as ThemeAndContext;
    
    console.log(`✅ Theme extracted: ${parsed.theme}`);
    console.log(`✅ Context extracted: ${parsed.context.substring(0, 100)}...`);
    
    return parsed;
}

/**
 * Generate the image prompt using the template
 */
function generateImagePrompt(theme: string, context: string): string {
    return `A soft painterly illustration in a modern editorial style, abstract and intellectual in tone, with a subtle human presence.

The image explores ${theme}, represented through symbolic visual metaphors rather than literal elements. A stylized human figure is present but non-realistic, simplified, and painterly — suggesting reflection, collaboration, or learning rather than depicting a specific person.

${context}

Primary color accent is teal (#06b6d4), harmonized with muted neutral tones (soft grays, off-whites, desaturated blues). The teal appears naturally as light, atmosphere, or a focal visual element.

Composition is wide and balanced, suitable for a blog featured image. The background is abstract and minimal, with depth created through color and texture rather than detail.

No text, no writing, no code, no symbols resembling letters or numbers. No realistic humans. No violence. No UI elements.

Mood: thoughtful, human-centric, quietly intelligent.
Style: painterly editorial illustration, soft lighting, handcrafted feel.`;
}

/**
 * Update blog post frontmatter with heroImage property
 */
async function updatePostFrontmatter(
    postPath: string,
    imagePath: string
): Promise<void> {
    console.log("📝 Updating blog post frontmatter...");
    
    // Read the blog post
    const fileContent = await readFile(postPath, "utf-8");
    
    // Parse frontmatter
    const parsed = matter(fileContent);
    
    // Calculate relative path from blog post to image
    // Blog posts are in src/content/blog/
    // Images are in src/assets/
    // Relative path should be ../../assets/filename.webp
    const imageFilename = basename(imagePath);
    const heroImagePath = `../../assets/${imageFilename}`;
    
    // Check if heroImage already exists
    const hadHeroImage = !!parsed.data.heroImage;
    const oldHeroImage = parsed.data.heroImage;
    
    // Update frontmatter with heroImage
    parsed.data.heroImage = heroImagePath;
    
    // Stringify back to markdown with updated frontmatter
    const updatedContent = matter.stringify(parsed.content, parsed.data);
    
    // Write back to file
    await writeFile(postPath, updatedContent, "utf-8");
    
    if (hadHeroImage && oldHeroImage !== heroImagePath) {
        console.log(`✅ Updated heroImage: ${oldHeroImage} → ${heroImagePath}`);
    } else if (hadHeroImage) {
        console.log(`ℹ️  heroImage already set to: ${heroImagePath}`);
    } else {
        console.log(`✅ Added heroImage: ${heroImagePath}`);
    }
}

/**
 * Generate cover image using GPT Image and save it
 */
async function generateAndSaveImage(
    prompt: string,
    openai: OpenAI,
    postPath: string
): Promise<string> {
    console.log("🎨 Generating cover image with GPT Image...");
    
    const response = await openai.images.generate({
        model: "gpt-image-1.5",
        prompt: prompt,
        n: 1,
        size: "1536x1024",
        quality: "high",
        output_format: "webp",
        output_compression: 90
    });

    if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from GPT Image");
    }

    const imageData = response.data[0]?.b64_json;
    if (!imageData) {
        throw new Error("No image data returned from GPT Image");
    }

    console.log("✅ Image generated successfully");
    
    // Decode base64 image (GPT Image always returns base64)
    const imageBuffer = Buffer.from(imageData, "base64");
    
    // Determine output filename based on blog post name
    const postBasename = basename(postPath, extname(postPath));
    const assetsDir = resolve(process.cwd(), "src/assets");
    
    // Ensure assets directory exists
    if (!existsSync(assetsDir)) {
        await mkdir(assetsDir, { recursive: true });
    }
    
    // GPT Image generates WebP format for better web performance
    const outputPath = resolve(assetsDir, `${postBasename}-cover.webp`);
    
    await writeFile(outputPath, imageBuffer);
    
    console.log(`✅ Cover image saved to: ${outputPath}`);
    
    return outputPath;
}

/**
 * Main function
 */
async function main(): Promise<void> {
    // Parse CLI arguments
    const argv = await yargs(hideBin(process.argv))
        .option("post", {
            alias: "p",
            type: "string",
            description: "Path to the blog post markdown file",
            demandOption: true
        })
        .option("api-key", {
            alias: "k",
            type: "string",
            description: "OpenAI API key (or set OPENAI_API_KEY env var)"
        })
        .help()
        .argv as CliArguments;

    // Get API key from CLI argument or environment variable
    const apiKey = argv.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error(
            "OpenAI API Key is required! Either set the OPENAI_API_KEY environment variable or pass it with --api-key"
        );
    }

    const openai = new OpenAI({ apiKey });

    // Resolve the post path
    const postPath = resolve(process.cwd(), argv.post);

    // Extract theme and context from the blog post
    const { theme, context } = await extractThemeAndContext(postPath, openai);

    // Generate the image prompt
    const imagePrompt = generateImagePrompt(theme, context);
    console.log("\n📝 Generated image prompt:");
    console.log("─".repeat(80));
    console.log(imagePrompt);
    console.log("─".repeat(80) + "\n");

    // Generate and save the cover image
    const savedPath = await generateAndSaveImage(imagePrompt, openai, postPath);

    // Update the blog post frontmatter with heroImage property
    await updatePostFrontmatter(postPath, savedPath);

    console.log("\n🎉 Success! Cover image generation complete.");
    console.log(`   Image saved at: ${savedPath}`);
    console.log(`   Blog post updated: ${postPath}`);
}

main()
    .then(() => {
        console.info("\n✨ Cover generation script completed successfully.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ An error occurred during cover generation:");
        console.error(error);
        process.exit(1);
    });