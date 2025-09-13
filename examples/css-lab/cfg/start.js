/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Development server - starts Wings DevServer with auto-reload
 */

import { DevServer, Logger, Resolve } from "@raven-js/wings/server";
import { router } from "./routes.js";

/**
 * Start development server
 */
async function startServer() {
	router.useEarly(new Logger());
	router.use(new Resolve({ sourceFolder: "./src" }));

	const server = new DevServer(router);
	const port = Number(process.env.PORT) || 3000;
	await server.listen(port);

	console.log(`🦅 RavenJS CSS Lab running at: http://localhost:${port}`);
}

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
