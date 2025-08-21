/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for package.json entry point extraction according to Node.js specification.
 */

import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { extractEntryPoints } from "./entry-points.js";

test("extractEntryPoints - no main or exports field", () => {
	const packageJson = {
		name: "empty-package",
		version: "1.0.0",
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {});
});

test("extractEntryPoints - main field only (legacy)", () => {
	const packageJson = {
		name: "legacy-package",
		main: "./index.js",
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
	});
});

test("extractEntryPoints - main field with relative path", () => {
	const packageJson = {
		name: "legacy-package",
		main: "lib/index.js",
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./lib/index.js",
	});
});

test("extractEntryPoints - exports field simple string (sugar syntax)", () => {
	const packageJson = {
		name: "modern-package",
		exports: "./index.js",
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
	});
});

test("extractEntryPoints - exports field object with main entry", () => {
	const packageJson = {
		name: "modern-package",
		exports: {
			".": "./index.js",
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
	});
});

test("extractEntryPoints - exports field with multiple subpaths", () => {
	const packageJson = {
		name: "modern-package",
		exports: {
			".": "./index.js",
			"./submodule": "./src/submodule.js",
			"./utils": "./lib/utils.js",
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
		"./submodule": "./src/submodule.js",
		"./utils": "./lib/utils.js",
	});
});

test("extractEntryPoints - exports takes precedence over main", () => {
	const packageJson = {
		name: "mixed-package",
		main: "./legacy.js",
		exports: {
			".": "./modern.js",
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./modern.js",
	});
});

test("extractEntryPoints - exports with backwards compatibility patterns", () => {
	const packageJson = {
		name: "compat-package",
		exports: {
			".": "./lib/index.js",
			"./lib": "./lib/index.js",
			"./lib/index": "./lib/index.js",
			"./lib/index.js": "./lib/index.js",
			"./feature": "./feature/index.js",
			"./feature/index": "./feature/index.js",
			"./feature/index.js": "./feature/index.js",
			"./package.json": "./package.json",
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./lib/index.js",
		"./lib": "./lib/index.js",
		"./lib/index": "./lib/index.js",
		"./lib/index.js": "./lib/index.js",
		"./feature": "./feature/index.js",
		"./feature/index": "./feature/index.js",
		"./feature/index.js": "./feature/index.js",
		"./package.json": "./package.json",
	});
});

test("extractEntryPoints - exports with wildcard patterns", () => {
	const packageJson = {
		name: "pattern-package",
		exports: {
			".": "./lib/index.js",
			"./lib/*": "./lib/*.js",
			"./feature/*": "./feature/*.js",
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./lib/index.js",
		"./lib/*": "./lib/*.js",
		"./feature/*": "./feature/*.js",
	});
});

test("extractEntryPoints - exports with null entries (restricted access)", () => {
	const packageJson = {
		name: "restricted-package",
		exports: {
			".": "./lib/index.js",
			"./feature/*.js": "./feature/*.js",
			"./feature/internal/*": null,
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./lib/index.js",
		"./feature/*.js": "./feature/*.js",
		// null entries should be filtered out
	});
});

test("extractEntryPoints - conditional exports (import/require)", () => {
	const packageJson = {
		name: "conditional-package",
		exports: {
			".": {
				import: "./esm/index.js",
				require: "./cjs/index.js",
			},
			"./utils": {
				import: "./esm/utils.js",
				require: "./cjs/utils.js",
			},
		},
	};

	// For this test, we'll assume the function returns import conditions by default
	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./esm/index.js",
		"./utils": "./esm/utils.js",
	});
});

test("extractEntryPoints - complex conditional exports with defaults", () => {
	const packageJson = {
		name: "complex-package",
		exports: {
			".": {
				node: {
					import: "./node-esm.js",
					require: "./node-cjs.js",
				},
				browser: "./browser.js",
				default: "./fallback.js",
			},
		},
	};

	// Should fall back to default when specific conditions aren't handled
	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./fallback.js",
	});
});

