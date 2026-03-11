---
name: document-style-guide
description: Applies the project writing style guide (Koutroulis Engine voice) when editing or creating blog posts and long-form documents. Use when the user asks to edit documents with their style, polish or rewrite to match the blog voice, or when edits must preserve Alexandros Koutroulis's voice and document structure.
---

# Document Style Guide (Apply When Editing)

When editing or creating content for this repository's blog (or when the user asks for style-guided edits), apply the project's writing standards and document mechanics.

## 1. Apply the project rule

The canonical style guide is **`.cursor/rules/style-guide.mdc`** (Writing Voice: Alexandros Koutroulis / Koutroulis Engine). When editing files under `src/content/blog/**/*.{md,mdx}`, that rule is attached automatically. If editing from another context or the user asked for "style guide" or "my voice":

- Read or recall the style-guide rule.
- Follow **Document mechanics** (frontmatter, paths, no schema breaks).
- Match **Binary Rhythm**, **No Throat-Clearing**, **Metal vs Gut**, **Punctuation**, **Character**, **DOs/DON'Ts**, and **Negative Constraints**.

## 2. Document mechanics (non-negotiable)

- **Path:** Blog content only in `src/content/blog/`. Do not suggest moving or creating posts elsewhere.
- **Frontmatter:** Keep required `title`, `description`, `pubDate`. Optional: `updatedDate`, `heroImage`, `author`, `tags`, `category`, `excerpt`, `keywords`, `draft: true`. ISO dates. Do not remove or rename schema fields.
- **Assets:** Image paths like `../../assets/name.webp`; keep them valid.

## 3. Voice in one sentence (Koutroulis Engine)

Technical rigor and kernel-level precision; words like CPU cycles. Land first (opcode), explain second (commentary). No throat-clearing. The Metal (precise tech terms) vs The Gut (soul, tribe, fear). Bold for weight; em-dash for pivots; Balkan pivot after blunt truth. Tribe Protector, Technical Judo, Balkan Dad. Confident but vulnerable; dry humor from specificity; integrity over alignment. Never passive voice, hedging, or corporate mush.

## 4. Polish vs full rewrite

- **Polish:** Apply `.cursor/rules/polish-post.mdc`—proofread, fix grammar, improve flow, preserve voice (no hedging, no passive, opcode/commentary).
- **Rewrite or expand:** Prioritize the style-guide rule so new text matches Koutroulis Engine voice and implementation guidelines.

## 5. Drafts and outlines

Some posts use a **kernel + beats** outline (one kernel sentence, sections like "Structure", "References"). When expanding or editing such drafts, preserve the outlined structure and fill in prose that matches the style guide; do not remove the scaffolding unless the user asks.
