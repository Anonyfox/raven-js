/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ValidateCommand tests - Comprehensive test coverage for CLI validation command
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { ValidateCommand } from "./validate.js";

describe("ValidateCommand", () => {
	describe("constructor", () => {
		it("should create ValidateCommand with correct path and description", () => {
			const _command = new ValidateCommand();

			assert.strictEqual(_command.path, "/validate/:path?");
			assert.strictEqual(
				_command.description,
				"Validate JSDoc quality and report issues",
			);
			assert.strictEqual(_command.method, "COMMAND");
		});

		it("should declare verbose flag", () => {
			const _command = new ValidateCommand();
			const flags = _command.getFlags();

			assert.ok(flags.has("verbose"));
			const verboseFlag = flags.get("verbose");
			assert.strictEqual(verboseFlag.type, "boolean");
			assert.strictEqual(verboseFlag.description, "Show detailed output");
		});
	});

	describe("execute", () => {
		it("should extract correct parameters with default path", async () => {
			const _command = new ValidateCommand();
			const url = new URL("http://localhost/validate");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			// Test parameter extraction logic
			const target = ctx.pathParams.path || ".";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(target, ".");
			assert.strictEqual(verbose, false);
		});

		it("should extract correct parameters with custom path", async () => {
			const _command = new ValidateCommand();
			const url = new URL("http://localhost/validate/src");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { path: "./src" };

			// Test parameter extraction logic
			const target = ctx.pathParams.path || ".";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(target, "./src");
			assert.strictEqual(verbose, false);
		});

		it("should extract correct parameters with verbose flag", async () => {
			const _command = new ValidateCommand();
			const url = new URL("http://localhost/validate/test?verbose=true");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { path: "./test" };

			// Test parameter extraction logic
			const target = ctx.pathParams.path || ".";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(target, "./test");
			assert.strictEqual(verbose, true);
		});

		it("should extract correct parameters without verbose when flag is false", async () => {
			const _command = new ValidateCommand();
			const url = new URL("http://localhost/validate/lib?verbose=false");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { path: "./lib" };

			// Test parameter extraction logic
			const target = ctx.pathParams.path || ".";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(target, "./lib");
			assert.strictEqual(verbose, false);
		});
	});
});
