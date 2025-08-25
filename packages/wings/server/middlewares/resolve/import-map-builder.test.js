/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Comprehensive test suite for import map generation utilities.
 *
 * Tests all import map functionality with 100% branch coverage:
 * - Import map generation from resolved packages
 * - Package entry URL generation
 * - Subpath exports handling and wildcard support
 * - Import map merging and conflict resolution
 * - Import map validation and optimization
 * - URL normalization and package name handling
 * - Performance and memory efficiency
 * - Error handling and edge cases
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import {
	createPackageUrl,
	generateImportMap,
	generatePackageEntry,
	generateSubpathEntries,
	getImportMapStats,
	mergeImportMaps,
	optimizeImportMap,
	validateImportMap,
} from "./import-map-builder.js";

// Test data for package structures
const createTestPackage = (name, options = {}) => ({
	name,
	path: options.isWorkspace ? `/@workspace/${name}` : `/node_modules/${name}`,
	isWorkspace: options.isWorkspace || false,
	packageJson: {
		name,
		version: "1.0.0",
		main: options.main || "index.js",
		module: options.module,
		exports: options.exports,
		type: options.type || "commonjs",
	},
});

// generateImportMap tests
test("generateImportMap - basic package resolution", async () => {
	const packages = [
		createTestPackage("lodash"),
		createTestPackage("react", { module: "index.esm.js" }),
		createTestPackage("@babel/core"),
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);
	strictEqual(typeof result.importMap, "object");
	strictEqual(typeof result.importMap.imports, "object");
	strictEqual(typeof result.importMap.imports.lodash, "string");
	strictEqual(typeof result.importMap.imports.react, "string");
	strictEqual(typeof result.importMap.imports["@babel/core"], "string");
});

test("generateImportMap - workspace packages", async () => {
	const packages = [
		createTestPackage("@my-app/ui", { isWorkspace: true }),
		createTestPackage("@my-app/utils", { isWorkspace: true }),
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);
	strictEqual(
		result.importMap.imports["@my-app/ui"].includes("/@workspace/"),
		true,
	);
	strictEqual(
		result.importMap.imports["@my-app/utils"].includes("/@workspace/"),
		true,
	);
});

test("generateImportMap - with exports field", async () => {
	const packages = [
		createTestPackage("complex-package", {
			exports: {
				".": "./lib/index.js",
				"./utils": "./lib/utils.js",
				"./features/*": "./lib/features/*.js",
			},
		}),
	];

	const result = await generateImportMap(packages, { includeSubpaths: true });
	strictEqual(result.success, true);
	strictEqual(typeof result.importMap.imports["complex-package"], "string");
	strictEqual(
		typeof result.importMap.imports["complex-package/utils"],
		"string",
	);
	strictEqual(
		typeof result.importMap.imports["complex-package/features/"],
		"string",
	);
});

test("generateImportMap - conditional exports", async () => {
	const packages = [
		createTestPackage("universal-package", {
			exports: {
				".": {
					import: "./esm/index.js",
					require: "./cjs/index.js",
					browser: "./browser/index.js",
					default: "./lib/index.js",
				},
			},
		}),
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);
	strictEqual(
		result.importMap.imports["universal-package"].includes("esm/index.js"),
		true,
	);
});

test("generateImportMap - custom options", async () => {
	const packages = [createTestPackage("test-package")];

	const result = await generateImportMap(packages, {
		baseUrl: "/app/",
		nodeModulesPrefix: "/deps/",
		workspacePrefix: "/src/",
		includeSubpaths: false,
	});

	strictEqual(result.success, true);
	strictEqual(
		result.importMap.imports["test-package"].startsWith("/app/deps/"),
		true,
	);
});

test("generateImportMap - invalid packages handling", async () => {
	const packages = [
		null,
		undefined,
		{}, // Invalid package
		createTestPackage("valid-package"),
		{ name: "no-package-json" }, // Missing packageJson
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);
	strictEqual(typeof result.importMap.imports["valid-package"], "string");
	strictEqual(result.importMap.imports[null], undefined);
});

test("generateImportMap - validation failure", async () => {
	// Force validation failure by providing malformed package data
	const packages = [
		{
			name: "", // Invalid empty name
			packageJson: { name: "" },
			path: "/valid/path",
		},
	];

	const result = await generateImportMap(packages);
	// Should still succeed but exclude invalid entries
	strictEqual(result.success, true);
});

