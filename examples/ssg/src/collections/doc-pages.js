/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Documentation pages collection - Dataset container with path-based keys
 */

import { Dataset } from "@raven-js/cortex/structures";

/**
 * @typedef {Object} DocPage
 * @property {string[]} path - Documentation path segments
 * @property {string} title - Documentation page title
 * @property {string} description - Documentation page description
 * @property {string} content - Documentation page content
 * @property {string} [section] - Documentation section
 */

/**
 * Documentation pages data collection with O(1) path-based lookups
 * @type {Dataset<DocPage>}
 */
export const docPages = new Dataset(
	[
		{
			path: ["installation"],
			title: "Installation Guide",
			description: "Get RavenJS up and running in minutes",
			section: "Getting Started",
			content: `
# Installation Guide

Install RavenJS packages individually based on your needs.

## Core Packages

\`\`\`bash
npm install @raven-js/beak    # Templates
npm install @raven-js/wings   # Routing
npm install @raven-js/fledge  # Build system
npm install @raven-js/reflex  # Reactivity
\`\`\`

## Quick Setup

1. Initialize your project
2. Create \`src/pages/\` directory
3. Add \`raven.config.js\`
4. Start building

**Zero dependencies, maximum control.**
		`.trim(),
		},
		{
			path: ["getting-started", "first-project"],
			title: "Your First RavenJS Project",
			description: "Build your first static site with RavenJS",
			section: "Getting Started",
			content: `
# Your First RavenJS Project

Create a **Content As Code** static site in 5 minutes.

## Project Structure

\`\`\`
my-site/
├── src/
│   ├── pages/
│   │   └── index.js
│   └── components/
│       └── layout.js
├── public/
│   └── styles.css
└── raven.config.js
\`\`\`

## Create Your First Page

Export title, description, and body from any page:

\`\`\`javascript
export const title = "Welcome";
export const description = "My first RavenJS site";
export const body = md\`# Hello, World!\`;
\`\`\`

**Surgical simplicity meets infinite flexibility.**
		`.trim(),
		},
		{
			path: ["api", "routing"],
			title: "Routing API Reference",
			description: "Complete Wings router API documentation",
			section: "API Reference",
			content: `
# Routing API Reference

Master the **Wings** router for isomorphic routing.

## Route Patterns

- \`/static\` - Static route
- \`/:param\` - Dynamic parameter
- \`/*path\` - Catch-all wildcard
- \`/api/:id/edit\` - Mixed patterns

## Context Object

\`\`\`javascript
router.get('/blog/:slug', (ctx) => {
  const { slug } = ctx.pathParams;
  const post = findPost(slug);
  ctx.html(renderPost(post));
});
\`\`\`

## Methods

- \`ctx.pathParams\` - URL parameters
- \`ctx.query\` - Query string
- \`ctx.html()\` - Send HTML response
- \`ctx.json()\` - Send JSON response

**Trie-based matching for surgical performance.**
		`.trim(),
		},
		{
			path: ["guides", "deployment", "cloudflare"],
			title: "Deploy to Cloudflare Pages",
			description: "Deploy your RavenJS site to Cloudflare Pages",
			section: "Deployment Guides",
			content: `
# Deploy to Cloudflare Pages

Deploy your **static site** to Cloudflare's global edge network.

## Build Configuration

\`\`\`javascript
// raven.config.js
export const build = {
  output: "./dist",
  assets: "./public",
  // ... routes
};
\`\`\`

## Deployment Steps

1. Build your site: \`npm run build\`
2. Connect GitHub repository
3. Set build command: \`npm run build\`
4. Set output directory: \`dist\`
5. Deploy automatically on push

## Performance Benefits

- **Global CDN** - Sub-100ms response times
- **HTTP/3** - Latest protocol support
- **Brotli compression** - Smaller payloads
- **Edge caching** - Zero cold starts

**Ravens soar on the edge.**
		`.trim(),
		},
	],
	{
		keyFn: (page) => page.path.join("/"),
		urlFn: (page) => `/docs/${page.path.join("/")}`,
	},
);

/**
 * Find documentation page by path array (O(1) lookup)
 * @param {string[]} pathArray - Path segments array
 * @returns {DocPage|undefined} Doc page or undefined if not found
 */
export const findDocPage = (pathArray) => {
	return docPages.get(pathArray.join("/"));
};

/**
 * Find documentation page by path string (O(1) lookup)
 * @param {string} pathString - Path string (e.g., "guides/deployment/cloudflare")
 * @returns {DocPage|undefined} Doc page or undefined if not found
 */
export const findDocPageByPath = (pathString) => {
	const normalizedPath = pathString.split("/").filter(Boolean).join("/");
	return docPages.get(normalizedPath);
};

/**
 * Get all documentation URLs for static generation
 * @returns {string[]} Array of documentation URLs
 */
export const getDocUrls = () => {
	return docPages.urls();
};

/**
 * Get pages by section
 * @param {string} section - Section name
 * @returns {DocPage[]} Array of pages in section
 */
export const getPagesBySection = (section) => {
	return docPages.match({ section });
};
