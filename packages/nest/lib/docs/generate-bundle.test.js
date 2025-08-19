/**
 * @fileoverview Tests for bundle generation functions
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 */

import assert from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
	canGenerateBundles,
	generateAllBundles,
	generateCommonJSBundle,
	generateESMBundle,
	generateESMMinifiedBundle,
	getBundleEntryPoint,
} from "./generate-bundle.js";

describe("getBundleEntryPoint", () => {
	test("should return null when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			const result = getBundleEntryPoint(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when package.json is invalid JSON", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), "{ invalid json");
			const result = getBundleEntryPoint(tempDir);
			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return main field when present", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);
			mkdirSync(join(tempDir, "lib"), { recursive: true });
			writeFileSync(join(tempDir, "lib", "index.js"), "export default {};");

			const result = getBundleEntryPoint(tempDir);

			assert.strictEqual(result, "lib/index.js");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return exports import when main is not present", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					exports: {
						".": { import: "src/index.js" },
					},
				}),
			);
			mkdirSync(join(tempDir, "src"), { recursive: true });
			writeFileSync(join(tempDir, "src", "index.js"), "export default {};");

			const result = getBundleEntryPoint(tempDir);

			assert.strictEqual(result, "src/index.js");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return exports string when import is not present", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					exports: {
						".": "src/index.js",
					},
				}),
			);
			mkdirSync(join(tempDir, "src"), { recursive: true });
			writeFileSync(join(tempDir, "src", "index.js"), "export default {};");

			const result = getBundleEntryPoint(tempDir);

			assert.strictEqual(result, "src/index.js");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return index.js when no main or exports", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(join(tempDir, "index.js"), "export default {};");

			const result = getBundleEntryPoint(tempDir);

			assert.strictEqual(result, "index.js");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return null when entry point file does not exist", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = getBundleEntryPoint(tempDir);

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("canGenerateBundles", () => {
	test("should return false when package.json is missing", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			const result = canGenerateBundles(tempDir);
			assert.strictEqual(result, false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return false when entry point is not found", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = canGenerateBundles(tempDir);

			assert.strictEqual(result, false);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should return true when entry point exists", () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(join(tempDir, "index.js"), "export default {};");

			const result = canGenerateBundles(tempDir);

			assert.strictEqual(result, true);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateCommonJSBundle", () => {
	test("should return null when entry point is not found", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = await generateCommonJSBundle(tempDir, "test");

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate CommonJS bundle when entry point exists", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(
				join(tempDir, "index.js"),
				"export default { hello: 'world' };",
			);

			const result = await generateCommonJSBundle(tempDir, "test");

			assert.notStrictEqual(result, null);
			assert.strictEqual(typeof result?.code, "string");
			assert.strictEqual(typeof result?.map, "string");
			assert(result?.code.includes("RavenJS_Test"));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateESMBundle", () => {
	test("should return null when entry point is not found", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = await generateESMBundle(tempDir);

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate ESM bundle when entry point exists", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(
				join(tempDir, "index.js"),
				"export default { hello: 'world' };",
			);

			const result = await generateESMBundle(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(typeof result?.code, "string");
			assert.strictEqual(typeof result?.map, "string");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateESMMinifiedBundle", () => {
	test("should return null when entry point is not found", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = await generateESMMinifiedBundle(tempDir);

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate minified ESM bundle when entry point exists", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(
				join(tempDir, "index.js"),
				"export default { hello: 'world' };",
			);

			const result = await generateESMMinifiedBundle(tempDir);

			assert.notStrictEqual(result, null);
			assert.strictEqual(typeof result?.code, "string");
			assert.strictEqual(typeof result?.map, "string");
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("generateAllBundles", () => {
	test("should return null when entry point is not found", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(
				join(tempDir, "package.json"),
				JSON.stringify({
					main: "lib/index.js",
				}),
			);

			const result = await generateAllBundles(tempDir, "test");

			assert.strictEqual(result, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should generate all bundles when entry point exists", async () => {
		const tempDir = mkdtempSync(join(tmpdir(), "bundle-test-"));
		try {
			writeFileSync(join(tempDir, "package.json"), JSON.stringify({}));
			writeFileSync(
				join(tempDir, "index.js"),
				"export default { hello: 'world' };",
			);

			const result = await generateAllBundles(tempDir, "test");

			assert.notStrictEqual(result, null);
			assert.notStrictEqual(result?.cjs, null);
			assert.notStrictEqual(result?.cjsMin, null);
			assert.notStrictEqual(result?.esm, null);
			assert.notStrictEqual(result?.esmMin, null);
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
