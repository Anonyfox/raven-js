/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { buildPackageMetadata } from "./package-metadata.js";

test("buildPackageMetadata - comprehensive branch coverage", () => {
	const defaultMetadata = {
		name: "unknown",
		version: "0.0.0",
		description: "",
		exports: {},
		main: undefined,
		module: undefined,
	};

	// Test null packageJson
	deepStrictEqual(buildPackageMetadata(null), defaultMetadata);

	// Test undefined packageJson
	deepStrictEqual(buildPackageMetadata(undefined), defaultMetadata);

	// Test falsy value 0 (should still process as truthy object)
	deepStrictEqual(buildPackageMetadata(0), defaultMetadata);

	// Test empty packageJson object
	deepStrictEqual(buildPackageMetadata({}), defaultMetadata);

	// Test partial packageJson with some properties
	deepStrictEqual(
		buildPackageMetadata({
			name: "@raven/test",
			version: "1.2.3",
		}),
		{
			name: "@raven/test",
			version: "1.2.3",
			description: "",
			exports: {},
			main: undefined,
			module: undefined,
		},
	);

	// Test complete packageJson with all properties
	deepStrictEqual(
		buildPackageMetadata({
			name: "@raven/complete",
			version: "2.0.0",
			description: "A complete package",
			exports: { ".": "./index.js" },
			main: "./dist/index.js",
			module: "./src/index.mjs",
		}),
		{
			name: "@raven/complete",
			version: "2.0.0",
			description: "A complete package",
			exports: { ".": "./index.js" },
			main: "./dist/index.js",
			module: "./src/index.mjs",
		},
	);

	// Test packageJson with falsy but defined values
	deepStrictEqual(
		buildPackageMetadata({
			name: "", // Empty string triggers fallback due to ||
			version: "", // Empty string triggers fallback due to ||
			description: "", // Empty string stays empty (|| "")
			exports: null, // Should use fallback for null
			main: "", // Empty string should be used
			module: false, // False should be used
		}),
		{
			name: "unknown", // Empty string triggers fallback
			version: "0.0.0", // Empty string triggers fallback
			description: "",
			exports: {}, // null becomes {}
			main: "",
			module: false,
		},
	);

	// Test packageJson with undefined properties (should use fallbacks)
	deepStrictEqual(
		buildPackageMetadata({
			name: undefined,
			version: undefined,
			description: undefined,
			exports: undefined,
			main: undefined,
			module: undefined,
		}),
		defaultMetadata,
	);
});
