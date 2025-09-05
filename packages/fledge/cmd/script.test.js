/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for ScriptCommand Wings Terminal command class
 *
 * Validates flag parsing, config handling, and command execution
 * for script bundle generation.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { ScriptCommand } from "./script.js";

describe("ScriptCommand", () => {
	it("creates command with correct route pattern", () => {
		const command = new ScriptCommand();
		strictEqual(command.pattern, "/script/:config?");
		strictEqual(command.description, "Generate executable script bundle");
	});

	it("declares all required flags", () => {
		const command = new ScriptCommand();
		const flags = command.flags;

		// Check flag existence and types
		strictEqual(flags.entry?.type, "string");
		strictEqual(flags.output?.type, "string");
		strictEqual(flags.format?.type, "string");
		strictEqual(flags.format?.default, "cjs");
		strictEqual(flags.assets?.type, "string");
		strictEqual(flags.assets?.multiple, true);
		strictEqual(flags["node-flags"]?.type, "string");
		strictEqual(flags["node-flags"]?.multiple, true);
		strictEqual(flags.export?.type, "string");
		strictEqual(flags.validate?.type, "boolean");
		strictEqual(flags.verbose?.type, "boolean");
	});

	it("returns null when entry or output missing", async () => {
		const command = new ScriptCommand();

		// Missing both
		let queryParams = new URLSearchParams();
		let config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);

		// Missing output
		queryParams = new URLSearchParams("entry=app.js");
		config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);

		// Missing entry
		queryParams = new URLSearchParams("output=dist/app.js");
		config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);
	});

	it("creates config from entry and output flags", async () => {
		const command = new ScriptCommand();
		const queryParams = new URLSearchParams();
		queryParams.set("entry", "src/app.js");
		queryParams.set("output", "dist/app.js");
		queryParams.set("format", "esm");
		queryParams.append("assets", "public/logo.png");
		queryParams.append("assets", "public/favicon.ico");
		queryParams.append("node-flags", "--experimental-modules");

		const config = await command.createConfigFromFlags(queryParams);

		// Should call createConfigFromFlags with correct parameters
		strictEqual(config !== null, true);
	});
});
