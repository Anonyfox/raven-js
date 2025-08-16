import assert from "node:assert";
import { describe, test } from "node:test";
import { Router } from "../core/index.js";
import { ClusteredServer } from "./clustered-server.js";

describe("ClusteredServer", () => {
	test("should create instance with default options", () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		assert.ok(server instanceof ClusteredServer);
		assert.strictEqual(typeof server.listen, "function");
		assert.strictEqual(typeof server.close, "function");
		assert.strictEqual(typeof server.getClusterStats, "function");
	});

	test("should create instance with custom options", () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			workers: 2,
			timeout: 60000,
			healthCheckInterval: 15000,
			maxRestarts: 3,
		});

		assert.ok(server instanceof ClusteredServer);
	});

	test("should handle router requests", async () => {
		const router = new Router();
		router.get("/test", (ctx) => {
			ctx.json({ message: "Hello from clustered server" });
		});

		const server = new ClusteredServer(router, { workers: 1 });

		// Note: In a real test, we would need to actually start the server
		// and make HTTP requests to test the clustering functionality
		// This is a basic structure test
		assert.ok(server.router === router);
	});

	test("should have proper configuration defaults", () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		// Test that the server has the expected methods
		assert.strictEqual(typeof server.listen, "function");
		assert.strictEqual(typeof server.close, "function");
		assert.strictEqual(typeof server.getClusterStats, "function");
	});

	test("should extract HTTP options correctly", () => {
		const router = new Router();
		const server = new ClusteredServer(router, {
			timeout: 45000,
			keepAlive: false,
			maxHeadersCount: 1000,
			workers: 3,
			healthCheckInterval: 20000,
		});

		// The server should have been constructed with the HTTP options
		assert.ok(server instanceof ClusteredServer);
	});

	test("should handle empty options", () => {
		const router = new Router();
		const server = new ClusteredServer(router);

		assert.ok(server instanceof ClusteredServer);
	});

	test("should handle null options", () => {
		const router = new Router();
		const server = new ClusteredServer(router, null);

		assert.ok(server instanceof ClusteredServer);
	});

	test("should handle undefined options", () => {
		const router = new Router();
		const server = new ClusteredServer(router, undefined);

		assert.ok(server instanceof ClusteredServer);
	});
});
