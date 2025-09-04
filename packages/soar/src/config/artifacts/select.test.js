/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for artifact selection function.
 *
 * Tests the pure function that selects and instantiates the correct
 * artifact class based on configuration type property.
 */

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { Base } from "./base.js";
import { BinaryArtifact } from "./binary.js";
import { ScriptArtifact } from "./script.js";
import { selectArtifact } from "./select.js";
import { StaticArtifact } from "./static.js";

describe("selectArtifact", () => {
	let tempDir;

	beforeEach(() => {
		// Create temporary directory for static tests
		tempDir = mkdtempSync(join(tmpdir(), "soar-select-test-"));
		// Create a test file so the directory isn't empty
		writeFileSync(join(tempDir, "test.html"), "<html>test</html>");
	});

	afterEach(() => {
		// Clean up temporary directory
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
	describe("input validation", () => {
		it("should throw error when config is not an object", () => {
			assert.throws(() => selectArtifact(null), {
				name: "Error",
				message: "Artifact config must be an object",
			});

			assert.throws(() => selectArtifact(undefined), {
				name: "Error",
				message: "Artifact config must be an object",
			});

			assert.throws(() => selectArtifact("string"), {
				name: "Error",
				message: "Artifact config must be an object",
			});

			assert.throws(() => selectArtifact(123), {
				name: "Error",
				message: "Artifact config must be an object",
			});
		});

		it("should throw error when type property is missing", () => {
			assert.throws(() => selectArtifact({}), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});

			assert.throws(() => selectArtifact({ path: "./app" }), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});
		});

		it("should throw error when type property is not a string", () => {
			assert.throws(() => selectArtifact({ type: 123 }), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});

			assert.throws(() => selectArtifact({ type: null }), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});

			assert.throws(() => selectArtifact({ type: {} }), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});
		});
	});

	describe("artifact selection", () => {
		it("should create BinaryArtifact instance for binary type", () => {
			const config = {
				type: "binary",
				path: "./myapp",
			};

			const artifact = selectArtifact(config);

			assert.ok(artifact instanceof BinaryArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getType(), "binary");
			assert.strictEqual(artifact.getPath(), "./myapp");
		});

		it("should create ScriptArtifact instance for script type", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
			};

			const artifact = selectArtifact(config);

			assert.ok(artifact instanceof ScriptArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getType(), "script");
			assert.strictEqual(artifact.getPath(), "./app.js");
			assert.strictEqual(artifact.getRuntime(), "node");
		});

		it("should create StaticArtifact instance for static type", () => {
			const config = {
				type: "static",
				path: "./dist",
			};

			const artifact = selectArtifact(config);

			assert.ok(artifact instanceof StaticArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getType(), "static");
			assert.strictEqual(artifact.getPath(), "./dist");
		});

		it("should pass all config properties to BinaryArtifact", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "x64",
				platform: "linux",
			};

			const artifact = selectArtifact(config);

			assert.strictEqual(artifact.getPath(), "./myapp");
			assert.strictEqual(artifact.getArchitecture(), "x64");
			assert.strictEqual(artifact.getPlatform(), "linux");
		});

		it("should pass all config properties to ScriptArtifact", () => {
			const config = {
				type: "script",
				path: "./app.py",
				runtime: "python3",
				args: ["-u"],
				hasShebang: true,
			};

			const artifact = selectArtifact(config);

			assert.strictEqual(artifact.getPath(), "./app.py");
			assert.strictEqual(artifact.getRuntime(), "python3");
			assert.deepStrictEqual(artifact.getArgs(), ["-u"]);
			assert.strictEqual(artifact.getHasShebang(), true);
		});

		it("should pass all config properties to StaticArtifact", () => {
			const config = {
				type: "static",
				path: "./public",
				indexFile: "main.html",
				excludePatterns: ["*.tmp"],
			};

			const artifact = selectArtifact(config);

			assert.strictEqual(artifact.getPath(), "./public");
			assert.strictEqual(artifact.getIndexFile(), "main.html");
			assert.deepStrictEqual(artifact.getExcludePatterns(), ["*.tmp"]);
		});

		it("should throw error for unsupported artifact types", () => {
			const unsupportedTypes = [
				"unknown-type",
				"docker", // Not implemented
				"container", // Not implemented
				"lambda", // Not implemented
				"function", // Not implemented
			];

			for (const type of unsupportedTypes) {
				assert.throws(
					() => selectArtifact({ type: type, path: "./app" }),
					{
						name: "Error",
						message: `Unsupported artifact type: ${type}`,
					},
					`Should throw error for unsupported type: ${type}`,
				);
			}
		});
	});

	describe("error propagation", () => {
		it("should propagate validation errors from artifact constructors", () => {
			const config = {
				type: "binary",
				path: "", // Invalid path
			};

			// BinaryArtifact should throw error due to empty path
			assert.throws(() => selectArtifact(config), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});
		});

		it("should propagate type validation errors", () => {
			const config = {
				type: "wrong-type",
				path: "./app",
			};

			// Should throw error for unsupported type in selectArtifact
			assert.throws(() => selectArtifact(config), {
				name: "Error",
				message: "Unsupported artifact type: wrong-type",
			});
		});
	});

	describe("edge cases", () => {
		it("should handle empty string type", () => {
			assert.throws(() => selectArtifact({ type: "" }), {
				name: "Error",
				message: 'Artifact config must have a "type" property',
			});
		});

		it("should handle whitespace-only type", () => {
			assert.throws(() => selectArtifact({ type: "   " }), {
				name: "Error",
				message: "Unsupported artifact type:    ",
			});
		});

		it("should be case-sensitive for artifact types", () => {
			assert.throws(() => selectArtifact({ type: "BINARY", path: "./app" }), {
				name: "Error",
				message: "Unsupported artifact type: BINARY",
			});

			assert.throws(() => selectArtifact({ type: "Script", path: "./app" }), {
				name: "Error",
				message: "Unsupported artifact type: Script",
			});

			assert.throws(() => selectArtifact({ type: "Static", path: "./app" }), {
				name: "Error",
				message: "Unsupported artifact type: Static",
			});
		});

		it("should handle complex configuration objects", () => {
			const config = {
				type: "script",
				path: "./complex/path/to/app.js",
				runtime: "node",
				args: ["--experimental-modules", "--max-old-space-size=4096"],
				hasShebang: false,
				// Extra properties should be ignored
				extraProperty: "ignored",
				metadata: { version: "1.0.0" },
			};

			const artifact = selectArtifact(config);

			assert.ok(artifact instanceof ScriptArtifact);
			assert.strictEqual(artifact.getPath(), "./complex/path/to/app.js");
			assert.strictEqual(artifact.getRuntime(), "node");
			assert.deepStrictEqual(artifact.getArgs(), [
				"--experimental-modules",
				"--max-old-space-size=4096",
			]);
		});
	});

	describe("integration", () => {
		it("should create artifacts that validate successfully", () => {
			const configs = [
				{
					type: "binary",
					path: "./myapp",
					architecture: "x64",
					platform: "linux",
				},
				{
					type: "script",
					path: "./app.js",
					runtime: "node",
				},
				{
					type: "static",
					path: "./dist",
					indexFile: "index.html",
				},
			];

			for (const config of configs) {
				const artifact = selectArtifact(config);
				const errors = artifact.validate();

				assert.strictEqual(
					errors.length,
					0,
					`Artifact of type ${config.type} should validate successfully`,
				);
			}
		});

		it("should create artifacts that can be prepared", async () => {
			const configs = [
				{
					type: "binary",
					path: "./myapp",
				},
				{
					type: "script",
					path: "./app.js",
					runtime: "node",
				},
				{
					type: "static",
					path: tempDir, // Use temporary directory with actual files
				},
			];

			for (const config of configs) {
				const artifact = selectArtifact(config);
				const result = await artifact.prepare();

				assert.ok(typeof result === "object");
				assert.strictEqual(result.type, config.type);
				assert.strictEqual(result.path, config.path);
			}
		});
	});
});
