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

test("PackageEntity - constructor with empty package.json", () => {
	const packageEntity = new PackageEntity();

	strictEqual(packageEntity.name, "unknown");
	strictEqual(packageEntity.version, "0.0.0");
	strictEqual(packageEntity.description, "");
	strictEqual(packageEntity.main, undefined);
	strictEqual(packageEntity.module, undefined);
	deepStrictEqual(packageEntity.exports, {});
	deepStrictEqual(packageEntity.keywords, []);
	strictEqual(packageEntity.author, "");
	strictEqual(packageEntity.license, "");
	strictEqual(packageEntity.homepage, "");
	deepStrictEqual(packageEntity.repository, {});
	deepStrictEqual(packageEntity.bugs, {});
	deepStrictEqual(packageEntity.dependencies, {});
	deepStrictEqual(packageEntity.devDependencies, {});
	deepStrictEqual(packageEntity.peerDependencies, {});
	strictEqual(packageEntity.isValidated, false);
	deepStrictEqual(packageEntity.validationIssues, []);
});

test("PackageEntity - constructor with complete package.json", () => {
	const packageJson = {
		name: "@raven/test-package",
		version: "1.2.3",
		description: "Test package description",
		main: "index.js",
		module: "index.mjs",
		exports: {
			".": {
				import: "./index.mjs",
				require: "./index.js",
			},
		},
		keywords: ["test", "package"],
		author: "Test Author <test@example.com>",
		license: "MIT",
		homepage: "https://example.com",
		repository: {
			type: "git",
			url: "https://github.com/test/repo.git",
		},
		bugs: {
			url: "https://github.com/test/repo/issues",
		},
		dependencies: {
			lodash: "^4.17.21",
		},
		devDependencies: {
			jest: "^29.0.0",
		},
		peerDependencies: {
			react: ">=16.0.0",
		},
	};

	const packageEntity = new PackageEntity(packageJson);

	strictEqual(packageEntity.name, "@raven/test-package");
	strictEqual(packageEntity.version, "1.2.3");
	strictEqual(packageEntity.description, "Test package description");
	strictEqual(packageEntity.main, "index.js");
	strictEqual(packageEntity.module, "index.mjs");
	deepStrictEqual(packageEntity.exports, packageJson.exports);
	deepStrictEqual(packageEntity.keywords, ["test", "package"]);
	strictEqual(packageEntity.author, "Test Author <test@example.com>");
	strictEqual(packageEntity.license, "MIT");
	strictEqual(packageEntity.homepage, "https://example.com");
	deepStrictEqual(packageEntity.repository, packageJson.repository);
	deepStrictEqual(packageEntity.bugs, packageJson.bugs);
	deepStrictEqual(packageEntity.dependencies, packageJson.dependencies);
	deepStrictEqual(packageEntity.devDependencies, packageJson.devDependencies);
	deepStrictEqual(packageEntity.peerDependencies, packageJson.peerDependencies);
});

test("PackageEntity - getId returns package name", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });
	strictEqual(packageEntity.getId(), "test-package");
});

test("PackageEntity - validate with valid package", () => {
	const packageEntity = new PackageEntity({
		name: "valid-package",
		version: "1.0.0",
		exports: {
			".": "./index.js",
		},
	});

	packageEntity.validate();

	strictEqual(packageEntity.isValidated, true);
	strictEqual(packageEntity.validationIssues.length, 0);
	strictEqual(packageEntity.isValid(), true);
});

test("PackageEntity - validate with invalid package name", () => {
	const packageEntity = new PackageEntity();

	packageEntity.validate();

	strictEqual(packageEntity.isValidated, false);
	strictEqual(packageEntity.validationIssues.length, 1); // Only missing name (0.0.0 is valid semver)
	strictEqual(packageEntity.validationIssues[0].type, "missing_name");
	strictEqual(packageEntity.isValid(), false);
});

test("PackageEntity - validate with invalid semver", () => {
	const packageEntity = new PackageEntity({
		name: "valid-package",
		version: "not-a-version",
	});

	packageEntity.validate();

	strictEqual(packageEntity.isValidated, false);
	strictEqual(
		packageEntity.validationIssues.some(
			(issue) => issue.type === "invalid_version",
		),
		true,
	);
});

