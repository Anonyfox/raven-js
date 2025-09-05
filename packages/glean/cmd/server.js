/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ServerCommand - Live documentation server command using CommandRoute
 *
 * Surgical CLI command that starts a live documentation server with proper
 * flag validation and error handling.
 */

import { CommandRoute, ValidationError } from "@raven-js/wings/terminal";
import { startDocumentationServer } from "../lib/server/index.js";

/**
 * Command for starting a live documentation server
 * @extends {CommandRoute}
 */
export class ServerCommand extends CommandRoute {
	/**
	 * Create a new ServerCommand instance
	 */
	constructor() {
		super("/server/:path?", "Start live documentation server");

		this.flag("port", {
			type: "number",
			default: 3000,
			description: "Port for server (default: 3000)",
		});
		this.flag("domain", {
			type: "string",
			description: "Domain for SEO tags",
		});
		this.flag("verbose", {
			type: "boolean",
			description: "Enable detailed logging",
		});
	}

	/**
	 * Validate flags before execution
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async beforeExecute(ctx) {
		const portStr = ctx.queryParams.get("port");
		if (portStr) {
			const port = parseInt(portStr, 10);
			if (Number.isNaN(port) || port < 1 || port > 65535) {
				throw new ValidationError("Port must be a valid number between 1 and 65535");
			}
		}
	}

	/**
	 * Execute the server command
	 * @param {import("@raven-js/wings").Context} ctx - Request context
	 * @returns {Promise<void>}
	 */
	async execute(ctx) {
		const packagePath = ctx.pathParams.path || ".";
		const port = parseInt(ctx.queryParams.get("port") || "3000", 10);
		const domain = ctx.queryParams.get("domain");
		const verbose = ctx.queryParams.get("verbose") === "true";

		console.log(`🚀 Starting documentation server...`);
		console.log(`📦 Package: ${packagePath}`);
		console.log(`🌐 Port: ${port}`);
		if (domain) {
			console.log(`🔗 Domain: ${domain}`);
		}

		// Delegate to existing business logic
		await startDocumentationServer(packagePath, {
			port,
			host: "localhost",
			domain,
			enableLogging: verbose,
		});
	}
}
