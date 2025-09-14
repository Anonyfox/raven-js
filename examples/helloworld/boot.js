import {
	ClusteredServer,
	DevServer,
	generateSSLCert,
	Logger,
	Resolve,
} from "@raven-js/wings/server";
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
async function setupDevelopment() {
	// Development: Colored terminal output with performance indicators
	router.useEarly(new Logger());
	// Enable zero-build ESM development with automatic import maps
	router.use(new Resolve({ sourceFolder: "src" }));

	const server = new DevServer(router);
	return server;
}

/**
 * Setup production environment with HTTPS
 */
async function setupProduction() {
	// Production: Structured JSON logging for compliance
	router.useEarly(new Logger({ production: true, includeHeaders: false }));

	// Generate SSL certificate on demand - Raven philosophy: it just works
	const { privateKey, certificate } = await generateSSLCert({
		commonName: "localhost",
		organization: "Hello World Production",
	});

	const server = new ClusteredServer(router, {
		sslCertificate: certificate,
		sslPrivateKey: privateKey,
	});

	return server;
}

/**
 * Main application entry point
 */
async function main() {
	const server = isProduction() ? await setupProduction() : await setupDevelopment();

	await server.listen(port);

	if (isProduction()) {
		// Only log from the main process to avoid duplicate messages
		if (server.isMainProcess) {
			console.log(`🚀 Hello World server running at https://localhost:${port}`);
			console.log(`🔒 HTTPS enabled with auto-generated certificate`);
			console.log(`📊 Structured JSON logging enabled for compliance`);
			console.log(`🔧 Environment: Production`);
		}
	} else {
		console.log(`🚀 Hello World server running at http://localhost:${port}`);
		console.log(`📝 Edit examples/helloworld/src/index.js to see changes live`);
		console.log(`📊 Request logging enabled with performance indicators (⚡🚀🐌)`);
		console.log(`🔧 Environment: Development`);
	}
}

// Start the application
main().catch((error) => {
	console.error("💥 Failed to start Hello World server:", error);
	process.exit(1);
});
