/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Module entity model tests - comprehensive validation coverage.
 */

import { deepStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { ModuleEntity } from "./module-entity.js";

test("ModuleEntity - constructor initialization", () => {
	const module = new ModuleEntity("test-module", "/path/to/module.js");

	strictEqual(module.id, "test-module");
	strictEqual(module.path, "/path/to/module.js");
	deepStrictEqual(module.imports, []);
	deepStrictEqual(module.exports, []);
	deepStrictEqual(module.entityIds, []);
	strictEqual(module.fileSize, 0);
	strictEqual(module.lineCount, 0);
	strictEqual(module.lastModified, null);
	strictEqual(module.description, "");
	strictEqual(module.fileDocComment, "");
	strictEqual(module.isValidated, false);
	deepStrictEqual(module.validationIssues, []);
});

test("ModuleEntity - getId returns module ID", () => {
	const module = new ModuleEntity("test-id", "/path");
	strictEqual(module.getId(), "test-id");
});

test("ModuleEntity - addImport with new import", () => {
	const module = new ModuleEntity("test", "/path");
	const specifiers = [
		{ type: "ImportSpecifier", imported: "foo", local: "foo" },
		{ type: "ImportSpecifier", imported: "bar", local: "bar" },
	];

	module.addImport("./utils", specifiers, false);

	strictEqual(module.imports.length, 1);
	strictEqual(module.imports[0].source, "./utils");
	deepStrictEqual(module.imports[0].specifiers, specifiers);
	strictEqual(module.imports[0].isDefault, false);
});

test("ModuleEntity - addImport with default import", () => {
	const module = new ModuleEntity("test", "/path");
	const specifiers = [
		{ type: "ImportDefaultSpecifier", imported: "default", local: "React" },
	];

	module.addImport("react", specifiers, true);

	strictEqual(module.imports.length, 1);
	strictEqual(module.imports[0].source, "react");
	strictEqual(module.imports[0].isDefault, true);
});

test("ModuleEntity - addImport with existing source merges specifiers", () => {
	const module = new ModuleEntity("test", "/path");

	module.addImport(
		"./utils",
		[{ type: "ImportSpecifier", imported: "foo", local: "foo" }],
		false,
	);
	module.addImport(
		"./utils",
		[{ type: "ImportSpecifier", imported: "bar", local: "bar" }],
		true,
	);

	strictEqual(module.imports.length, 1);
	strictEqual(module.imports[0].specifiers.length, 2);
	strictEqual(module.imports[0].isDefault, true); // Should be updated to true
});

test("ModuleEntity - addImport avoids duplicate specifiers", () => {
	const module = new ModuleEntity("test", "/path");
	const spec = { type: "ImportSpecifier", imported: "foo", local: "foo" };

	module.addImport("./utils", [spec], false);
	module.addImport("./utils", [spec], false); // Same specifier again

	strictEqual(module.imports.length, 1);
	strictEqual(module.imports[0].specifiers.length, 1); // Should not duplicate
});

test("ModuleEntity - addImport with empty specifiers", () => {
	const module = new ModuleEntity("test", "/path");

	module.addImport("./side-effect");

	strictEqual(module.imports.length, 1);
	strictEqual(module.imports[0].source, "./side-effect");
	deepStrictEqual(module.imports[0].specifiers, []);
	strictEqual(module.imports[0].isDefault, false);
});

test("ModuleEntity - addExport with new export", () => {
	const module = new ModuleEntity("test", "/path");

	module.addExport("MyClass");
	module.addExport("myFunction");

	deepStrictEqual(module.exports, ["MyClass", "myFunction"]);
});

test("ModuleEntity - addExport avoids duplicates", () => {
	const module = new ModuleEntity("test", "/path");

	module.addExport("MyClass");
	module.addExport("MyClass"); // Duplicate

	deepStrictEqual(module.exports, ["MyClass"]);
});

test("ModuleEntity - addEntity with new entity", () => {
	const module = new ModuleEntity("test", "/path");

	module.addEntity("entity1");
	module.addEntity("entity2");

	deepStrictEqual(module.entityIds, ["entity1", "entity2"]);
});

test("ModuleEntity - addEntity avoids duplicates", () => {
	const module = new ModuleEntity("test", "/path");

	module.addEntity("entity1");
	module.addEntity("entity1"); // Duplicate

	deepStrictEqual(module.entityIds, ["entity1"]);
});

test("ModuleEntity - setMetadata with all fields", () => {
	const module = new ModuleEntity("test", "/path");
	const lastModified = new Date();

	module.setMetadata({
		fileSize: 2048,
		lineCount: 150,
		lastModified,
	});

	strictEqual(module.fileSize, 2048);
	strictEqual(module.lineCount, 150);
	strictEqual(module.lastModified, lastModified);
});

test("ModuleEntity - setMetadata with partial fields", () => {
	const module = new ModuleEntity("test", "/path");

	module.setMetadata({ fileSize: 1024 });
	strictEqual(module.fileSize, 1024);
	strictEqual(module.lineCount, 0);
	strictEqual(module.lastModified, null);

	module.setMetadata({ lineCount: 100 });
	strictEqual(module.fileSize, 1024);
	strictEqual(module.lineCount, 100);
});

test("ModuleEntity - setDocumentation with all fields", () => {
	const module = new ModuleEntity("test", "/path");

	module.setDocumentation(
		"Module description",
		"/** @file Module doc comment */",
	);

	strictEqual(module.description, "Module description");
	strictEqual(module.fileDocComment, "/** @file Module doc comment */");
});

test("ModuleEntity - setDocumentation with default values", () => {
	const module = new ModuleEntity("test", "/path");

	module.setDocumentation();

	strictEqual(module.description, "");
	strictEqual(module.fileDocComment, "");
});

test("ModuleEntity - getImportedModules", () => {
	const module = new ModuleEntity("test", "/path");

	module.addImport("react");
	module.addImport("./utils");
	module.addImport("lodash");

	const imported = module.getImportedModules();

	deepStrictEqual(imported, ["react", "./utils", "lodash"]);
});

test("ModuleEntity - getExternalDependencies", () => {
	const module = new ModuleEntity("test", "/path");

	module.addImport("react"); // External
	module.addImport("./utils"); // Internal
	module.addImport("lodash"); // External
	module.addImport("../config"); // Internal
	module.addImport("/absolute/path"); // Internal

	const external = module.getExternalDependencies();

	deepStrictEqual(external, ["react", "lodash"]);
});

test("ModuleEntity - getInternalDependencies", () => {
	const module = new ModuleEntity("test", "/path");

	module.addImport("react"); // External
	module.addImport("./utils"); // Internal
	module.addImport("lodash"); // External
	module.addImport("../config"); // Internal
	module.addImport("/absolute/path"); // Internal

	const internal = module.getInternalDependencies();

	deepStrictEqual(internal, ["./utils", "../config", "/absolute/path"]);
});

test("ModuleEntity - validate with missing ID", () => {
	const module = new ModuleEntity("", "/path");

	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some((issue) => issue.type === "missing_id"),
		true,
	);
	strictEqual(module.isValid(), false);
});