test("PackageEntity - isValidSemver", () => {
	const packageEntity = new PackageEntity();

	strictEqual(packageEntity.isValidSemver("1.0.0"), true);
	strictEqual(packageEntity.isValidSemver("1.2.3-alpha.1"), true);
	strictEqual(packageEntity.isValidSemver("1.0.0+build.1"), true);
	strictEqual(packageEntity.isValidSemver("not-a-version"), false);
	strictEqual(packageEntity.isValidSemver("1.0"), false);
	strictEqual(packageEntity.isValidSemver("1.0.0.0"), false);
});

test("PackageEntity - getEntryPoints", () => {
	const packageEntity = new PackageEntity({
		main: "index.js",
		module: "index.mjs",
		exports: {
			".": {
				import: "./index.mjs",
				require: "./index.js",
				default: "./index.js",
			},
			"./sub": "./sub.js",
		},
	});

	const entryPoints = packageEntity.getEntryPoints();

	strictEqual(entryPoints.length, 6);
	strictEqual(
		entryPoints.some((ep) => ep.type === "main" && ep.path === "index.js"),
		true,
	);
	strictEqual(
		entryPoints.some((ep) => ep.type === "module" && ep.path === "index.mjs"),
		true,
	);
	strictEqual(
		entryPoints.some((ep) => ep.type === "import" && ep.path === "./index.mjs"),
		true,
	);
	strictEqual(
		entryPoints.some((ep) => ep.type === "require" && ep.path === "./index.js"),
		true,
	);
	strictEqual(
		entryPoints.some((ep) => ep.type === "default" && ep.path === "./index.js"),
		true,
	);
	strictEqual(
		entryPoints.some((ep) => ep.type === "export" && ep.path === "./sub.js"),
		true,
	);
});

test("PackageEntity - validateExports with circular references", () => {
	const circularExports = {};
	circularExports.self = circularExports; // Create circular reference

	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
		exports: circularExports,
	});

	packageEntity.validate();

	strictEqual(
		packageEntity.validationIssues.some(
			(issue) => issue.type === "invalid_exports",
		),
		true,
	);
});

test("PackageEntity - getSerializableData", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
	});

	const data = packageEntity.getSerializableData();

	strictEqual(data.name, "test-package");
	strictEqual(data.version, "1.0.0");
	strictEqual(Array.isArray(data.entryPoints), true);
	strictEqual(Array.isArray(data.validationIssues), true);
});

test("PackageEntity - toJSON", () => {
	const packageEntity = new PackageEntity({ name: "test-package" });

	const json = packageEntity.toJSON();

	strictEqual(json.__type, "package");
	strictEqual(typeof json.__data, "object");
	strictEqual(json.__data.name, "test-package");
});

test("PackageEntity - toHTML", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
		description: "Test description",
		license: "MIT",
		keywords: ["test", "package"],
		main: "index.js",
	});

	const html = packageEntity.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("test-package"), true);
	strictEqual(html.includes("1.0.0"), true);
	strictEqual(html.includes("Test description"), true);
	strictEqual(html.includes("MIT"), true);
	strictEqual(html.includes("test"), true);
	strictEqual(html.includes("index.js"), true);
});

test("PackageEntity - toHTML with minimal package (no optional fields)", () => {
	const packageEntity = new PackageEntity({
		name: "minimal-package",
		version: "1.0.0",
		// No description, license, keywords, or entry points
	});

	const html = packageEntity.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("minimal-package"), true);
	strictEqual(html.includes("1.0.0"), true);
	// Should not include optional sections
	strictEqual(html.includes("package-license"), false);
	strictEqual(html.includes("package-description"), false);
	strictEqual(html.includes("Entry Points"), false);
	strictEqual(html.includes("Keywords"), false);
});

test("PackageEntity - toMarkdown", () => {
	const packageEntity = new PackageEntity({
		name: "test-package",
		version: "1.0.0",
		description: "Test description",
		license: "MIT",
		keywords: ["test", "package"],
		main: "index.js",
	});

	const markdown = packageEntity.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("# test-package"), true);
	strictEqual(markdown.includes("**Version:** 1.0.0"), true);
	strictEqual(markdown.includes("Test description"), true);
	strictEqual(markdown.includes("**License:** MIT"), true);
	strictEqual(markdown.includes("test, package"), true);
});

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
