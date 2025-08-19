import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Router } from "../core/index.js";
import { Terminal } from "./runtime.js";

describe("Terminal", () => {
	/** @type {Router} */
	let router;
	/** @type {Terminal} */
	let terminal;

	beforeEach(() => {
		router = new Router();
		terminal = new Terminal(router);
	});

	describe("constructor", () => {
		it("should create terminal with valid router", () => {
			const terminal = new Terminal(router);
			assert.equal(terminal.router, router);
		});

		it("should throw error with invalid router", () => {
			assert.throws(() => new Terminal(null), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});

			assert.throws(() => new Terminal({}), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});

			assert.throws(() => new Terminal("not a router"), {
				name: "TypeError",
				message: "Router must be a valid Wings Router instance",
			});
		});
	});

	describe("router property", () => {
		it("should return the router instance", () => {
			assert.equal(terminal.router, router);
			assert.equal(typeof terminal.router.handleRequest, "function");
		});
	});

	describe("cmd route integration", () => {
		it("should work with router cmd() method", () => {
			// Test that terminal works with the new cmd() method
			router.cmd("/test", (ctx) => {
				ctx.text("Test command executed");
			});

			const routes = router.listRoutes("COMMAND");
			assert.equal(routes.length, 1);
			assert.equal(routes[0].method, "COMMAND");
			assert.equal(routes[0].path, "/test");
		});

		it("should handle multiple command routes", () => {
			router
				.cmd("/git/status", (ctx) => ctx.text("Clean working tree"))
				.cmd("/git/commit", (ctx) => ctx.text("Committed"))
				.cmd("/deploy/:env", (ctx) =>
					ctx.text(`Deployed to ${ctx.pathParams.env}`),
				);

			const routes = router.listRoutes("COMMAND");
			assert.equal(routes.length, 3);

			const paths = routes.map((r) => r.path);
			assert.ok(paths.includes("/git/status"));
			assert.ok(paths.includes("/git/commit"));
			assert.ok(paths.includes("/deploy/:env"));
		});
	});

	describe("Context integration", () => {
		it("should handle COMMAND method in router", async () => {
			let capturedContext = null;

			router.cmd("/test", (ctx) => {
				capturedContext = ctx;
				ctx.text("Command executed");
			});

			// Simulate what run() would do - create context manually
			const urlObj = new URL("/test", "file://localhost");
			const { Context } = await import("../core/index.js");
			const context = new Context("COMMAND", urlObj, new Headers());

			await router.handleRequest(context);

			assert.equal(capturedContext.method, "COMMAND");
			assert.equal(capturedContext.path, "/test");
			assert.equal(context.responseBody, "Command executed");
		});
	});
});
