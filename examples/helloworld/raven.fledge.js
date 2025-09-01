/**
 * Fledge script mode configuration for HelloWorld example
 * Bundles the full-stack Wings application into a standalone executable
 */
export default {
	// Main server entry point
	entry: "./boot.js",

	// Output executable
	output: "./dist/helloworld-server.js",

	// Bundle format (ESM for top-level await support)
	format: "esm",

	// Embed static assets for standalone deployment
	assets: [
		"./public", // Static assets (favicon, etc.)
		"./src/client", // Client-side source for bundling
		"./src/shared", // Shared utilities
		"./src/server", // Server-side rendering logic
	],

	// Client bundles to pre-build and embed
	bundles: {
		"/client/app.js": "./src/client/app.js", // Main client app
		"/client/todos.js": "./src/client/todos.js", // Todos functionality
	},

	// Node.js runtime flags
	nodeFlags: [
		"--experimental-sqlite", // Default in fledge
		"--max-old-space-size=512", // Reasonable memory limit
	],

	// Environment variables
	env: {
		NODE_ENV: "production",
		PORT: "3000",
	},

	// Metadata for banner
	metadata: {
		name: "HelloWorld Server",
		description: "Standalone HelloWorld server bundle with Wings + Beak",
		banner: true,
	},
};