test("ModuleEntity - validate with missing path", () => {
	const module = new ModuleEntity("test", "");

	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some((issue) => issue.type === "missing_path"),
		true,
	);
});

test("ModuleEntity - validate with circular import", () => {
	const module = new ModuleEntity("test-module", "/path/test-module.js");

	module.addImport("./test-module");
	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some((issue) => issue.type === "circular_import"),
		true,
	);
});

test("ModuleEntity - validate with circular import using path", () => {
	const module = new ModuleEntity("test-module", "/path/test-module.js");

	module.addImport("/path/test-module.js");
	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some((issue) => issue.type === "circular_import"),
		true,
	);
});

test("ModuleEntity - validate with invalid import specifier", () => {
	const module = new ModuleEntity("test", "/path");

	// Add import with invalid specifier (missing imported or local)
	module.addImport("./utils", [
		{ type: "ImportSpecifier", imported: "", local: "foo" },
	]);
	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some(
			(issue) => issue.type === "invalid_import_specifier",
		),
		true,
	);
});

test("ModuleEntity - validate with another invalid import specifier", () => {
	const module = new ModuleEntity("test", "/path");

	// Add import with invalid specifier (missing local)
	module.addImport("./utils", [
		{ type: "ImportSpecifier", imported: "foo", local: "" },
	]);
	module.validate();

	strictEqual(module.isValidated, false);
	strictEqual(
		module.validationIssues.some(
			(issue) => issue.type === "invalid_import_specifier",
		),
		true,
	);
});

test("ModuleEntity - validate with all valid fields", () => {
	const module = new ModuleEntity("test", "/path/module.js");
	module.addImport("react", [
		{ type: "ImportDefaultSpecifier", imported: "default", local: "React" },
	]);
	module.addExport("MyComponent");
	module.addEntity("entity1");

	module.validate();

	strictEqual(module.isValidated, true);
	strictEqual(module.validationIssues.length, 0);
	strictEqual(module.isValid(), true);
});

test("ModuleEntity - getStatistics", () => {
	const module = new ModuleEntity("test", "/path");
	module.entityIds = ["entity1", "entity2"];
	module.addImport("react");
	module.addImport("./utils");
	module.exports = ["Component1", "Component2", "utils"];

	const stats = module.getStatistics();

	strictEqual(stats.entityCount, 2);
	strictEqual(stats.importCount, 2);
	strictEqual(stats.exportCount, 3);
	strictEqual(stats.externalDeps, 1); // Only 'react'
});

