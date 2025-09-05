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

import { markdownToHTML } from "@raven-js/beak";
import { Router } from "@raven-js/wings";
import { Assets, Resolve } from "@raven-js/wings/server";
import { Layout } from "./components/layout.js";

/**
 * Create new router instance
 */
const router = new Router();

/**
 * Static asset handling - automatically serves files from public/ directory
 */
router.use(new Assets({ assetsDir: "public" }));
router.use(new Resolve({ sourceFolder: "src" }));

/**
 * Route definitions - dynamic imports eliminate repetitive import statements
 * Each entry dynamically imports and mounts the page handler
 */
const routes = [
	{ path: "/", page: "./pages/home/index.js" },
	{ path: "/about", page: "./pages/about/index.js" },
	{ path: "/docs", page: "./pages/docs/index.js" },
];

// Mount all routes with dynamic imports lazily
for (const route of routes) {
	router.get(route.path, async (ctx) => {
		const { title, description, body } = await import(route.page);
		const content = markdownToHTML(body);
		const page = Layout({ title, description, content });
		ctx.html(page);
	});
}

export { router };
