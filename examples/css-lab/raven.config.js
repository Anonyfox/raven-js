/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file RavenJS configuration - defines static build settings
 */

import { Context } from "@raven-js/wings";
import { router } from "./cfg/routes.js";

export const build = {
	resolver: async (path) => {
		const ctx = new Context("GET", new URL(`http://localhost${path}`), new Headers());
		await router.handleRequest(ctx);
		return ctx.toResponse();
	},
	routes: ["/"],
	assets: "./public",
	output: "./dist",
};
