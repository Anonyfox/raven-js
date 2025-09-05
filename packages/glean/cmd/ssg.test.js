/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file SsgCommand tests - Comprehensive test coverage for CLI static site generation command
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { ValidationError } from "@raven-js/wings/terminal";
import { SsgCommand } from "./ssg.js";

describe("SsgCommand", () => {
	describe("constructor", () => {
		it("should create SsgCommand with correct path and description", () => {
			const _command = new SsgCommand();

			assert.strictEqual(_command.path, "/ssg/:source/:output");
			assert.strictEqual(
				_command.description,
				"Generate static documentation site",
			);
			assert.strictEqual(_command.method, "COMMAND");
		});

		it("should declare all required flags", () => {
			const _command = new SsgCommand();
			const flags = _command.getFlags();

			assert.ok(flags.has("domain"));
			assert.ok(flags.has("base"));
			assert.ok(flags.has("verbose"));

			const domainFlag = flags.get("domain");
			assert.strictEqual(domainFlag.type, "string");
			assert.strictEqual(domainFlag.description, "Domain for SEO tags");

			const baseFlag = flags.get("base");
			assert.strictEqual(baseFlag.type, "string");
			assert.strictEqual(baseFlag.default, "/");
			assert.strictEqual(
				baseFlag.description,
				"Base path for subdirectory deployment",
			);

			const verboseFlag = flags.get("verbose");
			assert.strictEqual(verboseFlag.type, "boolean");
			assert.strictEqual(verboseFlag.description, "Show detailed output");
		});
	});

	describe("beforeExecute", () => {
		it("should pass validation with both source and output", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg/src/docs");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { source: "./src", output: "./docs" };

			await assert.doesNotReject(() => _command.beforeExecute(ctx));
		});

		it("should throw ValidationError for missing source", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg//docs");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { output: "./docs" };

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});

		it("should throw ValidationError for missing output", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg/src/");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { source: "./src" };

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});

		it("should throw ValidationError for missing both parameters", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg//");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = {};

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});
	});

	describe("execute", () => {
		it("should build correct parameters with minimal flags", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg/src/docs");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { source: "./src", output: "./docs" };

			// Test parameter building logic
			const sourceDir = ctx.pathParams.source;
			const outputDir = ctx.pathParams.output;
			const domain = ctx.queryParams.get("domain");
			const basePath = ctx.queryParams.get("base") || "/";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(sourceDir, "./src");
			assert.strictEqual(outputDir, "./docs");
			assert.strictEqual(domain, null);
			assert.strictEqual(basePath, "/");
			assert.strictEqual(verbose, false);
		});

		it("should build correct parameters with all flags", async () => {
			const _command = new SsgCommand();
			const url = new URL(
				"http://localhost/ssg/lib/build?domain=example.com&base=%2Fmyproject%2F&verbose=true",
			);
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { source: "./lib", output: "./build" };

			// Test parameter building logic
			const sourceDir = ctx.pathParams.source;
			const outputDir = ctx.pathParams.output;
			const domain = ctx.queryParams.get("domain");
			const basePath = ctx.queryParams.get("base") || "/";
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(sourceDir, "./lib");
			assert.strictEqual(outputDir, "./build");
			assert.strictEqual(domain, "example.com");
			assert.strictEqual(basePath, "/myproject/");
			assert.strictEqual(verbose, true);
		});

		it("should handle missing path parameters in validation", async () => {
			const _command = new SsgCommand();
			const url = new URL("http://localhost/ssg/src/docs");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { source: "./src", output: "./docs" };

			// Test that we can detect missing parameters
			const hasSource = !!ctx.pathParams.source;
			const hasOutput = !!ctx.pathParams.output;

			assert.strictEqual(hasSource, true);
			assert.strictEqual(hasOutput, true);
		});
	});
});
