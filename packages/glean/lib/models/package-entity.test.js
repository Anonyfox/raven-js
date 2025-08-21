/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Package entity model tests - comprehensive validation coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { PackageEntity } from "./package-entity.js";

test("PackageEntity - edge cases", () => {
	// Test with null/undefined values
	const packageEntity = new PackageEntity({
		name: null,
		version: undefined,
		exports: null,
	});

	strictEqual(packageEntity.name, "unknown");
	strictEqual(packageEntity.version, "0.0.0");
	deepStrictEqual(packageEntity.exports, {});

	// Test empty entry points
	const emptyPackage = new PackageEntity({});
	strictEqual(emptyPackage.getEntryPoints().length, 0);
});
