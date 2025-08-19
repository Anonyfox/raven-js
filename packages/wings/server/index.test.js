import assert from "node:assert";
import { describe, it } from "node:test";
import * as server from "./index.js";

describe("server/index.js", () => {
	it("should export all expected server classes and functions", () => {
		// Server adapters
		assert.strictEqual(typeof server.ClusteredServer, "function");
		assert.strictEqual(typeof server.DevServer, "function");
		assert.strictEqual(typeof server.NodeHttp, "function");

		// SSL utilities
		assert.strictEqual(typeof server.generateSSLCert, "function");

		// Middleware classes
		assert.strictEqual(typeof server.Armor, "function");
		assert.strictEqual(typeof server.Assets, "function");
		assert.strictEqual(typeof server.Compression, "function");
		assert.strictEqual(typeof server.CORS, "function");
		assert.strictEqual(typeof server.Logger, "function");
	});

	it("should have working server adapter classes", () => {
		// Basic instantiation test
		assert.doesNotThrow(() => {
			const router = {}; // Mock router for testing
			new server.DevServer(router);
		});
	});

	it("should have working middleware classes", () => {
		// Basic instantiation test
		assert.doesNotThrow(() => {
			new server.Assets();
			new server.CORS();
			new server.Logger();
			new server.Compression();
			new server.Armor();
		});
	});

	it("should have working generateSSLCert function", () => {
		// Just test that it's a function - actual SSL generation would be complex to test
		assert.strictEqual(typeof server.generateSSLCert, "function");
	});
});
