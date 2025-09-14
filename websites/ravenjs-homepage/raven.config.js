/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RavenJS configuration - defines build and deployment settings for homepage
 */

import { Context } from "@raven-js/wings";
import { router } from "./src/router.js";

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

  // Routes to start crawling from
  routes: ["/"],

  // Copy static assets
  assets: "./public",

  // Include client-side apps (automatically bundled)
  bundles: {
    "/apps/index.js": "./src/apps/index.js",
  },

  // Output directory
  output: "./dist",
};
