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
		strictEqual(command.path, "/script/:config?");
		strictEqual(command.description, "Generate executable script bundle");
	});

	it("declares all required flags", () => {
		const command = new ScriptCommand();
		const flags = command.getFlags();

		// Check flag existence and types
		strictEqual(flags.get("entry")?.type, "string");
		strictEqual(flags.get("output")?.type, "string");
		strictEqual(flags.get("format")?.type, "string");
		strictEqual(flags.get("format")?.default, "cjs");
		strictEqual(flags.get("assets")?.type, "string");
		strictEqual(flags.get("assets")?.multiple, true);
		strictEqual(flags.get("node-flags")?.type, "string");
		strictEqual(flags.get("node-flags")?.multiple, true);
		strictEqual(flags.get("export")?.type, "string");
		strictEqual(flags.get("validate")?.type, "boolean");
		strictEqual(flags.get("verbose")?.type, "boolean");
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
		// Test without assets to avoid file dependency
		queryParams.append("node-flags", "--experimental-modules");

		const config = await command.createConfigFromFlags(queryParams);

		// Should call createConfigFromFlags with correct parameters
		strictEqual(config !== null, true);
	});
});
