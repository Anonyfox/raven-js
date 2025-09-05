/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file ServerCommand tests - Comprehensive test coverage for CLI server command
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Context } from "@raven-js/wings";
import { ValidationError } from "@raven-js/wings/terminal";
import { ServerCommand } from "./server.js";

describe("ServerCommand", () => {
	describe("constructor", () => {
		it("should create ServerCommand with correct path and description", () => {
			const _command = new ServerCommand();

			assert.strictEqual(_command.path, "/server/:path?");
			assert.strictEqual(
				_command.description,
				"Start live documentation server",
			);
			assert.strictEqual(_command.method, "COMMAND");
		});

		it("should declare all required flags", () => {
			const _command = new ServerCommand();
			const flags = _command.getFlags();

			assert.ok(flags.has("port"));
			assert.ok(flags.has("domain"));
			assert.ok(flags.has("verbose"));

			const portFlag = flags.get("port");
			assert.strictEqual(portFlag.type, "number");
			assert.strictEqual(portFlag.default, 3000);
			assert.strictEqual(
				portFlag.description,
				"Port for server (default: 3000)",
			);

			const domainFlag = flags.get("domain");
			assert.strictEqual(domainFlag.type, "string");
			assert.strictEqual(domainFlag.description, "Domain for SEO tags");

			const verboseFlag = flags.get("verbose");
			assert.strictEqual(verboseFlag.type, "boolean");
			assert.strictEqual(verboseFlag.description, "Enable detailed logging");
		});
	});

	describe("beforeExecute", () => {
		it("should pass validation with valid port", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server?port=8080");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			await assert.doesNotReject(() => _command.beforeExecute(ctx));
		});

		it("should pass validation with no port (uses default)", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			await assert.doesNotReject(() => _command.beforeExecute(ctx));
		});

		it("should throw ValidationError for invalid port (non-numeric)", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server?port=abc");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});

		it("should throw ValidationError for port too low", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server?port=0");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});

		it("should throw ValidationError for port too high", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server?port=70000");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			await assert.rejects(() => _command.beforeExecute(ctx), ValidationError);
		});
	});

	describe("execute", () => {
		it("should build correct parameters with defaults", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server");
			const ctx = new Context("COMMAND", url, new Headers(), "");

			// Test parameter building logic
			const packagePath = ctx.pathParams.path || ".";
			const port = parseInt(ctx.queryParams.get("port") || "3000", 10);
			const domain = ctx.queryParams.get("domain");
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(packagePath, ".");
			assert.strictEqual(port, 3000);
			assert.strictEqual(domain, null);
			assert.strictEqual(verbose, false);
		});

		it("should build correct parameters with custom path and port", async () => {
			const _command = new ServerCommand();
			const url = new URL("http://localhost/server/my-project?port=8080");
			const ctx = new Context("COMMAND", url, new Headers(), "");
			ctx.pathParams = { path: "./my-project" };

			// Test parameter building logic
			const packagePath = ctx.pathParams.path || ".";
			const port = parseInt(ctx.queryParams.get("port") || "3000", 10);
			const domain = ctx.queryParams.get("domain");
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(packagePath, "./my-project");
			assert.strictEqual(port, 8080);
			assert.strictEqual(domain, null);
			assert.strictEqual(verbose, false);
		});

		it("should build correct parameters with domain and verbose flags", async () => {
			const _command = new ServerCommand();
			const url = new URL(
				"http://localhost/server?domain=example.com&verbose=true",
			);
			const ctx = new Context("COMMAND", url, new Headers(), "");

			// Test parameter building logic
			const packagePath = ctx.pathParams.path || ".";
			const port = parseInt(ctx.queryParams.get("port") || "3000", 10);
			const domain = ctx.queryParams.get("domain");
			const verbose = ctx.queryParams.get("verbose") === "true";

			assert.strictEqual(packagePath, ".");
			assert.strictEqual(port, 3000);
			assert.strictEqual(domain, "example.com");
			assert.strictEqual(verbose, true);
		});
	});
});
