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
import { registerFileRoutes } from "@raven-js/wings/file-routes";
import { Assets } from "@raven-js/wings/server";
import { Layout } from "../src/components/layout.js";

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

		// Register routes using Wings file-routes with custom SSG handler
		const routes = await registerFileRoutes(router, "src/pages", {
			baseDir: process.cwd(),
			indexFile: "index.js",
			includeNested: true,
			handler: async (
				/** @type {import("@raven-js/wings").Context} */ ctx,
				route,
			) => {
				/** @type {PageModule} */
				const pageModule = await import(route.module);

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
		});
		console.log(`🔍 Discovered ${routes.length} routes from filesystem`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("❌ Failed to setup routes:", errorMessage);
		throw error;
	}
}

// Initialize routes
await setupRoutes();

export { router };
