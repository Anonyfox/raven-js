/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RavenJS configuration - defines build and deployment settings
 */

import { Context } from "@raven-js/wings";
import { router } from "./cfg/routes.js";
import { getBlogUrls } from "./src/collections/blog-posts.js";
import { getDocUrls } from "./src/collections/doc-pages.js";
import { getShopUrls } from "./src/collections/shop-products.js";

/**
 * Static site generation configuration
 * Uses resolver mode for direct function calls (no HTTP overhead)
 */
export const build = {
  // Direct resolver - no HTTP server needed, just function calls
  resolver: async (/** @type {string} */ path) => {
    const ctx = new Context("GET", new URL(`http://localhost${path}`), new Headers());
    await router.handleRequest(ctx);
    return ctx.toResponse();
  },

  // Routes to start crawling from (including sample dynamic routes)
  routes: [
    // Static pages
    "/",
    "/about",
    "/docs",
    "/home",
    // Dynamic pages from collections
    ...getBlogUrls(),
    ...getShopUrls(),
    ...getDocUrls(),
  ],

  // Copy static assets
  assets: "./public",

  // Include client-side apps (automatically bundled)
  bundles: {
    "/apps/index.js": "./src/apps/index.js",
    "/apps/counter.js": "./src/apps/counter.js",
  },

  // Output directory
  output: "./dist",
};
