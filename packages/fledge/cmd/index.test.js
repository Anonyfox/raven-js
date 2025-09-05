/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for command exports barrel
 *
 * Validates that all command classes are properly exported and accessible.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { BinaryCommand, ScriptCommand, StaticCommand } from "./index.js";

describe("Command exports", () => {
	it("exports StaticCommand class", () => {
		strictEqual(typeof StaticCommand, "function");
		const instance = new StaticCommand();
		strictEqual(instance.pattern, "/static/:config?");
	});

	it("exports ScriptCommand class", () => {
		strictEqual(typeof ScriptCommand, "function");
		const instance = new ScriptCommand();
		strictEqual(instance.pattern, "/script/:config?");
	});

	it("exports BinaryCommand class", () => {
		strictEqual(typeof BinaryCommand, "function");
		const instance = new BinaryCommand();
		strictEqual(instance.pattern, "/binary/:config?");
	});
});
