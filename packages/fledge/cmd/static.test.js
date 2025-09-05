/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for StaticCommand Wings Terminal command class
 *
 * Validates flag parsing, config handling, and command execution
 * for static site generation.
 */

import { match, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { StaticCommand } from "./static.js";

describe("StaticCommand", () => {
	it("creates command with correct route pattern", () => {
		const command = new StaticCommand();
		strictEqual(command.path, "/static/:config?");
		strictEqual(command.description, "Generate static site from server");
	});

	it("declares all required flags", () => {
		const command = new StaticCommand();
		const flags = command.getFlags();

		// Check flag existence and types
		strictEqual(flags.get("server")?.type, "string");
		strictEqual(flags.get("out")?.type, "string");
		strictEqual(flags.get("out")?.default, "./dist");
		strictEqual(flags.get("base")?.type, "string");
		strictEqual(flags.get("base")?.default, "/");
		strictEqual(flags.get("export")?.type, "string");
		strictEqual(flags.get("validate")?.type, "boolean");
		strictEqual(flags.get("verbose")?.type, "boolean");
	});

	it("creates config from server flag", () => {
		const command = new StaticCommand();
		const queryParams = new URLSearchParams("server=http://localhost:3000");

		const config = command.createConfigFromFlags(queryParams);
		strictEqual(typeof config.getServer(), "string");
		strictEqual(config.getServer(), "http://localhost:3000");
	});

	it("returns null when server flag missing", () => {
		const command = new StaticCommand();
		const queryParams = new URLSearchParams();

		const config = command.createConfigFromFlags(queryParams);
		strictEqual(config, null);
	});

	it("applies base path override correctly", () => {
		const command = new StaticCommand();

		// Mock config
		const mockConfig = {
			getServer: () => "http://localhost:3000",
			getRoutes: () => ["/", "/about"],
			getDiscover: () => true,
			getBundles: () => ({}),
			getAssets: () => ({ getFiles: () => [] }),
			getOutput: () => "./dist",
		};

		const queryParams = new URLSearchParams("base=/subpath");
		const result = command.applyCliOverrides(mockConfig, queryParams);

		// Should create new config with basePath override
		strictEqual(typeof result.getServer, "function");
		strictEqual(result.getServer(), "http://localhost:3000");
	});

	it("returns original config when no base override", () => {
		const command = new StaticCommand();
		const mockConfig = { test: "original" };
		const queryParams = new URLSearchParams();

		const result = command.applyCliOverrides(mockConfig, queryParams);
		strictEqual(result, mockConfig);
	});

	it("handles validation mode execution", async () => {
		const command = new StaticCommand();
		let consoleOutput = "";

		// Mock console.log
		const originalLog = console.log;
		console.log = (...args) => {
			consoleOutput += `${args.join(" ")}\n`;
		};

		try {
			// Create real Wings context for validation
			const url = new URL(
				"http://localhost/static?validate=true&server=http://localhost:3000",
			);
			const context = new Context("COMMAND", url, new Headers());

			await command.execute(context);

			// Check that validation output was generated (from console.log in the command)
			match(consoleOutput, /Configuration summary/);
			match(consoleOutput, /Server: http:\/\/localhost:3000/);
			match(consoleOutput, /Routes: \//);
		} finally {
			console.log = originalLog;
		}
	});
});
