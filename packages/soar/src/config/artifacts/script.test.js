/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for ScriptArtifact class.
 *
 * Comprehensive tests for the script artifact implementation
 * including runtime configuration and execution command generation.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { ScriptArtifact } from "./script.js";

describe("ScriptArtifact", () => {
	describe("constructor", () => {
		it("should create instance with runtime", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
			};

			const artifact = new ScriptArtifact(config);

			assert.ok(artifact instanceof ScriptArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getPath(), "./app.js");
			assert.strictEqual(artifact.getRuntime(), "node");
			assert.deepStrictEqual(artifact.getArgs(), []);
			assert.strictEqual(artifact.getHasShebang(), false);
		});

		it("should create instance with shebang", () => {
			const config = {
				type: "script",
				path: "./app.py",
				hasShebang: true,
			};

			const artifact = new ScriptArtifact(config);

			assert.strictEqual(artifact.getRuntime(), null);
			assert.strictEqual(artifact.getHasShebang(), true);
		});

		it("should create instance with runtime and args", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: ["--experimental-modules", "--max-old-space-size=4096"],
			};

			const artifact = new ScriptArtifact(config);

			assert.strictEqual(artifact.getRuntime(), "node");
			assert.deepStrictEqual(artifact.getArgs(), [
				"--experimental-modules",
				"--max-old-space-size=4096",
			]);
		});

		it("should throw error for wrong type", () => {
			const config = {
				type: "wrong-type",
				path: "./app.js",
			};

			assert.throws(() => new ScriptArtifact(config), {
				name: "Error",
				message: "Artifact type must be 'script' for ScriptArtifact instances",
			});
		});

		it("should inherit path validation from base class", () => {
			const config = {
				type: "script",
				path: "",
			};

			assert.throws(() => new ScriptArtifact(config), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});
		});
	});

	describe("getters", () => {
		it("should return correct values", () => {
			const config = {
				type: "script",
				path: "./server.js",
				runtime: "node",
				args: ["--inspect"],
				hasShebang: false,
			};

			const artifact = new ScriptArtifact(config);

			assert.strictEqual(artifact.getPath(), "./server.js");
			assert.strictEqual(artifact.getType(), "script");
			assert.strictEqual(artifact.getRuntime(), "node");
			assert.deepStrictEqual(artifact.getArgs(), ["--inspect"]);
			assert.strictEqual(artifact.getHasShebang(), false);
		});

		it("should return defensive copy of args", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: ["--flag"],
			};

			const artifact = new ScriptArtifact(config);
			const args1 = artifact.getArgs();
			const args2 = artifact.getArgs();

			// Should be different array instances
			assert.notStrictEqual(args1, args2);
			// But with same content
			assert.deepStrictEqual(args1, args2);

			// Modifying returned array shouldn't affect internal state
			args1.push("--new-flag");
			assert.deepStrictEqual(artifact.getArgs(), ["--flag"]);
		});
	});

	describe("validate", () => {
		it("should return empty array for valid runtime config", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should return empty array for valid shebang config", () => {
			const config = {
				type: "script",
				path: "./app.py",
				hasShebang: true,
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.strictEqual(errors.length, 0);
		});

		it("should require either runtime or shebang", () => {
			const config = {
				type: "script",
				path: "./app.js",
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes(
						"must specify either a runtime command or have a shebang",
					),
				),
			);
		});

		it("should validate runtime format", () => {
			const invalidRuntimes = ["", "   "];

			for (const runtime of invalidRuntimes) {
				const config = {
					type: "script",
					path: "./app.js",
					runtime: runtime,
				};

				const artifact = new ScriptArtifact(config);
				const errors = artifact.validate();

				assert.ok(
					errors.length > 0,
					`Should have validation errors for runtime: ${runtime}`,
				);
				assert.ok(
					errors.some((error) =>
						error.message.includes("Runtime must be a non-empty string"),
					),
				);
			}
		});

		it("should validate args format", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: "not-an-array", // Invalid
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Runtime args must be an array"),
				),
			);
		});

		it("should validate individual args are strings", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: ["--flag", 123, "--another-flag"], // 123 is invalid
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) =>
					error.message.includes("Runtime arg at index 1 must be a string"),
				),
			);
		});

		it("should allow both runtime and shebang", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				hasShebang: true,
			};

			const artifact = new ScriptArtifact(config);
			const errors = artifact.validate();

			assert.strictEqual(errors.length, 0);
		});
	});

	describe("prepare", () => {
		it("should return deployment info for runtime-based script", async () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: ["--inspect"],
			};

			const artifact = new ScriptArtifact(config);
			const result = await artifact.prepare();

			assert.ok(typeof result === "object");
			assert.strictEqual(result.type, "script");
			assert.strictEqual(result.path, "./app.js");
			assert.strictEqual(result.runtime, "node");
			assert.deepStrictEqual(result.args, ["--inspect"]);
			assert.strictEqual(result.hasShebang, false);
			assert.strictEqual(result.executable, false);
			assert.deepStrictEqual(result.command, ["node", "--inspect", "./app.js"]);
		});

		it("should return deployment info for shebang-based script", async () => {
			const config = {
				type: "script",
				path: "./app.py",
				hasShebang: true,
			};

			const artifact = new ScriptArtifact(config);
			const result = await artifact.prepare();

			assert.strictEqual(result.runtime, null);
			assert.strictEqual(result.hasShebang, true);
			assert.strictEqual(result.executable, true);
			assert.deepStrictEqual(result.command, ["./app.py"]);
		});

		it("should prefer shebang over runtime in command generation", async () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				hasShebang: true,
			};

			const artifact = new ScriptArtifact(config);
			const result = await artifact.prepare();

			// Should use shebang for command
			assert.deepStrictEqual(result.command, ["./app.js"]);
			assert.strictEqual(result.executable, true);
			// But still preserve runtime info
			assert.strictEqual(result.runtime, "node");
		});

		it("should throw error when validation fails", async () => {
			const config = {
				type: "script",
				path: "./app.js",
				// No runtime or shebang
			};

			const artifact = new ScriptArtifact(config);

			await assert.rejects(() => artifact.prepare(), {
				name: "Error",
				message: /Script artifact validation failed/,
			});
		});

		it("should handle complex runtime commands", async () => {
			const config = {
				type: "script",
				path: "./app.ts",
				runtime: "deno",
				args: ["run", "--allow-net", "--allow-read"],
			};

			const artifact = new ScriptArtifact(config);
			const result = await artifact.prepare();

			assert.deepStrictEqual(result.command, [
				"deno",
				"run",
				"--allow-net",
				"--allow-read",
				"./app.ts",
			]);
		});
	});

	describe("edge cases", () => {
		it("should handle empty args array", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "node",
				args: [],
			};

			const artifact = new ScriptArtifact(config);
			assert.deepStrictEqual(artifact.getArgs(), []);

			const errors = artifact.validate();
			assert.strictEqual(errors.length, 0);
		});

		it("should handle various script extensions", () => {
			const extensions = [".js", ".py", ".rb", ".sh", ".pl"];

			for (const ext of extensions) {
				const config = {
					type: "script",
					path: `./app${ext}`,
					hasShebang: true,
				};

				const artifact = new ScriptArtifact(config);
				assert.strictEqual(artifact.getPath(), `./app${ext}`);

				const errors = artifact.validate();
				assert.strictEqual(errors.length, 0);
			}
		});

		it("should handle runtime with spaces", () => {
			const config = {
				type: "script",
				path: "./app.js",
				runtime: "  node  ", // Will be trimmed by validation
			};

			const artifact = new ScriptArtifact(config);
			// Constructor doesn't trim, but validation should catch empty after trim
			const errors = artifact.validate();
			assert.strictEqual(errors.length, 0); // "  node  " is valid
		});
	});
});
