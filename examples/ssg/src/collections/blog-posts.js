/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Blog posts collection - Dataset container with O(1) lookups
 */

import { Dataset } from "../../../../packages/cortex/structures/dataset.js";

/**
 * @typedef {Object} BlogPost
 * @property {string} slug - Blog post slug
 * @property {string} title - Blog post title
 * @property {string} description - Blog post description
 * @property {string} publishDate - Publication date
 * @property {string[]} tags - Blog post tags
 * @property {string} content - Blog post content
 */

/**
 * Blog posts data collection with O(1) slug-based lookups
 * @type {Dataset<BlogPost>}
 */
export const blogPosts = new Dataset(
  [
    {
      slug: "getting-started",
      title: "Getting Started with RavenJS SSG",
      description: "Learn how to build static sites with Content As Code",
      publishDate: "2024-01-15",
      tags: ["tutorial", "getting-started"],
      content: `
# Getting Started with RavenJS SSG

Welcome to the **Content As Code** approach to static site generation.

## Why RavenJS?

- **Zero dependencies** - No supply chain vulnerabilities
- **Native JavaScript** - Leverage platform features directly
- **Surgical precision** - Minimal, focused solutions
- **Evolution path** - Static → Interactive → Dynamic → Full-stack

## Quick Start

1. Create content as JavaScript modules
2. Export title, description, body
3. Import and compose with Beak templates
4. Build with Fledge

**Ravens build what conquers.**
		`.trim(),
    },
    {
      slug: "advanced-routing",
      title: "Advanced Routing Patterns",
      description: "Dynamic routes, catch-all patterns, and nested parameters",
      publishDate: "2024-01-20",
      tags: ["routing", "advanced"],
      content: `
# Advanced Routing Patterns

Master **file-based routing** with dynamic segments and catch-all patterns.

## Dynamic Segments

- \`[slug]\` → \`:slug\` parameter
- \`[category]/[item]\` → \`:category/:item\` parameters
- \`[...path]\` → \`*path\` catch-all

## Use Cases

Perfect for:
- **Blog posts** with slugs
- **E-commerce** with categories/items
- **Documentation** with nested paths
- **File browsers** with arbitrary depth

**Algorithm over patches** - let the filesystem define your routes.
		`.trim(),
    },
    {
      slug: "performance-optimization",
      title: "Performance Optimization Tips",
      description: "Make your static site blazingly fast",
      publishDate: "2024-01-25",
      tags: ["performance", "optimization"],
      content: `
# Performance Optimization Tips

Achieve **surgical performance** with zero-dependency optimization.

## Core Principles

1. **Elimination first** - Remove unused code
2. **Measurement discipline** - Baseline → Delta → Verify
3. **Platform mastery** - Leverage V8 optimizations
4. **Minimization** - Less code = faster execution

## Techniques

- Static generation eliminates server overhead
- Beak templates compile to minimal HTML
- Wings router uses efficient trie matching
- Reflex signals minimize DOM updates

**Performance is a feature, not an afterthought.**
		`.trim(),
    },
  ],
  {
    keyFn: (post) => post.slug,
    urlFn: (post) => `/blog/${post.slug}`,
  },
);

/**
 * Find blog post by slug (O(1) lookup)
 * @param {string} slug - Post slug
 * @returns {BlogPost|undefined} Blog post or undefined if not found
 */
export const findBlogPost = (slug) => {
  return blogPosts.get(slug);
};

/**
 * Get all blog post URLs for static generation
 * @returns {string[]} Array of blog post URLs
 */
export const getBlogUrls = () => {
  return blogPosts.urls();
};
