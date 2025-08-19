/**
 * @fileoverview Tests for TypeDoc generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
	canGenerateTypeDoc,
	generateTypeDocConfig,
	getEntryPoints,
} from "./generate-typedoc.js";

describe("getEntryPoints", () => {
	test("should return empty array when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			const result = getEntryPoints(tempDir);
			assert.deepStrictEqual(result, []);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return empty array when package.json is invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), "{ invalid json");
			const result = getEntryPoints(tempDir);
			assert.deepStrictEqual(result, []);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should extract entry points from exports field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					exports: {
						".": { import: "./index.js" },
						"./utils": { import: "./utils.js" },
						"./types": { import: "./types.js" },
					},
				}),
			);

			const result = getEntryPoints(tempDir);

			assert.deepStrictEqual(result, [
				"./index.js",
				"./utils.js",
				"./types.js",
			]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should fallback to main field when exports is not present", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					main: "./lib/index.js",
				}),
			);

			const result = getEntryPoints(tempDir);

			assert.deepStrictEqual(result, ["./lib/index.js"]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return empty array when neither exports nor main is present", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);

			const result = getEntryPoints(tempDir);

			assert.deepStrictEqual(result, []);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should filter out falsy import values", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					exports: {
						".": { import: "./index.js" },
						"./empty": { import: null },
						"./undefined": {},
					},
				}),
			);

			const result = getEntryPoints(tempDir);

			assert.deepStrictEqual(result, ["./index.js"]);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateTypeDocConfig", () => {
	test("should return null when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			const result = generateTypeDocConfig(tempDir, "./temp");
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when package.json is invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), "{ invalid json");
			const result = generateTypeDocConfig(tempDir, "./temp");
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when no entry points are available", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);

			const result = generateTypeDocConfig(tempDir, "./temp");

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate config for package with exports", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					exports: {
						".": { import: "./index.js" },
					},
				}),
			);

			const result = generateTypeDocConfig(tempDir, "./temp");

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.out, "./temp");
			assert.deepStrictEqual(result?.entryPoints, ["./index.js"]);
			assert.strictEqual(result?.name, "@raven-js/test");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate config for package with main field", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					main: "./lib/index.js",
				}),
			);

			const result = generateTypeDocConfig(tempDir, "./temp");

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.out, "./temp");
			assert.deepStrictEqual(result?.entryPoints, ["./lib/index.js"]);
			assert.strictEqual(result?.name, "@raven-js/test");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle scoped package names correctly", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@scope/package",
					main: "./index.js",
				}),
			);

			const result = generateTypeDocConfig(tempDir, "./output");

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.name, "@scope/package");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should handle non-scoped package names correctly", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "simple-package",
					main: "./index.js",
				}),
			);

			const result = generateTypeDocConfig(tempDir, "./output");

			assert.notStrictEqual(result, null);
			assert.strictEqual(result?.name, "simple-package");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("canGenerateTypeDoc", () => {
	test("should return false when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			const result = canGenerateTypeDoc(tempDir);
			assert.strictEqual(result, false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return false when no entry points are available", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					version: "1.0.0",
				}),
			);

			const result = canGenerateTypeDoc(tempDir);

			assert.strictEqual(result, false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when entry points are available", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					main: "./index.js",
				}),
			);

			const result = canGenerateTypeDoc(tempDir);

			assert.strictEqual(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when exports are available", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "typedoc-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					name: "@raven-js/test",
					exports: {
						".": { import: "./index.js" },
					},
				}),
			);

			const result = canGenerateTypeDoc(tempDir);

			assert.strictEqual(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