test("ModuleEntity - getSerializableData", () => {
	const module = new ModuleEntity("test", "/path/module.js");
	module.addImport("react");
	module.addExport("Component");
	module.addEntity("entity1");
	module.setMetadata({ fileSize: 1024, lineCount: 50 });
	module.setDocumentation("Test module", "/** @file Test */");

	const data = module.getSerializableData();

	strictEqual(data.id, "test");
	strictEqual(data.path, "/path/module.js");
	strictEqual(Array.isArray(data.imports), true);
	strictEqual(Array.isArray(data.exports), true);
	strictEqual(Array.isArray(data.entityIds), true);
	strictEqual(data.fileSize, 1024);
	strictEqual(data.lineCount, 50);
	strictEqual(data.description, "Test module");
	strictEqual(data.fileDocComment, "/** @file Test */");
	strictEqual(typeof data.statistics, "object");
});

test("ModuleEntity - toJSON", () => {
	const module = new ModuleEntity("test", "/path");

	const json = module.toJSON();

	strictEqual(json.__type, "module");
	strictEqual(typeof json.__data, "object");
	strictEqual(json.__data.id, "test");
});

test("ModuleEntity - toHTML with comprehensive content", () => {
	const module = new ModuleEntity("test-module", "/path/module.js");
	module.description = "A test module";
	module.lineCount = 100;
	module.addExport("Component");
	module.addExport("utils");
	module.addImport("react");
	module.addImport("lodash");
	module.addImport("./local-utils");

	const html = module.toHTML();

	strictEqual(typeof html, "string");
	strictEqual(html.includes("test-module"), true);
	strictEqual(html.includes("/path/module.js"), true);
	strictEqual(html.includes("A test module"), true);
	strictEqual(html.includes("100 lines"), true);
	strictEqual(html.includes("Component"), true);
	strictEqual(html.includes("utils"), true);
	strictEqual(html.includes("react"), true);
	strictEqual(html.includes("lodash"), true);
	strictEqual(html.includes("./local-utils"), true);
});

test("ModuleEntity - toHTML without optional content", () => {
	const module = new ModuleEntity("test", "/path");

	const html = module.toHTML();

	strictEqual(typeof html, "string");

	// Should not include export/dependency sections, only stats
	strictEqual(html.includes("<h3>Exports</h3>"), false);
	strictEqual(html.includes("External Dependencies"), false);
	strictEqual(html.includes("Internal Dependencies"), false);

	// But should include stats showing 0 exports
	strictEqual(html.includes("<strong>Exports:</strong> 0"), true);
});

test("ModuleEntity - toMarkdown with comprehensive content", () => {
	const module = new ModuleEntity("test-module", "/path/module.js");
	module.description = "A test module";
	module.lineCount = 100;
	module.addExport("Component");
	module.addExport("utils");
	module.addImport("react");
	module.addImport("lodash");
	module.addImport("./local-utils");

	const markdown = module.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("## test-module"), true);
	strictEqual(markdown.includes("**Path:** `/path/module.js`"), true);
	strictEqual(markdown.includes("**Lines:** 100"), true);
	strictEqual(markdown.includes("A test module"), true);
	strictEqual(markdown.includes("**Exports:**"), true);
	strictEqual(markdown.includes("- `Component`"), true);
	strictEqual(markdown.includes("- `utils`"), true);
	strictEqual(markdown.includes("**External Dependencies:**"), true);
	strictEqual(markdown.includes("- `react`"), true);
	strictEqual(markdown.includes("- `lodash`"), true);
});

test("ModuleEntity - toMarkdown without optional content", () => {
	const module = new ModuleEntity("test", "/path");
	module.lineCount = 50;

	const markdown = module.toMarkdown();

	strictEqual(typeof markdown, "string");
	strictEqual(markdown.includes("## test"), true);
	strictEqual(markdown.includes("**Lines:** 50"), true);
	strictEqual(markdown.includes("**Exports:**"), false);
	strictEqual(markdown.includes("**External Dependencies:**"), false);
});

test("ModuleEntity - edge cases and error conditions", () => {
	// Test with null/undefined values in setMetadata
	const module = new ModuleEntity("test", "/path");
	module.setMetadata({});
	strictEqual(module.fileSize, 0);
	strictEqual(module.lineCount, 0);
	strictEqual(module.lastModified, null);

	// Test import with no specifiers and no isDefault parameter
	module.addImport("./test");
	strictEqual(module.imports[0].isDefault, false);

	// Test empty getters
	const emptyModule = new ModuleEntity("empty", "/path");
	deepStrictEqual(emptyModule.getImportedModules(), []);
	deepStrictEqual(emptyModule.getExternalDependencies(), []);
	deepStrictEqual(emptyModule.getInternalDependencies(), []);

	// Test statistics with empty module
	const emptyStats = emptyModule.getStatistics();
	strictEqual(emptyStats.entityCount, 0);
	strictEqual(emptyStats.importCount, 0);
	strictEqual(emptyStats.exportCount, 0);
	strictEqual(emptyStats.externalDeps, 0);
});
