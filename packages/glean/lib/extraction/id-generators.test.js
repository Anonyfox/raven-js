/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { generateModuleId, generateReadmeId } from "./id-generators.js";

test("generateModuleId - comprehensive branch coverage", () => {
	const packagePath = "/project/root";

	// Test .js extension removal and path normalization
	deepStrictEqual(
		generateModuleId("/project/root/src/index.js", packagePath),
		"src/index",
	);

	// Test .mjs extension removal
	deepStrictEqual(
		generateModuleId("/project/root/lib/module.mjs", packagePath),
		"lib/module",
	);

	// Test Windows path separator normalization
	deepStrictEqual(
		generateModuleId("/project/root/src\\components\\Button.js", packagePath),
		"src/components/Button",
	);

	// Test mixed path separators
	deepStrictEqual(
		generateModuleId("/project/root/src/utils\\helpers.js", packagePath),
		"src/utils/helpers",
	);

	// Test root level file
	deepStrictEqual(
		generateModuleId("/project/root/index.js", packagePath),
		"index",
	);

	// Test file without .js/.mjs extension (no replacement)
	deepStrictEqual(
		generateModuleId("/project/root/config.json", packagePath),
		"config.json",
	);

	// Test deeply nested structure
	deepStrictEqual(
		generateModuleId(
			"/project/root/src/components/ui/forms/Input.js",
			packagePath,
		),
		"src/components/ui/forms/Input",
	);
});

test("generateReadmeId - comprehensive branch coverage", () => {
	const packagePath = "/project/root";

	// Test root README returns "root"
	deepStrictEqual(
		generateReadmeId("/project/root/README.md", packagePath),
		"root",
	);

	// Test subdirectory README
	deepStrictEqual(
		generateReadmeId("/project/root/src/README.md", packagePath),
		"src",
	);

	// Test nested subdirectory README
	deepStrictEqual(
		generateReadmeId("/project/root/src/components/README.md", packagePath),
		"src/components",
	);

	// Test deeply nested README
	deepStrictEqual(
		generateReadmeId("/project/root/docs/api/guides/README.md", packagePath),
		"docs/api/guides",
	);

	// Test different README filename (should still work with dirname)
	deepStrictEqual(
		generateReadmeId("/project/root/lib/readme.txt", packagePath),
		"lib",
	);

	// Test current directory edge case (./README.md resolves to root)
	deepStrictEqual(
		generateReadmeId("/project/root/./README.md", packagePath),
		"root",
	);
});
