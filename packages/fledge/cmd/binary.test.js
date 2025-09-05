/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BinaryCommand Wings Terminal command class
 *
 * Validates flag parsing, config handling, and command execution
 * for binary executable generation.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { BinaryCommand } from "./binary.js";

describe("BinaryCommand", () => {
	it("creates command with correct route pattern", () => {
		const command = new BinaryCommand();
		strictEqual(command.pattern, "/binary/:config?");
		strictEqual(command.description, "Generate native executable binary");
	});

	it("declares all required flags", () => {
		const command = new BinaryCommand();
		const flags = command.flags;

		// Check flag existence and types
		strictEqual(flags.entry?.type, "string");
		strictEqual(flags.output?.type, "string");
		strictEqual(flags.assets?.type, "string");
		strictEqual(flags.assets?.multiple, true);
		strictEqual(flags.export?.type, "string");
		strictEqual(flags.validate?.type, "boolean");
		strictEqual(flags.verbose?.type, "boolean");
	});

	it("returns null when entry or output missing", async () => {
		const command = new BinaryCommand();

		// Missing both
		let queryParams = new URLSearchParams();
		let config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);

		// Missing output
		queryParams = new URLSearchParams("entry=app.js");
		config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);

		// Missing entry
		queryParams = new URLSearchParams("output=dist/app");
		config = await command.createConfigFromFlags(queryParams);
		strictEqual(config, null);
	});

	it("creates config from entry and output flags", async () => {
		const command = new BinaryCommand();
		const queryParams = new URLSearchParams();
		queryParams.set("entry", "src/app.js");
		queryParams.set("output", "dist/app");
		queryParams.append("assets", "public/logo.png");
		queryParams.append("assets", "public/favicon.ico");

		const config = await command.createConfigFromFlags(queryParams);

		// Should call createBinaryConfigFromFlags with correct parameters
		strictEqual(config !== null, true);
	});
});