test("extractEntryPoints - invalid exports should be filtered", () => {
	const packageJson = {
		name: "invalid-package",
		exports: {
			".": "./index.js",
			"./valid": "./lib/valid.js",
			"./invalid": "/absolute/path.js", // Invalid: absolute path
			"./another": "../outside.js", // Invalid: path traversal
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
		"./valid": "./lib/valid.js",
		// Invalid entries should be filtered out
	});
});

test("extractEntryPoints - normalize paths without leading ./", () => {
	const packageJson = {
		name: "normalize-package",
		main: "index.js", // No leading ./
		exports: {
			".": "lib/main.js", // No leading ./
			"./utils": "./lib/utils.js", // Already has ./
		},
	};

	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./lib/main.js",
		"./utils": "./lib/utils.js",
	});
});

test("extractEntryPoints - with file validation", () => {
	const packageJson = {
		name: "validated-package",
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
			"./missing": "./lib/missing.js",
		},
	};

	const availableFiles = ["index.js", "lib/utils.js", "package.json"];

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./utils": "lib/utils.js",
		// missing.js should be filtered out
	});
});

test("extractEntryPoints - wildcard pattern resolution", () => {
	const packageJson = {
		name: "wildcard-package",
		exports: {
			".": "./index.js",
			"./lib/*": "./lib/*.js",
			"./utils/*": "./utils/*",
		},
	};

	const availableFiles = [
		"index.js",
		"lib/helper.js",
		"lib/parser.js",
		"lib/readme.md", // Should be filtered out (not JS)
		"utils/format.js",
		"utils/validate.mjs",
		"package.json",
	];

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./lib/helper": "lib/helper.js",
		"./lib/parser": "lib/parser.js",
		"./utils/format": "utils/format.js",
		"./utils/validate": "utils/validate.mjs",
	});
});

test("extractEntryPoints - index.js resolution", () => {
	const packageJson = {
		name: "index-resolution-package",
		exports: {
			".": "./src",
			"./lib": "./lib",
			"./utils": "./utils",
		},
	};

	const availableFiles = [
		"src/index.js",
		"lib/index.mjs",
		"utils/index.jsx",
		"package.json",
	];

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "src/index.js",
		"./lib": "lib/index.mjs",
		"./utils": "utils/index.jsx",
	});
});

test("extractEntryPoints - extension resolution", () => {
	const packageJson = {
		name: "extension-package",
		exports: {
			".": "./index",
			"./utils": "./lib/utils",
		},
	};

	const availableFiles = ["index.js", "lib/utils.js", "package.json"];

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		".": "index.js",
		"./utils": "lib/utils.js",
	});
});

test("extractEntryPoints - JavaScript file filtering", () => {
	const packageJson = {
		name: "js-filtering-package",
		exports: {
			"./lib/*": "./lib/*",
		},
	};

	const availableFiles = [
		"lib/module.js",
		"lib/component.jsx",
		"lib/modern.mjs",
		"lib/readme.md",
		"lib/config.json",
		"lib/styles.css",
	];

	const result = extractEntryPoints(packageJson, availableFiles);
	deepStrictEqual(result, {
		"./lib/module": "lib/module.js",
		"./lib/component": "lib/component.jsx",
		"./lib/modern": "lib/modern.mjs",
		// Non-JS files should be filtered out
	});
});

test("extractEntryPoints - empty availableFiles", () => {
	const packageJson = {
		name: "empty-files-package",
		main: "./index.js",
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
		},
	};

	const result = extractEntryPoints(packageJson, []);
	deepStrictEqual(result, {});
});

test("extractEntryPoints - backward compatibility without availableFiles", () => {
	const packageJson = {
		name: "backward-compat-package",
		main: "./index.js",
	};

	// Should work without availableFiles parameter
	const result = extractEntryPoints(packageJson);
	deepStrictEqual(result, {
		".": "./index.js",
	});
});
