/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Command exports tests - Verify all CommandRoute classes are properly exported
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { ValidateCommand, ServerCommand, SsgCommand } from "./index.js";

describe("cmd/index exports", () => {
	it("should export ValidateCommand", () => {
		assert.strictEqual(typeof ValidateCommand, "function");
		assert.strictEqual(ValidateCommand.name, "ValidateCommand");
	});

	it("should export ServerCommand", () => {
		assert.strictEqual(typeof ServerCommand, "function");
		assert.strictEqual(ServerCommand.name, "ServerCommand");
	});

	it("should export SsgCommand", () => {
		assert.strictEqual(typeof SsgCommand, "function");
		assert.strictEqual(SsgCommand.name, "SsgCommand");
	});

	it("should create instances of each command", () => {
		const validateCmd = new ValidateCommand();
		const serverCmd = new ServerCommand();
		const ssgCmd = new SsgCommand();

		assert.ok(validateCmd instanceof ValidateCommand);
		assert.ok(serverCmd instanceof ServerCommand);
		assert.ok(ssgCmd instanceof SsgCommand);

		// Verify they have the expected properties
		assert.strictEqual(validateCmd.method, "COMMAND");
		assert.strictEqual(serverCmd.method, "COMMAND");
		assert.strictEqual(ssgCmd.method, "COMMAND");
	});
});