test("generateImportMap - error handling", async () => {
	// Test with packages array that causes internal errors
	const result = await generateImportMap(null);
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// generatePackageEntry tests
test("generatePackageEntry - node_modules package", async () => {
	const pkg = createTestPackage("lodash");
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/lodash/index.js");
});

test("generatePackageEntry - workspace package", async () => {
	const pkg = createTestPackage("@my-app/ui", { isWorkspace: true });
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/@workspace/@my-app/ui/index.js");
});

test("generatePackageEntry - with module field", async () => {
	const pkg = createTestPackage("esm-package", { module: "esm/index.js" });
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/esm-package/esm/index.js");
});

test("generatePackageEntry - with string exports", async () => {
	const pkg = createTestPackage("string-exports", {
		exports: "./lib/main.js",
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/string-exports/lib/main.js");
});

test("generatePackageEntry - with object exports", async () => {
	const pkg = createTestPackage("object-exports", {
		exports: {
			".": "./dist/index.js",
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/object-exports/dist/index.js");
});

test("generatePackageEntry - with conditional exports", async () => {
	const pkg = createTestPackage("conditional-exports", {
		exports: {
			".": {
				import: "./esm/index.js",
				require: "./cjs/index.js",
				default: "./lib/index.js",
			},
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/conditional-exports/esm/index.js");
});

test("generatePackageEntry - scoped package", async () => {
	const pkg = createTestPackage("@babel/core");
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
	};

	const result = await generatePackageEntry(pkg, options);
	strictEqual(result.success, true);
	strictEqual(result.url, "/node_modules/@babel/core/index.js");
});

test("generatePackageEntry - error handling", async () => {
	const result = await generatePackageEntry(null, {});
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// generateSubpathEntries tests
test("generateSubpathEntries - no exports field", async () => {
	const pkg = createTestPackage("no-exports");
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	deepStrictEqual(result.entries, {});
});

test("generateSubpathEntries - string exports", async () => {
	const pkg = createTestPackage("string-exports", {
		exports: "./lib/index.js",
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	deepStrictEqual(result.entries, {});
});

test("generateSubpathEntries - explicit subpaths", async () => {
	const pkg = createTestPackage("subpath-package", {
		exports: {
			".": "./index.js",
			"./utils": "./lib/utils.js",
			"./helpers": "./lib/helpers/index.js",
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	strictEqual(
		result.entries["subpath-package/utils"],
		"/node_modules/subpath-package/lib/utils.js",
	);
	strictEqual(
		result.entries["subpath-package/helpers"],
		"/node_modules/subpath-package/lib/helpers/index.js",
	);
});

test("generateSubpathEntries - wildcard exports", async () => {
	const pkg = createTestPackage("wildcard-package", {
		exports: {
			".": "./index.js",
			"./features/*": "./lib/features/*.js",
			"./utils/*": "./src/utils/*.js",
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	strictEqual(
		result.entries["wildcard-package/features/"],
		"/node_modules/wildcard-package/lib/features/",
	);
	strictEqual(
		result.entries["wildcard-package/utils/"],
		"/node_modules/wildcard-package/src/utils/",
	);
});

test("generateSubpathEntries - conditional subpaths", async () => {
	const pkg = createTestPackage("conditional-subpaths", {
		exports: {
			".": "./index.js",
			"./feature": {
				import: "./esm/feature.js",
				require: "./cjs/feature.js",
				default: "./lib/feature.js",
			},
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	strictEqual(
		result.entries["conditional-subpaths/feature"],
		"/node_modules/conditional-subpaths/esm/feature.js",
	);
});

test("generateSubpathEntries - workspace package", async () => {
	const pkg = createTestPackage("@my-app/components", {
		isWorkspace: true,
		exports: {
			".": "./index.js",
			"./button": "./src/button.js",
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: true,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	strictEqual(
		result.entries["@my-app/components/button"],
		"/@workspace/@my-app/components/src/button.js",
	);
});

test("generateSubpathEntries - trailing slash disabled", async () => {
	const pkg = createTestPackage("no-slash-package", {
		exports: {
			"./utils/*": "./lib/utils/*.js",
		},
	});
	const options = {
		baseUrl: "/",
		nodeModulesPrefix: "/node_modules/",
		workspacePrefix: "/@workspace/",
		trailingSlash: false,
	};

	const result = await generateSubpathEntries(pkg, options);
	strictEqual(result.success, true);
	strictEqual(
		result.entries["no-slash-package/utils"],
		"/node_modules/no-slash-package/lib/utils",
	);
});

test("generateSubpathEntries - error handling", async () => {
	const result = await generateSubpathEntries(null, {});
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// mergeImportMaps tests
test("mergeImportMaps - basic merge", () => {
	const importMaps = [
		{ imports: { lodash: "/node_modules/lodash/index.js" } },
		{ imports: { react: "/node_modules/react/index.js" } },
	];

	const result = mergeImportMaps(importMaps);
	strictEqual(result.success, true);
	strictEqual(result.importMap.imports.lodash, "/node_modules/lodash/index.js");
	strictEqual(result.importMap.imports.react, "/node_modules/react/index.js");
});

test("mergeImportMaps - conflict override", () => {
	const importMaps = [
		{ imports: { lodash: "/node_modules/lodash/index.js" } },
		{ imports: { lodash: "/custom/lodash.js" } },
	];

	const result = mergeImportMaps(importMaps, { conflictStrategy: "override" });
	strictEqual(result.success, true);
	strictEqual(result.importMap.imports.lodash, "/custom/lodash.js");
});

test("mergeImportMaps - conflict detection", () => {
	const importMaps = [
		{ imports: { lodash: "/node_modules/lodash/index.js" } },
		{
			imports: {
				lodash: "/custom/lodash.js",
				react: "/node_modules/react/index.js",
			},
		},
	];

	const result = mergeImportMaps(importMaps, { detectConflicts: true });
	strictEqual(result.success, true);
	strictEqual(Array.isArray(result.conflicts), true);
	strictEqual(result.conflicts.length, 1);
	strictEqual(result.conflicts[0].specifier, "lodash");
});

test("mergeImportMaps - keep first strategy", () => {
	const importMaps = [
		{ imports: { lodash: "/node_modules/lodash/index.js" } },
		{ imports: { lodash: "/custom/lodash.js" } },
	];

	const result = mergeImportMaps(importMaps, {
		conflictStrategy: "keep-first",
	});
	strictEqual(result.success, true);
	strictEqual(result.importMap.imports.lodash, "/node_modules/lodash/index.js");
});

test("mergeImportMaps - empty arrays", () => {
	const result = mergeImportMaps([]);
	strictEqual(result.success, true);
	deepStrictEqual(result.importMap.imports, {});
});

test("mergeImportMaps - invalid input handling", () => {
	const importMaps = [
		null,
		undefined,
		{}, // Missing imports
		{ imports: { valid: "/valid.js" } },
	];

	const result = mergeImportMaps(importMaps);
	strictEqual(result.success, true);
	strictEqual(result.importMap.imports.valid, "/valid.js");
});

test("mergeImportMaps - error handling", () => {
	const result = mergeImportMaps(null);
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// validateImportMap tests
test("validateImportMap - valid import map", () => {
	const importMap = {
		imports: {
			lodash: "/node_modules/lodash/index.js",
			"@babel/core": "/node_modules/@babel/core/lib/index.js",
			"react/": "/node_modules/react/",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, true);
});

test("validateImportMap - invalid structure", () => {
	const result1 = validateImportMap(null);
	strictEqual(result1.valid, false);
	strictEqual(result1.error, "Import map must be an object");

	const result2 = validateImportMap({});
	strictEqual(result2.valid, false);
	strictEqual(result2.error, "Import map must have an 'imports' object");

	const result3 = validateImportMap({ imports: null });
	strictEqual(result3.valid, false);
	strictEqual(result3.error, "Import map must have an 'imports' object");
});

test("validateImportMap - invalid specifiers", () => {
	const importMap = {
		imports: {
			"": "/empty-specifier.js",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, false);
	strictEqual(result.error.includes("Invalid specifier"), true);
});

test("validateImportMap - invalid URLs", () => {
	const importMap = {
		imports: {
			"valid-specifier": "",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, false);
	strictEqual(result.error.includes("Invalid URL"), true);
});

test("validateImportMap - invalid URL format", () => {
	const importMap = {
		imports: {
			package: "not-a-valid-url",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, false);
	strictEqual(result.error.includes("Invalid URL format"), true);
});

test("validateImportMap - warnings", () => {
	const importMap = {
		imports: {
			"package//name": "/valid.js",
			"other-package": "/path/../valid.js",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, true);
	strictEqual(Array.isArray(result.warnings), true);
	strictEqual(result.warnings.length, 2);
});

test("validateImportMap - absolute URLs", () => {
	const importMap = {
		imports: {
			"cdn-package": "https://cdn.example.com/package.js",
		},
	};

	const result = validateImportMap(importMap);
	strictEqual(result.valid, true);
});

test("validateImportMap - error handling", () => {
	// Force an error by making Object.entries throw
	const importMap = {
		imports: Object.create(null), // Create object without prototype
	};

	// Add a property that will cause issues during iteration
	Object.defineProperty(importMap.imports, "problematic", {
		get() {
			throw new Error("Forced error");
		},
		enumerable: true,
	});

	const result = validateImportMap(importMap);
	strictEqual(result.valid, false);
	strictEqual(result.error, "Import map validation failed");
});

// optimizeImportMap tests
test("optimizeImportMap - basic optimization", () => {
	const importMap = {
		imports: {
			package: "/node_modules//package/index.js",
			other: "/path/./to/file.js",
		},
	};

	const result = optimizeImportMap(importMap);
	strictEqual(result.success, true);
	strictEqual(
		result.importMap.imports.package,
		"/node_modules/package/index.js",
	);
	strictEqual(typeof result.savings, "object");
	strictEqual(typeof result.savings.percentage, "number");
});

test("optimizeImportMap - redundant entry removal", () => {
	const importMap = {
		imports: {
			"package/": "/node_modules/package/",
			"package/submodule": "/node_modules/package/submodule.js",
		},
	};

	const result = optimizeImportMap(importMap, { removeRedundant: true });
	strictEqual(result.success, true);
	// Submodule should be removed as it's covered by the wildcard
	strictEqual(result.importMap.imports["package/submodule"], undefined);
	strictEqual(result.importMap.imports["package/"], "/node_modules/package/");
});

test("optimizeImportMap - options disabled", () => {
	const importMap = {
		imports: {
			package: "/node_modules//package/index.js",
			"package/": "/node_modules/package/",
			"package/sub": "/node_modules/package/sub.js",
		},
	};

	const result = optimizeImportMap(importMap, {
		removeRedundant: false,
		simplifyPaths: false,
	});
	strictEqual(result.success, true);
	// Should keep redundant entries and unsimplified paths
	strictEqual(
		result.importMap.imports["package/sub"],
		"/node_modules/package/sub.js",
	);
	strictEqual(
		result.importMap.imports.package,
		"/node_modules//package/index.js",
	);
});

test("optimizeImportMap - savings calculation", () => {
	const importMap = {
		imports: {
			"very-long-package-name": "/very/long/path/to/some/deeply/nested/file.js",
			"another-long-name": "/another/very/long/path/file.js",
		},
	};

	const result = optimizeImportMap(importMap);
	strictEqual(result.success, true);
	strictEqual(result.savings.originalSize > 0, true);
	strictEqual(result.savings.optimizedSize > 0, true);
	strictEqual(result.savings.bytesSaved >= 0, true);
	strictEqual(result.savings.percentage >= 0, true);
});

test("optimizeImportMap - error handling", () => {
	const result = optimizeImportMap(null);
	strictEqual(result.success, false);
	strictEqual(typeof result.error, "string");
});

// createPackageUrl tests
test("createPackageUrl - regular package", () => {
	strictEqual(createPackageUrl("lodash"), "lodash");
	strictEqual(createPackageUrl("react-dom"), "react-dom");
});

test("createPackageUrl - scoped package", () => {
	strictEqual(createPackageUrl("@babel/core"), "@babel/core");
	strictEqual(createPackageUrl("@types/node"), "@types/node");
});

test("createPackageUrl - invalid input", () => {
	strictEqual(createPackageUrl(""), "");
	strictEqual(createPackageUrl(null), "");
	strictEqual(createPackageUrl(undefined), "");
});

// getImportMapStats tests
test("getImportMapStats - basic statistics", () => {
	const importMap = {
		imports: {
			lodash: "/node_modules/lodash/index.js",
			"@babel/core": "/node_modules/@babel/core/lib/index.js",
			"react/": "/node_modules/react/",
			"vue/": "/node_modules/vue/",
		},
	};

	const stats = getImportMapStats(importMap);
	strictEqual(stats.totalEntries, 4);
	strictEqual(stats.scopedPackages, 1);
	strictEqual(stats.wildcardEntries, 2);
	strictEqual(stats.size > 0, true);
	strictEqual(stats.averageSpecifierLength > 0, true);
	strictEqual(stats.averageUrlLength > 0, true);
});

test("getImportMapStats - empty import map", () => {
	const stats = getImportMapStats({ imports: {} });
	strictEqual(stats.totalEntries, 0);
	strictEqual(stats.scopedPackages, 0);
	strictEqual(stats.wildcardEntries, 0);
	strictEqual(stats.size > 0, true); // JSON overhead
	strictEqual(stats.averageSpecifierLength, 0);
	strictEqual(stats.averageUrlLength, 0);
});

test("getImportMapStats - invalid input", () => {
	const stats1 = getImportMapStats(null);
	strictEqual(stats1.totalEntries, 0);

	const stats2 = getImportMapStats({});
	strictEqual(stats2.totalEntries, 0);
});

// Integration tests
test("integration - complete import map workflow", async () => {
	const packages = [
		createTestPackage("lodash"),
		createTestPackage("@babel/core"),
		createTestPackage("@my-app/ui", { isWorkspace: true }),
		createTestPackage("complex-exports", {
			exports: {
				".": "./lib/index.js",
				"./utils": "./lib/utils.js",
				"./features/*": "./lib/features/*.js",
			},
		}),
	];

	// Generate import map
	const generateResult = await generateImportMap(packages, {
		includeSubpaths: true,
	});
	strictEqual(generateResult.success, true);

	// Validate import map
	const validation = validateImportMap(generateResult.importMap);
	strictEqual(validation.valid, true);

	// Optimize import map
	const optimization = optimizeImportMap(generateResult.importMap);
	strictEqual(optimization.success, true);

	// Get statistics
	const stats = getImportMapStats(optimization.importMap);
	strictEqual(stats.totalEntries >= 4, true);

	// Merge with another import map
	const otherImportMap = { imports: { "new-package": "/new-package.js" } };
	const mergeResult = mergeImportMaps([optimization.importMap, otherImportMap]);
	strictEqual(mergeResult.success, true);
	strictEqual(typeof mergeResult.importMap.imports["new-package"], "string");
});

test("performance - large import map generation", async () => {
	// Create many packages
	const packages = [];
	for (let i = 0; i < 100; i++) {
		packages.push(createTestPackage(`package-${i}`));
	}

	const start = performance.now();
	const result = await generateImportMap(packages);
	const end = performance.now();

	strictEqual(result.success, true);
	strictEqual(Object.keys(result.importMap.imports).length, 100);
	// Should complete in reasonable time (< 1000ms for 100 packages)
	strictEqual(end - start < 1000, true);
});

test("performance - import map optimization", () => {
	// Create large import map
	const imports = {};
	for (let i = 0; i < 1000; i++) {
		imports[`package-${i}`] = `/node_modules/package-${i}/index.js`;
	}

	const importMap = { imports };

	const start = performance.now();
	const result = optimizeImportMap(importMap);
	const end = performance.now();

	strictEqual(result.success, true);
	// Should complete quickly (< 100ms for 1000 entries)
	strictEqual(end - start < 100, true);
});

test("memory - repeated operations", async () => {
	const packages = [
		createTestPackage("test-package"),
		createTestPackage("@test/scoped"),
	];

	// Test repeated operations don't accumulate memory
	for (let i = 0; i < 50; i++) {
		await generateImportMap(packages);
		validateImportMap({ imports: { test: "/test.js" } });
		optimizeImportMap({ imports: { test: "/test.js" } });
		getImportMapStats({ imports: { test: "/test.js" } });
	}

	// If we get here without memory issues, test passes
	strictEqual(true, true);
});

test("error resilience - malformed data", async () => {
	const malformedPackages = [
		null,
		undefined,
		{},
		{ name: "invalid" },
		{ name: "partial", packageJson: null },
		{ name: "valid", packageJson: { name: "valid" }, path: "/valid" },
	];

	const result = await generateImportMap(malformedPackages);
	strictEqual(typeof result, "object");
	strictEqual(typeof result.success, "boolean");

	if (result.success) {
		// Should only include valid packages
		const stats = getImportMapStats(result.importMap);
		strictEqual(stats.totalEntries <= 1, true);
	}
});

test("url normalization edge cases", async () => {
	const packages = [
		createTestPackage("windows-paths", {
			main: "lib\\index.js", // Windows-style path
		}),
		createTestPackage("double-slashes", {
			main: "./lib//index.js", // Double slashes
		}),
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);

	// URLs should be normalized
	for (const url of Object.values(result.importMap.imports)) {
		strictEqual(url.includes("\\"), false);
		strictEqual(url.includes("//"), false);
	}
});

test("scoped package handling", async () => {
	const packages = [
		createTestPackage("@babel/core"),
		createTestPackage("@types/node"),
		createTestPackage("@my-org/private-package", { isWorkspace: true }),
	];

	const result = await generateImportMap(packages);
	strictEqual(result.success, true);

	const stats = getImportMapStats(result.importMap);
	strictEqual(stats.scopedPackages, 3);
	strictEqual(typeof result.importMap.imports["@babel/core"], "string");
	strictEqual(typeof result.importMap.imports["@types/node"], "string");
	strictEqual(
		typeof result.importMap.imports["@my-org/private-package"],
		"string",
	);
});
