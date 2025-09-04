/**
 * Soar deployment configuration for static site example
 *
 * This example shows how to deploy a static site to Cloudflare Workers.
 * The site will be available at: https://{scriptName}.{accountId}.workers.dev
 *
 * Required environment variables:
 * - CF_API_TOKEN: Your Cloudflare API token
 * - CF_ACCOUNT_ID: Your Cloudflare account ID
 *
 * Get your API token from: https://dash.cloudflare.com/profile/api-tokens
 * Find your account ID in: https://dash.cloudflare.com/ (right sidebar)
 */

export default {
	// Static files configuration
	artifact: {
		type: "static",
		path: ".", // Deploy files from current directory
		exclude: [
			"raven.soar.js", // Don't deploy the config file itself
			"README.md", // Don't deploy documentation
			"*.log", // Exclude log files
		],
	},

	// Cloudflare Workers deployment target
	target: {
		name: "cloudflare-workers",
		scriptName: "raven-soar-demo", // Worker script name (customize this!)
		accountId: process.env.CF_ACCOUNT_ID, // From environment variable
		apiToken: process.env.CF_API_TOKEN, // From environment variable
		compatibilityDate: "2024-01-01", // Cloudflare Workers compatibility date
		dispatchNamespace: null, // Optional: custom domain namespace
	},
};

// Named exports for different environments
export const production = {
	artifact: {
		type: "static",
		path: ".",
		exclude: ["soar.config.js", "README.md", "*.log"],
	},
	target: {
		name: "cloudflare-workers",
		scriptName: "my-site-prod",
		accountId: process.env.CF_ACCOUNT_ID,
		apiToken: process.env.CF_API_TOKEN,
		compatibilityDate: "2024-01-01",
	},
};

export const staging = {
	artifact: {
		type: "static",
		path: ".",
		exclude: ["soar.config.js", "README.md", "*.log"],
	},
	target: {
		name: "cloudflare-workers",
		scriptName: "my-site-staging",
		accountId: process.env.CF_ACCOUNT_ID,
		apiToken: process.env.CF_API_TOKEN,
		compatibilityDate: "2024-01-01",
	},
};
