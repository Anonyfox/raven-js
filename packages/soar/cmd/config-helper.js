/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Configuration helper for Soar CLI commands.
 *
 * Handles config precedence: stdin > flags > config file > default config file.
 * Provides intelligent deployment pattern detection and config object creation.
 */

import { stdin } from "node:process";

/**
 * Read configuration from stdin (piped input)
 * @returns {Promise<string | null>} Config string or null if no piped input
 */
export async function readStdin() {
	if (stdin.isTTY) {
		return null; // No piped input
	}

	let input = "";
	for await (const chunk of stdin) {
		input += chunk;
	}
	return input.trim() || null;
}

/**
 * Parse config argument to extract file path and export name
 * @param {string|null} configArg - Config argument (may contain :exportName)
 * @param {string|null} exportFlag - Explicit export flag
 * @returns {{configPath: string|null, exportName: string|null}}
 */
export function parseConfigArg(configArg, exportFlag) {
	if (!configArg) {
		return { configPath: null, exportName: exportFlag };
	}

	if (configArg.includes(":")) {
		const [configPath, exportName] = configArg.split(":");
		return {
			configPath: configPath || null,
			exportName: exportName || exportFlag,
		};
	}

	return { configPath: configArg, exportName: exportFlag };
}

/**
 * Create config object from CLI flags for common deployment patterns
 * @param {URLSearchParams} queryParams - Wings query parameters
 * @returns {Object|null} Config object or null if no valid pattern detected
 */
export function createConfigFromFlags(queryParams) {
	const flags = Object.fromEntries(queryParams.entries());

	// Handle flag aliases
	const cloudflareWorkers = flags["cf-workers"] || flags["cloudflare-workers"];

	// Static to Cloudflare Workers (most common case)
	if (flags.static && cloudflareWorkers) {
		return {
			artifact: {
				type: "static",
				path: flags.static,
			},
			target: {
				name: "cloudflare-workers",
				scriptName: cloudflareWorkers,
				accountId: flags["cf-account"] || process.env.CF_ACCOUNT_ID,
				apiToken: flags["cf-token"] || process.env.CF_API_TOKEN,
				compatibilityDate: flags["cf-compatibility"] || "2024-01-01",
			},
		};
	}

	// Future deployment patterns would go here
	// Script to AWS Lambda
	if (flags.script && flags["aws-lambda"]) {
		return {
			artifact: {
				type: "script",
				path: flags.script,
			},
			target: {
				name: "aws-lambda",
				functionName: flags["aws-lambda"],
				region: flags["aws-region"] || "us-east-1",
			},
		};
	}

	// Binary to DigitalOcean Droplets
	if (flags.binary && flags["do-droplets"]) {
		return {
			artifact: {
				type: "binary",
				path: flags.binary,
			},
			target: {
				name: "do-droplets",
				dropletName: flags["do-droplets"],
				token: flags["do-token"] || process.env.DO_API_TOKEN,
			},
		};
	}

	return null;
}

/**
 * Create configuration from multiple sources with proper precedence
 * @param {Object} options - Configuration options
 * @param {string|null} options.configPath - Path to config file
 * @param {string|null} options.stdinConfig - Configuration from stdin
 * @param {string|null} options.exportName - Named export to use
 * @param {URLSearchParams} options.queryParams - CLI flags as query parameters
 * @param {string} options.mode - Command mode (deploy/plan)
 * @returns {Promise<any>} Configuration object
 */
export async function createConfigFromSources({
	configPath,
	stdinConfig,
	exportName,
	queryParams,
	mode,
}) {
	// 1. Stdin has highest priority
	if (stdinConfig) {
		return stdinConfig;
	}

	// 2. Try to create config from CLI flags
	const flagConfig = createConfigFromFlags(queryParams);
	if (flagConfig) {
		return flagConfig;
	}

	// 3. Try specified config file
	if (configPath) {
		try {
			const fullPath = configPath.startsWith("/")
				? configPath
				: `./${configPath}`;
			const configModule = await import(fullPath);

			if (exportName && !(exportName in configModule)) {
				throw new Error(`Export '${exportName}' not found in ${configPath}`);
			}

			return exportName ? configModule[exportName] : configModule.default;
		} catch {
			throw new Error(`Config file not found: ${configPath}`);
		}
	}

	// 4. Try default config file
	try {
		// @ts-expect-error - Optional config file may not exist
		const configModule = await import("./raven.soar.js");
		return exportName ? configModule[exportName] : configModule.default;
	} catch {
		// Default config file doesn't exist, that's ok
	}

	// 5. No configuration sources available
	throw new Error(
		`No configuration provided for ${mode}. Use flags, config file, or piped input.`,
	);
}
