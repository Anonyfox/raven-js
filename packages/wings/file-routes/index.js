/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file File-based routing for Wings - discover and register routes from filesystem
 *
 * This module provides file-based routing capabilities for Wings applications,
 * similar to Next.js pages directory routing. It automatically discovers routes
 * from your filesystem structure and registers them with a Wings router.
 *
 * Supported patterns:
 * - Static routes: `pages/about/index.js` → `/about`
 * - Dynamic routes: `pages/blog/[slug]/index.js` → `/blog/:slug`
 * - Nested dynamic: `pages/shop/[category]/[item]/index.js` → `/shop/:category/:item`
 * - Catch-all: `pages/docs/[...path]/index.js` → `/docs/*path`
 *
 * @example
 * import { Router } from "@raven-js/wings";
 * import { scanRoutes, registerFileRoutes } from "@raven-js/wings/file-routes";
 *
 * const router = new Router();
 *
 * // Scan for routes
 * const routes = await scanRoutes("src/pages");
 * console.log(`Found ${routes.length} routes`);
 *
 * // Register with custom handler
 * await registerFileRoutes(router, "src/pages", {
 *   handler: async (ctx, route) => {
 *     const pageModule = await import(route.module);
 *     // Your page handling logic
 *   }
 * });
 */

export { FileRoute } from "./file-route.js";
export { registerFileRoutes } from "./register.js";
export { scanRoutes } from "./scanner.js";
