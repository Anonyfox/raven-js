/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for public API extraction module
 *
 * Tests the extraction of publicly exported entities following package.json
 * exports configuration. Covers direct exports, re-exports, and module creation.
 */

import { strict as assert } from "node:assert";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { extractPublicAPI } from "./public-api-extractor.js";

test("extractPublicAPI handles simple export patterns", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create package.json with simple exports
		const packageJson = {
			name: "test-package",
			main: "./index.js",
			exports: {
				".": "./index.js",
			},
		};

		// Create index.js with simple exports
		const indexContent = `
/**
 * Main module documentation
 * @file Main entry point
 */
export function testFunction() {
	return "test";
}

export const testVar = 42;
`;

		await writeFile(join(tempDir, "index.js"), indexContent);

		// Execute
		const result = await extractPublicAPI(tempDir, packageJson);

		// Verify modules
		assert.equal(result.modules.size, 1);
		assert.ok(result.modules.has("index"));

		// Verify entities were extracted
		assert.ok(result.entities.size >= 2);

		// Check specific entities exist
		const entityValues = Array.from(result.entities.values());
		assert.ok(entityValues.some((e) => e.name === "testFunction"));
		assert.ok(entityValues.some((e) => e.name === "testVar"));
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("extractPublicAPI handles module ID creation", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create package.json with multiple exports
		const packageJson = {
			name: "test-package",
			exports: {
				".": "./index.js",
				"./core": "./core/index.js",
			},
		};

		// Create directory structure
		await mkdir(join(tempDir, "core"), { recursive: true });

		// Create files
		await writeFile(
			join(tempDir, "index.js"),
			`export const mainFunc = () => {};`,
		);
		await writeFile(
			join(tempDir, "core", "index.js"),
			`export class CoreClass {}`,
		);

		// Execute
		const result = await extractPublicAPI(tempDir, packageJson);

		// Check module IDs are created correctly
		const moduleIds = Array.from(result.modules.keys());
		assert.ok(moduleIds.includes("index"));
		assert.ok(moduleIds.includes("core-index"));
	} finally {
		await rm(tempDir, { recursive: true });
	}
});

test("extractPublicAPI handles file read errors gracefully", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);

	// Create package.json pointing to non-existent file
	const packageJson = {
		name: "test-package",
		exports: {
			".": "./nonexistent.js",
		},
	};

	// Execute - should not throw
	const result = await extractPublicAPI(tempDir, packageJson);

	// Should return empty results when files can't be read
	assert.equal(result.modules.size, 0);
	assert.equal(result.entities.size, 0);
});

test("extractPublicAPI handles edge cases", async () => {
	const tempDir = join(tmpdir(), `glean-test-${Date.now()}`);
	await mkdir(tempDir, { recursive: true });

	try {
		// Create package.json with simple exports
		const packageJson = {
			name: "test-package",
			exports: {
				".": "./edge.js",
			},
		};

		// Edge case: file with no exports
		const edgeContent = `
// File with no exports
function internalFunc() {}
const internalVar = 1;
`;

		await writeFile(join(tempDir, "edge.js"), edgeContent);

		const result = await extractPublicAPI(tempDir, packageJson);

		// Should handle gracefully - creates module but no entities exported
		assert.equal(result.modules.size, 1);
		assert.equal(result.entities.size, 0); // No exports means no entities
	} finally {
		await rm(tempDir, { recursive: true });
	}
});
