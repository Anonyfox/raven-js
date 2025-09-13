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

/** @typedef {{ title: string|Function, description: string|Function, body: string|Function }} PageModule */

const router = new Router();

async function setupRoutes() {
	router.use(new Assets({ assetsDir: "./public" }));

	const routes = await registerFileRoutes(router, "src/pages", {
		baseDir: process.cwd(),
		indexFile: "index.js",
		includeNested: true,
		handler: async (ctx, route) => {
			/** @type {PageModule} */
			const pageModule = await import(route.module);
			const title =
				typeof pageModule.title === "function" ? await pageModule.title({}) : pageModule.title;
			const description =
				typeof pageModule.description === "function"
					? await pageModule.description({})
					: pageModule.description;
			const body =
				typeof pageModule.body === "function" ? await pageModule.body({}) : pageModule.body;
			const content = markdownToHTML(body);
			const page = Layout({ title, description, content });
			ctx.html(page);
		},
	});
	console.log(`🔍 Discovered ${routes.length} routes`);
}

await setupRoutes();

export { router };
