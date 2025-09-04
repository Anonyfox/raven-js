/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for artifacts module exports.
 *
 * Tests the public API of the artifacts module, ensuring only the correct
 * classes and functions are exported and that they work correctly.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { BinaryArtifact } from "./binary.js";
import * as artifacts from "./index.js";
import { ScriptArtifact } from "./script.js";
import { selectArtifact } from "./select.js";
import { StaticArtifact } from "./static.js";

describe("artifacts module", () => {
	describe("exports", () => {
		it("should export BinaryArtifact class", () => {
			assert.ok(typeof artifacts.BinaryArtifact === "function");
			assert.strictEqual(artifacts.BinaryArtifact, BinaryArtifact);
		});

		it("should export ScriptArtifact class", () => {
			assert.ok(typeof artifacts.ScriptArtifact === "function");
			assert.strictEqual(artifacts.ScriptArtifact, ScriptArtifact);
		});

		it("should export StaticArtifact class", () => {
			assert.ok(typeof artifacts.StaticArtifact === "function");
			assert.strictEqual(artifacts.StaticArtifact, StaticArtifact);
		});

		it("should export selectArtifact function", () => {
			assert.ok(typeof artifacts.selectArtifact === "function");
			assert.strictEqual(artifacts.selectArtifact, selectArtifact);
		});

		it("should not export Base class", () => {
			// Base class should be internal abstraction
			assert.strictEqual(artifacts.Base, undefined);
		});

		it("should have expected number of exports", () => {
			const exportNames = Object.keys(artifacts);

			// Should only export concrete artifact classes and utility functions
			assert.deepStrictEqual(exportNames.sort(), [
				"BinaryArtifact",
				"ScriptArtifact",
				"StaticArtifact",
				"selectArtifact",
			]);
		});
	});

	describe("BinaryArtifact export", () => {
		it("should create working BinaryArtifact instances", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "x64",
			};

			const artifact = new artifacts.BinaryArtifact(config);

			assert.ok(artifact instanceof BinaryArtifact);
			assert.strictEqual(artifact.getType(), "binary");
			assert.strictEqual(artifact.getPath(), "./myapp");
			assert.strictEqual(artifact.getArchitecture(), "x64");
		});
	});

	describe("ScriptArtifact export", () => {
		it("should create working ScriptArtifact instances", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
			};

			const artifact = new artifacts.ScriptArtifact(config);

			assert.ok(artifact instanceof ScriptArtifact);
			assert.strictEqual(artifact.getType(), "script");
			assert.strictEqual(artifact.getPath(), "./app.js");
			assert.strictEqual(artifact.getRuntime(), "node");
		});
	});

	describe("StaticArtifact export", () => {
		it("should create working StaticArtifact instances", () => {
			const config = {
				type: "static",
				path: "./dist",
				indexFile: "main.html",
			};

			const artifact = new artifacts.StaticArtifact(config);

			assert.ok(artifact instanceof StaticArtifact);
			assert.strictEqual(artifact.getType(), "static");
			assert.strictEqual(artifact.getPath(), "./dist");
			assert.strictEqual(artifact.getIndexFile(), "main.html");
		});
	});

	describe("selectArtifact export", () => {
		it("should create BinaryArtifact via selectArtifact", () => {
			const config = {
				type: "binary",
				path: "./myapp",
			};

			const artifact = artifacts.selectArtifact(config);

			assert.ok(artifact instanceof BinaryArtifact);
			assert.strictEqual(artifact.getType(), "binary");
			assert.strictEqual(artifact.getPath(), "./myapp");
		});

		it("should create ScriptArtifact via selectArtifact", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
			};

			const artifact = artifacts.selectArtifact(config);

			assert.ok(artifact instanceof ScriptArtifact);
			assert.strictEqual(artifact.getType(), "script");
			assert.strictEqual(artifact.getPath(), "./app.js");
		});

		it("should create StaticArtifact via selectArtifact", () => {
			const config = {
				type: "static",
				path: "./dist",
			};

			const artifact = artifacts.selectArtifact(config);

			assert.ok(artifact instanceof StaticArtifact);
			assert.strictEqual(artifact.getType(), "static");
			assert.strictEqual(artifact.getPath(), "./dist");
		});

		it("should throw error for unsupported artifacts", () => {
			assert.throws(
				() => artifacts.selectArtifact({ type: "unsupported-type" }),
				{
					name: "Error",
					message: "Unsupported artifact type: unsupported-type",
				},
			);
		});
	});

	describe("integration", () => {
		it("should work together - selectArtifact creates instances of exported classes", () => {
			const configs = [
				{ type: "binary", path: "./app" },
				{ type: "script", path: "./app.js", runtime: "node" },
				{ type: "static", path: "./dist" },
			];

			for (const config of configs) {
				// Use selectArtifact to create instance
				const selectedArtifact = artifacts.selectArtifact(config);

				// Create instance directly from exported class
				let directArtifact;
				switch (config.type) {
					case "binary":
						directArtifact = new artifacts.BinaryArtifact(config);
						break;
					case "script":
						directArtifact = new artifacts.ScriptArtifact(config);
						break;
					case "static":
						directArtifact = new artifacts.StaticArtifact(config);
						break;
				}

				// Both should be instances of the same class
				assert.strictEqual(
					selectedArtifact.constructor,
					directArtifact.constructor,
				);

				// Both should have same configuration
				assert.strictEqual(
					selectedArtifact.getType(),
					directArtifact.getType(),
				);
				assert.strictEqual(
					selectedArtifact.getPath(),
					directArtifact.getPath(),
				);
			}
		});

		it("should validate instances created through both methods", () => {
			const configs = [
				{ type: "binary", path: "./app" },
				{ type: "script", path: "./app.js", runtime: "node" },
				{ type: "static", path: "./dist" },
			];

			for (const config of configs) {
				const selectedArtifact = artifacts.selectArtifact(config);

				let directArtifact;
				switch (config.type) {
					case "binary":
						directArtifact = new artifacts.BinaryArtifact(config);
						break;
					case "script":
						directArtifact = new artifacts.ScriptArtifact(config);
						break;
					case "static":
						directArtifact = new artifacts.StaticArtifact(config);
						break;
				}

				// Both should validate successfully
				const selectedErrors = selectedArtifact.validate();
				const directErrors = directArtifact.validate();

				assert.strictEqual(selectedErrors.length, 0);
				assert.strictEqual(directErrors.length, 0);
			}
		});
	});

	describe("future compatibility", () => {
		it("should maintain stable API surface", () => {
			// This test documents the current API and will catch breaking changes
			const expectedExports = [
				"BinaryArtifact",
				"ScriptArtifact",
				"StaticArtifact",
				"selectArtifact",
			];

			const actualExports = Object.keys(artifacts).sort();

			assert.deepStrictEqual(
				actualExports,
				expectedExports.sort(),
				"API surface changed - review for breaking changes",
			);
		});

		it("should maintain artifact class interfaces", () => {
			const configs = [
				{ type: "binary", path: "./app" },
				{ type: "script", path: "./app.js", runtime: "node" },
				{ type: "static", path: "./dist" },
			];

			// Document expected instance methods
			const expectedInstanceMethods = [
				"getPath",
				"getType",
				"validate",
				"prepare",
			];

			for (const config of configs) {
				const artifact = artifacts.selectArtifact(config);

				for (const method of expectedInstanceMethods) {
					assert.ok(
						typeof artifact[method] === "function",
						`Expected instance method ${method} not found on ${config.type} artifact`,
					);
				}
			}
		});
	});
});
