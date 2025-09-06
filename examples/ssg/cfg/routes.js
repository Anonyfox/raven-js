/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Central routing configuration - clean route registration only
 */

import { markdownToHTML } from "@raven-js/beak";
import { Router } from "@raven-js/wings";
import { Assets } from "@raven-js/wings/server";
import { Layout } from "../src/components/layout.js";
import { scanPages } from "./page-scanner.js";

/**
 * @typedef {Object} PageModule
 * @property {Function} [loadDynamicData] - Optional async data loader
 * @property {string|Function} title - Page title (static or async function)
 * @property {string|Function} description - Page description (static or async function)
 * @property {string|Function} body - Page body content (static or async function)
 */

/**
 * Wings router instance
 */
const router = new Router();

/**
 * Setup routes from filesystem scan
 */
async function setupRoutes() {
	try {
		// Add static assets middleware
		router.use(new Assets({ assetsDir: "../public" }));

		// Scan pages directory for routes
		const routes = await scanPages({
			pagesDir: "src/pages",
			indexFile: "index.js",
			includeNested: true,
		});
		console.log(`🔍 Discovered ${routes.length} routes from filesystem`);

		// Register each route with dynamic data orchestration
		for (const route of routes) {
			router.get(
				route.path,
				async (/** @type {import("@raven-js/wings").Context} */ ctx) => {
					/** @type {PageModule} */
					const pageModule = await import(route.page);

					// 1. Load dynamic data if loader exists
					const data = pageModule.loadDynamicData
						? await pageModule.loadDynamicData(ctx)
						: {};

					// 2. Resolve each export (static string OR async function)
					const title =
						typeof pageModule.title === "function"
							? await pageModule.title(data)
							: pageModule.title;

					const description =
						typeof pageModule.description === "function"
							? await pageModule.description(data)
							: pageModule.description;

					const body =
						typeof pageModule.body === "function"
							? await pageModule.body(data)
							: pageModule.body;

					// 3. Render page with resolved data
					const content = markdownToHTML(body);
					const page = Layout({ title, description, content });
					ctx.html(page);
				},
			);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("❌ Failed to setup routes:", errorMessage);
		throw error;
	}
}

// Initialize routes
await setupRoutes();

export { router };
