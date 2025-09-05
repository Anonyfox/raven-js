/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Central routing configuration - mounts page handlers to paths
 */

import { Router } from "@raven-js/wings";
import { Assets } from "@raven-js/wings/server";

/**
 * Create router and mount page handlers
 */
const router = new Router();

/**
 * Static asset handling - automatically serves files from public/ directory
 * Works in development and gets copied to build output by Fledge
 */
router.use(new Assets({ assetsDir: "public" }));

/**
 * Route definitions - dynamic imports eliminate repetitive import statements
 * Each entry dynamically imports and mounts the page handler
 */
const routes = [
  { path: "/", page: "./pages/home/index.js" },
  { path: "/about", page: "./pages/about/index.js" },
  { path: "/docs", page: "./pages/docs/index.js" },
];

// Mount all routes with dynamic imports
for (const route of routes) {
  const { handler } = await import(route.page);
  router.get(route.path, handler);
}

export { router };
