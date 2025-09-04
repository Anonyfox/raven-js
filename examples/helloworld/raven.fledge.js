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

/**
 * Fledge binary mode configuration for HelloWorld example
 * Generates a native executable with embedded assets and client bundles
 */
export const binary = {
	// Main server entry point
	entry: "./boot.js",

	// Output executable name
	output: "./dist/helloworld",

	// Client bundles to build and embed
	bundles: {
		"/client/app.js": "./src/client/app.js", // Main client app
		"/client/todos.js": "./src/client/todos.js", // Todos functionality
	},

	// Embed static assets into the executable
	assets: [
		"./public", // Static assets (favicon, etc.)
		"./src/client", // Client-side source for reference
		"./src/shared", // Shared utilities
		"./src/server", // Server-side rendering logic
	],

	// Environment variables embedded in binary
	env: {
		NODE_ENV: "production",
		PORT: "3000",
	},

	// SEA (Single Executable Application) options
	sea: {
		useCodeCache: true, // Enable V8 code cache for faster startup
		disableExperimentalSEAWarning: true, // Hide experimental warnings
	},

	// Code signing (auto-enabled on macOS)
	signing: {
		enabled: process.platform === "darwin", // Sign on macOS
		// identity: undefined, // Use default signing identity
	},

	// Metadata for the executable
	metadata: {
		name: "HelloWorld Binary",
		description: "Native HelloWorld executable with Wings + Beak",
		banner: true,
	},
};
