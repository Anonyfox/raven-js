/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for StaticArtifact class.
 *
 * Comprehensive tests for the static artifact implementation
 * including index file and exclude pattern configuration.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { StaticArtifact } from "./static.js";

describe("StaticArtifact", () => {
	describe("constructor", () => {
		it("should create instance with minimal config", () => {
			const config = {
				type: "static",
				path: "./dist",
			};

			const artifact = new StaticArtifact(config);

			assert.ok(artifact instanceof StaticArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getPath(), "./dist");
			assert.strictEqual(artifact.getIndexFile(), "index.html");
			assert.deepStrictEqual(artifact.getExcludePatterns(), []);
		});

		it("should create instance with full config", () => {
			const config = {
				type: "static",
				path: "./public",
				indexFile: "main.html",
				excludePatterns: ["*.tmp", "node_modules/**", ".DS_Store"],
			};

			const artifact = new StaticArtifact(config);

			assert.strictEqual(artifact.getPath(), "./public");
			assert.strictEqual(artifact.getIndexFile(), "main.html");
			assert.deepStrictEqual(artifact.getExcludePatterns(), [
				"*.tmp",
				"node_modules/**",
				".DS_Store",
			]);
		});

		it("should throw error for wrong type", () => {
			const config = {
				type: "wrong-type",
				path: "./dist",
			};

			assert.throws(() => new StaticArtifact(config), {
				name: "Error",
				message: "Artifact type must be 'static' for StaticArtifact instances",
			});
		});

		it("should inherit path validation from base class", () => {
			const config = {
				type: "static",
				path: "",
			};

			assert.throws(() => new StaticArtifact(config), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});
		});
	});

	describe("getters", () => {
		it("should return correct values", () => {
			const config = {
				type: "static",
				path: "./build",
				indexFile: "start.html",
				excludePatterns: ["*.log", "temp/**"],
			};

			const artifact = new StaticArtifact(config);

			assert.strictEqual(artifact.getPath(), "./build");
			assert.strictEqual(artifact.getType(), "static");
			assert.strictEqual(artifact.getIndexFile(), "start.html");
			assert.deepStrictEqual(artifact.getExcludePatterns(), [
				"*.log",
				"temp/**",
			]);
		});

		it("should return defensive copy of exclude patterns", () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: ["*.tmp"],
			};

			const artifact = new StaticArtifact(config);
			const patterns1 = artifact.getExcludePatterns();
			const patterns2 = artifact.getExcludePatterns();

			// Should be different array instances
			assert.notStrictEqual(patterns1, patterns2);
			// But with same content
			assert.deepStrictEqual(patterns1, patterns2);

			// Modifying returned array shouldn't affect internal state
			patterns1.push("*.log");
			assert.deepStrictEqual(artifact.getExcludePatterns(), ["*.tmp"]);
		});

		it("should handle default values", () => {
			const config = {
				type: "static",
				path: "./dist",
			};

			const artifact = new StaticArtifact(config);

			assert.strictEqual(artifact.getIndexFile(), "index.html");
			assert.deepStrictEqual(artifact.getExcludePatterns(), []);
		});
	});

	describe("validate", () => {
		it("should return empty array for valid config", () => {
			const config = {
				type: "static",
				path: "./dist",
				indexFile: "index.html",
				excludePatterns: ["*.tmp", "node_modules/**"],
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should validate index file format", () => {
			// Only test values that would actually be invalid after constructor defaults
			const invalidIndexFiles = ["", "   "];

			for (const indexFile of invalidIndexFiles) {
				const config = {
					type: "static",
					path: "./dist",
					indexFile: indexFile,
				};

				const artifact = new StaticArtifact(config);
				const errors = artifact.validate();

				assert.ok(
					errors.length > 0,
					`Should have validation errors for indexFile: ${indexFile}`,
				);
				assert.ok(
					errors.some((error) =>
						error.message.includes("Index file must be a non-empty string"),
					),
				);
			}
		});

		it("should validate exclude patterns format", () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: "not-an-array", // Invalid
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Exclude patterns must be an array"),
				),
			);
		});

		it("should validate individual exclude patterns are strings", () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: ["*.tmp", 123, "*.log"], // 123 is invalid
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Exclude pattern at index 1 must be a string"),
				),
			);
		});

		it("should allow empty exclude patterns array", () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: [],
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			assert.strictEqual(errors.length, 0);
		});
	});

	describe("prepare", () => {
		it("should return deployment info for valid artifact", async () => {
			const config = {
				type: "static",
				path: "./dist",
				indexFile: "index.html",
				excludePatterns: ["*.tmp", "node_modules/**"],
			};

			const artifact = new StaticArtifact(config);
			const result = await artifact.prepare();

			assert.ok(typeof result === "object");
			assert.strictEqual(result.type, "static");
			assert.strictEqual(result.path, "./dist");
			assert.strictEqual(result.indexFile, "index.html");
			assert.deepStrictEqual(result.excludePatterns, [
				"*.tmp",
				"node_modules/**",
			]);
			assert.strictEqual(result.executable, false);
			assert.strictEqual(result.runtime, null);
		});

		it("should handle default values in result", async () => {
			const config = {
				type: "static",
				path: "./public",
			};

			const artifact = new StaticArtifact(config);
			const result = await artifact.prepare();

			assert.strictEqual(result.indexFile, "index.html");
			assert.deepStrictEqual(result.excludePatterns, []);
			assert.strictEqual(result.executable, false);
			assert.strictEqual(result.runtime, null);
		});

		it("should throw error when validation fails", async () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: "not-an-array", // Invalid - should be array
			};

			const artifact = new StaticArtifact(config);

			await assert.rejects(() => artifact.prepare(), {
				name: "Error",
				message: /Static artifact validation failed/,
			});
		});
	});

	describe("edge cases", () => {
		it("should handle various index file names", () => {
			const indexFiles = [
				"index.html",
				"main.html",
				"default.htm",
				"start.xhtml",
				"home.php",
			];

			for (const indexFile of indexFiles) {
				const config = {
					type: "static",
					path: "./dist",
					indexFile: indexFile,
				};

				const artifact = new StaticArtifact(config);
				assert.strictEqual(artifact.getIndexFile(), indexFile);

				const errors = artifact.validate();
				assert.strictEqual(errors.length, 0);
			}
		});

		it("should handle complex exclude patterns", () => {
			const config = {
				type: "static",
				path: "./dist",
				excludePatterns: [
					"**/*.tmp",
					"**/node_modules/**",
					"**/.git/**",
					"*.log",
					"temp/**/*",
					".DS_Store",
					"Thumbs.db",
				],
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			assert.strictEqual(errors.length, 0);
			assert.strictEqual(artifact.getExcludePatterns().length, 7);
		});

		it("should handle paths with various formats", () => {
			const paths = [
				"./dist",
				"../build",
				"/absolute/path/to/static",
				"relative/path",
				"dist/",
				"./public/assets",
			];

			for (const path of paths) {
				const config = {
					type: "static",
					path: path,
				};

				const artifact = new StaticArtifact(config);
				assert.strictEqual(artifact.getPath(), path);

				const errors = artifact.validate();
				assert.strictEqual(errors.length, 0);
			}
		});

		it("should handle whitespace in index file validation", () => {
			const config = {
				type: "static",
				path: "./dist",
				indexFile: "  index.html  ", // Has whitespace but not empty after trim
			};

			const artifact = new StaticArtifact(config);
			const errors = artifact.validate();

			// Should be valid since the string is not empty after trim
			assert.strictEqual(errors.length, 0);
		});
	});
});
