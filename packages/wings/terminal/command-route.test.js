/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive tests for CommandRoute CLI routing class.
 *
 * Tests command creation, flag validation, lifecycle hooks, stdin mapping,
 * positional arguments, and error handling with 100% branch coverage.
 */

import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { HTTP_METHODS } from "../core/http-methods.js";
import { CommandRoute, ValidationError } from "./command-route.js";

/**
 * Mock Context class for testing
 */
class MockContext {
	#requestBody = null;

	constructor() {
		this.method = "COMMAND";
		this.url = new URL("http://localhost/");
		this.queryParams = new URLSearchParams();
		this.pathParams = {};
		this.responseStatusCode = 200;
		this.responseBody = "";
	}

	requestBody() {
		return this.#requestBody;
	}

	setRequestBody(body) {
		this.#requestBody = body;
	}

	async error(message = "Internal Server Error") {
		this.responseStatusCode = 500;
		this.responseBody = message;
		return this;
	}
}

describe("CommandRoute", () => {
	describe("constructor", () => {
		it("should create route with COMMAND method", () => {
			const route = new CommandRoute("/test", "Test command");

			assert.equal(route.method, HTTP_METHODS.COMMAND);
			assert.equal(route.path, "/test");
			assert.equal(route.description, "Test command");
			assert.equal(typeof route.handler, "function");
		});

		it("should create route with empty description by default", () => {
			const route = new CommandRoute("/test");

			assert.equal(route.description, "");
		});

		it("should initialize empty flags map", () => {
			const route = new CommandRoute("/test");
			const flags = route.getFlags();

			assert.equal(flags.size, 0);
			assert.ok(flags instanceof Map);
		});
	});

	describe("flag()", () => {
		let route;

		beforeEach(() => {
			route = new CommandRoute("/test");
		});

		it("should add flag with default configuration", () => {
			route.flag("verbose");
			const flags = route.getFlags();

			assert.equal(flags.size, 1);
			assert.deepEqual(flags.get("verbose"), {
				type: "string",
				required: false,
				multiple: false,
			});
		});

		it("should add flag with custom configuration", () => {
			route.flag("env", {
				type: "string",
				required: true,
				choices: ["dev", "prod"],
				description: "Environment",
			});

			const flags = route.getFlags();
			assert.deepEqual(flags.get("env"), {
				type: "string",
				required: true,
				multiple: false,
				choices: ["dev", "prod"],
				description: "Environment",
			});
		});

		it("should support method chaining", () => {
			const result = route.flag("verbose").flag("env", { required: true });

			assert.equal(result, route);
			assert.equal(route.getFlags().size, 2);
		});

		it("should throw error for invalid flag name", () => {
			assert.throws(
				() => route.flag(""),
				/Flag name must be a non-empty string/,
			);
			assert.throws(
				() => route.flag("   "),
				/Flag name must be a non-empty string/,
			);
			assert.throws(
				() => route.flag(null),
				/Flag name must be a non-empty string/,
			);
		});

		it("should allow multiple flag types", () => {
			route
				.flag("count", { type: "number" })
				.flag("enabled", { type: "boolean" })
				.flag("files", { type: "string", multiple: true });

			const flags = route.getFlags();
			assert.equal(flags.get("count").type, "number");
			assert.equal(flags.get("enabled").type, "boolean");
			assert.equal(flags.get("files").multiple, true);
		});
	});

	describe("getPositionalArgs()", () => {
		it("should return positional arguments from context", () => {
			const route = new CommandRoute("/test");
			const ctx = new MockContext();
			ctx.queryParams.append("positional", "file1.js");
			ctx.queryParams.append("positional", "file2.js");

			const args = route.getPositionalArgs(ctx);
			assert.deepEqual(args, ["file1.js", "file2.js"]);
		});

		it("should return empty array when no positional args", () => {
			const route = new CommandRoute("/test");
			const ctx = new MockContext();

			const args = route.getPositionalArgs(ctx);
			assert.deepEqual(args, []);
		});
	});

	describe("lifecycle hooks", () => {
		class TestCommand extends CommandRoute {
			constructor() {
				super("/test", "Test command");
				this.beforeExecuteCalled = false;
				this.executeCalled = false;
				this.afterExecuteCalled = false;
				this.onErrorCalled = false;
				this.shouldThrowError = false;
			}

			async beforeExecute(ctx) {
				this.beforeExecuteCalled = true;
				ctx.setupData = "initialized";
			}

			async execute(ctx) {
				this.executeCalled = true;
				if (this.shouldThrowError) {
					throw new Error("Test error");
				}
				ctx.result = "success";
			}

			async afterExecute(ctx) {
				this.afterExecuteCalled = true;
				ctx.cleanup = true;
			}

			async onError(_error, ctx) {
				this.onErrorCalled = true;
				ctx.errorHandled = true;
			}
		}

		it("should execute lifecycle hooks in correct order", async () => {
			const command = new TestCommand();
			const ctx = new MockContext();

			await command.handler(ctx);

			assert.equal(command.beforeExecuteCalled, true);
			assert.equal(command.executeCalled, true);
			assert.equal(command.afterExecuteCalled, true);
			assert.equal(command.onErrorCalled, false);

			assert.equal(ctx.setupData, "initialized");
			assert.equal(ctx.result, "success");
			assert.equal(ctx.cleanup, true);
		});

		it("should call onError when execution fails", async () => {
			const command = new TestCommand();
			command.shouldThrowError = true;
			const ctx = new MockContext();

			await command.handler(ctx);

			assert.equal(command.beforeExecuteCalled, true);
			assert.equal(command.executeCalled, true);
			assert.equal(command.afterExecuteCalled, false); // Should not be called after error
			assert.equal(command.onErrorCalled, true);
			assert.equal(ctx.errorHandled, true);
		});

		it("should handle error with default handler when onError not implemented", async () => {
			class MinimalCommand extends CommandRoute {
				constructor() {
					super("/test");
				}

				async execute(_ctx) {
					throw new Error("Test error");
				}
			}

			const command = new MinimalCommand();
			const ctx = new MockContext();

			await command.handler(ctx);

			assert.equal(ctx.responseStatusCode, 500);
			assert.equal(ctx.responseBody, "Error: Test error");
		});

		it("should throw error when execute not implemented", async () => {
			const route = new CommandRoute("/test");
			const ctx = new MockContext();

			await route.handler(ctx);

			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(
				ctx.responseBody.includes("execute() method must be implemented"),
			);
		});
	});

	describe("request body access", () => {
		it("should access request body from context", async () => {
			class TestCommand extends CommandRoute {
				constructor() {
					super("/test");
				}

				async execute(ctx) {
					ctx.result = ctx.requestBody();
				}
			}

			const command = new TestCommand();
			const ctx = new MockContext();
			ctx.setRequestBody(Buffer.from("piped input"));

			await command.handler(ctx);

			assert.equal(ctx.result.toString(), "piped input");
		});
	});

	describe("flag validation", () => {
		let command;
		let ctx;

		beforeEach(() => {
			command = new (class extends CommandRoute {
				constructor() {
					super("/test");
				}
				async execute(_ctx) {
					// No-op for validation tests
				}
			})();
			ctx = new MockContext();
		});

		it("should validate required flags", async () => {
			command.flag("env", { required: true });

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(ctx.responseBody.includes("Missing required flag: --env"));
		});

		it("should pass validation when required flag provided", async () => {
			command.flag("env", { required: true });
			ctx.queryParams.set("env", "production");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});

		it("should validate number type flags", async () => {
			command.flag("port", { type: "number" });
			ctx.queryParams.set("port", "not-a-number");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(ctx.responseBody.includes("Flag --port must be a number"));
		});

		it("should accept valid number flags", async () => {
			command.flag("port", { type: "number" });
			ctx.queryParams.set("port", "3000");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});

		it("should validate boolean type flags", async () => {
			command.flag("verbose", { type: "boolean" });
			ctx.queryParams.set("verbose", "maybe");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(
				ctx.responseBody.includes("Flag --verbose must be true or false"),
			);
		});

		it("should accept valid boolean flags", async () => {
			command.flag("verbose", { type: "boolean" });
			ctx.queryParams.set("verbose", "true");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});

		it("should validate choices constraint", async () => {
			command.flag("env", { choices: ["dev", "staging", "prod"] });
			ctx.queryParams.set("env", "invalid");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(
				ctx.responseBody.includes(
					"Flag --env must be one of: dev, staging, prod",
				),
			);
		});

		it("should accept valid choice values", async () => {
			command.flag("env", { choices: ["dev", "staging", "prod"] });
			ctx.queryParams.set("env", "prod");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});

		it("should validate multiple flag restrictions", async () => {
			command.flag("config", { multiple: false });
			ctx.queryParams.append("config", "config1.js");
			ctx.queryParams.append("config", "config2.js");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(
				ctx.responseBody.includes(
					"Flag --config cannot be specified multiple times",
				),
			);
		});

		it("should allow multiple values when configured", async () => {
			command.flag("files", { multiple: true });
			ctx.queryParams.append("files", "file1.js");
			ctx.queryParams.append("files", "file2.js");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});

		it("should validate all values in multiple flag", async () => {
			command.flag("ports", { type: "number", multiple: true });
			ctx.queryParams.append("ports", "3000");
			ctx.queryParams.append("ports", "invalid");

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 500);
			assert.ok(ctx.responseBody.includes("Flag --ports must be a number"));
		});

		it("should skip validation for optional flags with no value", async () => {
			command.flag("optional", { type: "number" });

			await command.handler(ctx);
			assert.equal(ctx.responseStatusCode, 200);
		});
	});

	describe("ValidationError", () => {
		it("should create validation error with correct name", () => {
			const error = new ValidationError("Test message");

			assert.equal(error.name, "ValidationError");
			assert.equal(error.message, "Test message");
			assert.ok(error instanceof Error);
		});
	});

	describe("integration", () => {
		it("should handle complex command with all features", async () => {
			class ComplexCommand extends CommandRoute {
				constructor() {
					super("/deploy/:environment", "Deploy to environment");
					this.flag("config", { type: "string", required: true });
					this.flag("verbose", { type: "boolean" });
					this.flag("tags", { type: "string", multiple: true });
					this.flag("timeout", { type: "number", default: 300 });
				}

				async beforeExecute(ctx) {
					ctx.initialized = true;
				}

				async execute(ctx) {
					ctx.environment = ctx.pathParams.environment;
					ctx.config = ctx.queryParams.get("config");
					ctx.verbose = ctx.queryParams.get("verbose") === "true";
					ctx.tags = ctx.queryParams.getAll("tags");
					ctx.files = this.getPositionalArgs(ctx);
					ctx.stdin = ctx.requestBody();
				}

				async afterExecute(ctx) {
					ctx.completed = true;
				}
			}

			const command = new ComplexCommand();
			const ctx = new MockContext();

			// Set up context
			ctx.pathParams.environment = "production";
			ctx.queryParams.set("config", "deploy.config.js");
			ctx.queryParams.set("verbose", "true");
			ctx.queryParams.append("tags", "v1.0");
			ctx.queryParams.append("tags", "stable");
			ctx.queryParams.append("positional", "app.js");
			ctx.queryParams.append("positional", "assets/");
			ctx.setRequestBody(Buffer.from('{"key": "value"}'));

			await command.handler(ctx);

			// Verify all aspects work together
			assert.equal(ctx.responseStatusCode, 200);
			assert.equal(ctx.initialized, true);
			assert.equal(ctx.completed, true);
			assert.equal(ctx.environment, "production");
			assert.equal(ctx.config, "deploy.config.js");
			assert.equal(ctx.verbose, true);
			assert.deepEqual(ctx.tags, ["v1.0", "stable"]);
			assert.deepEqual(ctx.files, ["app.js", "assets/"]);
			assert.equal(ctx.stdin.toString(), '{"key": "value"}');
		});
	});
});
