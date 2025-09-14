/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Homepage - simple hello world page
 */

import { md } from "@raven-js/beak/md";

/**
 * Homepage title
 */
export const title = "RavenJS - Swift Web Development Toolkit";

/**
 * Homepage description
 */
export const description =
  "RavenJS is a swift web development toolkit - a set of libraries and tools that are versatile and useful standalone.";

/**
 * Homepage content
 */
export const body = md`
# Hello World

Welcome to **RavenJS** - the swift web development toolkit!

This is a simple hello world page demonstrating the RavenJS homepage setup with:

- ✅ File-based routing via Wings
- ✅ Markdown content via Beak
- ✅ Islands hydration via Reflex
- ✅ Static site generation via Fledge
- ✅ Zero-config development server

**RavenJS** is not a framework - it's a toolkit of standalone libraries that work together seamlessly.
`;
