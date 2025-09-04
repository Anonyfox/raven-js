/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for BinaryArtifact class.
 *
 * Comprehensive tests for the binary artifact implementation
 * including configuration validation and deployment preparation.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Base } from "./base.js";
import { BinaryArtifact } from "./binary.js";

describe("BinaryArtifact", () => {
	describe("constructor", () => {
		it("should create instance with minimal config", () => {
			const config = {
				type: "binary",
				path: "./myapp",
			};

			const artifact = new BinaryArtifact(config);

			assert.ok(artifact instanceof BinaryArtifact);
			assert.ok(artifact instanceof Base);
			assert.strictEqual(artifact.getPath(), "./myapp");
			assert.strictEqual(artifact.getArchitecture(), null);
			assert.strictEqual(artifact.getPlatform(), null);
		});

		it("should create instance with full config", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "x64",
				platform: "linux",
			};

			const artifact = new BinaryArtifact(config);

			assert.strictEqual(artifact.getPath(), "./myapp");
			assert.strictEqual(artifact.getArchitecture(), "x64");
			assert.strictEqual(artifact.getPlatform(), "linux");
		});

		it("should throw error for wrong type", () => {
			const config = {
				type: "wrong-type",
				path: "./myapp",
			};

			assert.throws(() => new BinaryArtifact(config), {
				name: "Error",
				message: "Artifact type must be 'binary' for BinaryArtifact instances",
			});
		});

		it("should inherit path validation from base class", () => {
			const config = {
				type: "binary",
				path: "",
			};

			assert.throws(() => new BinaryArtifact(config), {
				name: "Error",
				message: "Artifact path cannot be empty",
			});
		});
	});

	describe("getters", () => {
		it("should return correct values", () => {
			const config = {
				type: "binary",
				path: "./dist/myapp",
				architecture: "arm64",
				platform: "darwin",
			};

			const artifact = new BinaryArtifact(config);

			assert.strictEqual(artifact.getPath(), "./dist/myapp");
			assert.strictEqual(artifact.getType(), "binary");
			assert.strictEqual(artifact.getArchitecture(), "arm64");
			assert.strictEqual(artifact.getPlatform(), "darwin");
		});

		it("should handle null optional values", () => {
			const config = {
				type: "binary",
				path: "./myapp",
			};

			const artifact = new BinaryArtifact(config);

			assert.strictEqual(artifact.getArchitecture(), null);
			assert.strictEqual(artifact.getPlatform(), null);
		});
	});

	describe("validate", () => {
		it("should return empty array for valid config", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "x64",
				platform: "linux",
			};

			const artifact = new BinaryArtifact(config);
			const errors = artifact.validate();

			assert.ok(Array.isArray(errors));
			assert.strictEqual(errors.length, 0);
		});

		it("should validate architecture values", () => {
			const invalidArchitectures = [
				"invalid-arch",
				"x86", // Should be 'ia32'
				"amd64", // Should be 'x64'
			];

			for (const arch of invalidArchitectures) {
				const config = {
					type: "binary",
					path: "./myapp",
					architecture: arch,
				};

				const artifact = new BinaryArtifact(config);
				const errors = artifact.validate();

				assert.ok(
					errors.length > 0,
					`Should have validation errors for architecture: ${arch}`,
				);
				assert.ok(
					errors.some((error) =>
						error.message.includes("Invalid architecture"),
					),
					`Should have architecture error for: ${arch}`,
				);
			}
		});

		it("should allow valid architectures", () => {
			const validArchitectures = [
				"x64",
				"arm64",
				"ia32",
				"arm",
				"s390x",
				"ppc64",
			];

			for (const arch of validArchitectures) {
				const config = {
					type: "binary",
					path: "./myapp",
					architecture: arch,
				};

				const artifact = new BinaryArtifact(config);
				const errors = artifact.validate();

				assert.strictEqual(
					errors.length,
					0,
					`Should not have validation errors for valid architecture: ${arch}`,
				);
			}
		});

		it("should validate platform values", () => {
			const invalidPlatforms = [
				"invalid-platform",
				"windows", // Should be 'win32'
				"macos", // Should be 'darwin'
			];

			for (const platform of invalidPlatforms) {
				const config = {
					type: "binary",
					path: "./myapp",
					platform: platform,
				};

				const artifact = new BinaryArtifact(config);
				const errors = artifact.validate();

				assert.ok(
					errors.length > 0,
					`Should have validation errors for platform: ${platform}`,
				);
				assert.ok(
					errors.some((error) => error.message.includes("Invalid platform")),
					`Should have platform error for: ${platform}`,
				);
			}
		});

		it("should allow valid platforms", () => {
			const validPlatforms = ["linux", "darwin", "win32", "freebsd", "openbsd"];

			for (const platform of validPlatforms) {
				const config = {
					type: "binary",
					path: "./myapp",
					platform: platform,
				};

				const artifact = new BinaryArtifact(config);
				const errors = artifact.validate();

				assert.strictEqual(
					errors.length,
					0,
					`Should not have validation errors for valid platform: ${platform}`,
				);
			}
		});
	});

	describe("prepare", () => {
		it("should return deployment info for valid artifact", async () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "x64",
				platform: "linux",
			};

			const artifact = new BinaryArtifact(config);
			const result = await artifact.prepare();

			assert.ok(typeof result === "object");
			assert.strictEqual(result.type, "binary");
			assert.strictEqual(result.path, "./myapp");
			assert.strictEqual(result.architecture, "x64");
			assert.strictEqual(result.platform, "linux");
			assert.strictEqual(result.executable, true);
			assert.strictEqual(result.runtime, null);
		});

		it("should handle null optional values in result", async () => {
			const config = {
				type: "binary",
				path: "./myapp",
			};

			const artifact = new BinaryArtifact(config);
			const result = await artifact.prepare();

			assert.strictEqual(result.architecture, null);
			assert.strictEqual(result.platform, null);
			assert.strictEqual(result.executable, true);
			assert.strictEqual(result.runtime, null);
		});

		it("should throw error when validation fails", async () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "invalid-arch",
			};

			const artifact = new BinaryArtifact(config);

			await assert.rejects(() => artifact.prepare(), {
				name: "Error",
				message: /Binary artifact validation failed/,
			});
		});
	});

	describe("edge cases", () => {
		it("should handle complex paths", () => {
			const config = {
				type: "binary",
				path: "/complex/path/with-dashes/and_underscores/myapp.exe",
			};

			const artifact = new BinaryArtifact(config);
			assert.strictEqual(
				artifact.getPath(),
				"/complex/path/with-dashes/and_underscores/myapp.exe",
			);
		});

		it("should handle case-sensitive architecture validation", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				architecture: "X64", // Wrong case
			};

			const artifact = new BinaryArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) => error.message.includes("Invalid architecture")),
			);
		});

		it("should handle case-sensitive platform validation", () => {
			const config = {
				type: "binary",
				path: "./myapp",
				platform: "Linux", // Wrong case
			};

			const artifact = new BinaryArtifact(config);
			const errors = artifact.validate();

			assert.ok(errors.length > 0);
			assert.ok(
				errors.some((error) => error.message.includes("Invalid platform")),
			);
		});
	});
});
