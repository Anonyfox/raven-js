import { ClusteredServer, DevServer, Logger } from "@ravenjs/wings/server";
import { router } from "./src/index.js";

const port = 3000;

/**
 * Check if we're running in production environment
 * Follows community best practices for production detection
 */
function isProduction() {
	const env = process.env.NODE_ENV?.toLowerCase();
	return env === "production" || env === "prod" || env === "live";
}

/**
 * Setup development environment
 */
function setupDevelopment() {
	// Development: Colored terminal output with performance indicators
	router.useEarly(new Logger());

	const server = new DevServer(router);

	console.log(`🚀 Hello World server running at http://localhost:${port}`);
	console.log(`📝 Edit examples/helloworld/src/index.js to see changes live`);
	console.log(`📊 Request logging enabled with performance indicators (⚡🚀🐌)`);
	console.log(`🔧 Environment: Development`);

	return server;
}

/**
 * Setup production environment
 */
function setupProduction() {
	// Production: Structured JSON logging for compliance
	router.useEarly(new Logger({ production: true, includeHeaders: false }));

	const server = new ClusteredServer(router);

	// Only log from the main process to avoid duplicate messages
	if (server.isMainProcess) {
		console.log(`🚀 Hello World server running at http://localhost:${port}`);
		console.log(`📊 Structured JSON logging enabled for compliance`);
		console.log(`🔧 Environment: Production`);
	}

	return server;
}

// Start the appropriate server based on environment
const server = isProduction() ? setupProduction() : setupDevelopment();
server.listen(port).catch(console.error);
